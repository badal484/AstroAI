import {
  PricingSnapshot,
  VoiceAudioFormat,
  VoiceEndReason,
  VoiceSessionStatus,
  WalletTransactionSource,
  type EndVoiceSessionInput,
  type PaginatedResult,
  type StartVoiceSessionInput,
  type VoiceHeartbeatInput,
  type VoiceSessionDTO,
  type VoiceSessionSummaryDTO,
  type VoiceTurnDTO,
  type VoiceTurnInput,
} from '@astroai/shared-types';
import {
  AppError,
  UnauthorizedError,
  VoiceInsufficientBalanceError,
  VoiceSessionAlreadyEndedError,
  VoiceSessionNotFoundError,
  VoiceSTTFailedError,
  VoiceTTSFailedError,
} from '../../shared/errors';
import { logger } from '../../shared/logger';
import { generateAstrologerResponse } from '../astrologer';
import { pricingService } from '../pricing/pricing.service';
import { walletService } from '../wallet/wallet.service';
import { voiceRegistry } from './providers/voiceRegistry';
import { voiceRepository } from './voice.repository';
import { VoiceSessionModel } from './voiceSession.model';
import type { VoiceSessionDocument } from './voiceSession.model';

function toPricingSnapshot(snap: any): PricingSnapshot {
  return {
    pricingVersion: snap.pricingVersion,
    unitPrice: snap.unitPrice,
    netAmount: snap.netAmount,
    unitsCalculated: snap.unitsCalculated ?? undefined,
    billingUnit: snap.billingUnit ?? undefined,
    discountAppliedPercent: snap.discountAppliedPercent ?? undefined,
    grossAmount: snap.grossAmount ?? undefined,
  };
}

function toTurnDTO(turn: any): VoiceTurnDTO {
  return {
    id: turn._id ? turn._id.toString() : turn.id || `turn_${Date.now()}`,
    turnIndex: turn.turnIndex,
    userTranscription: turn.userTranscription,
    assistantText: turn.assistantText,
    audioUrl: turn.audioUrl ?? null,
    audioFormat: turn.audioFormat ?? VoiceAudioFormat.MP3,
    latencyMs: {
      sttMs: turn.latencyMs?.sttMs || 0,
      llmMs: turn.latencyMs?.llmMs || 0,
      ttsMs: turn.latencyMs?.ttsMs || 0,
      totalMs: turn.latencyMs?.totalMs || 0,
    },
    durationSeconds: turn.durationSeconds || 0,
    createdAt: turn.createdAt ? new Date(turn.createdAt).toISOString() : new Date().toISOString(),
  };
}

function toSessionDTO(doc: VoiceSessionDocument): VoiceSessionDTO {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    astrologerId: doc.astrologerId,
    birthProfileId: doc.birthProfileId ?? null,
    status: doc.status as any,
    startedAt: doc.startedAt.toISOString(),
    lastHeartbeatAt: doc.lastHeartbeatAt.toISOString(),
    endedAt: doc.endedAt ? doc.endedAt.toISOString() : null,
    durationSeconds: doc.durationSeconds,
    billableSeconds: doc.billableSeconds,
    creditsCharged: doc.creditsCharged,
    pricingSnapshot: toPricingSnapshot(doc.pricingSnapshot),
    holdId: doc.holdId ?? null,
    endReason: (doc.endReason as VoiceEndReason) ?? null,
    failureReason: doc.failureReason ?? null,
    turnCount: doc.turns ? doc.turns.length : 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const voiceService = {
  /**
   * Initiates a new Voice Consultation session, checks balance, and reserves a wallet hold.
   */
  async startSession(
    userId: string,
    input: StartVoiceSessionInput,
  ): Promise<VoiceSessionDTO> {
    // 1. Idempotency check: return active session if key matches
    const existing = await voiceRepository.findSessionByUserAndIdempotencyKey(
      userId,
      input.idempotencyKey,
    );
    if (existing && existing.status === VoiceSessionStatus.ACTIVE) {
      return toSessionDTO(existing);
    }

    // 2. Fetch active voice pricing configuration
    const activePricing = await pricingService.getActiveConfig();
    const { voice } = activePricing;

    // 3. Estimate hold amount (minimum charge + initial call buffer)
    const initialHoldAmount = Math.max(
      voice.minimumChargeCredits || 1,
      voice.creditsPerUnit * 5, // Reserve 5 minutes / units buffer
    );

    // 4. Verify wallet balance & reserve hold
    const balance = await walletService.getBalance(userId);
    const minRequired = Math.max(1, voice.minimumChargeCredits || 1);

    if (balance.availableBalance < minRequired) {
      throw new VoiceInsufficientBalanceError(
        `Insufficient balance to start voice session. Available: ${balance.availableBalance} Credits, Required: ${minRequired} Credits.`,
      );
    }

    let holdId: string | null = null;
    const holdAmount = Math.min(balance.availableBalance, initialHoldAmount);

    try {
      const hold = await walletService.reserve(userId, {
        amount: holdAmount,
        source: WalletTransactionSource.VOICE,
        referenceId: input.idempotencyKey,
        expiresInSeconds: 3600, // 1 hour max session hold
      });
      holdId = hold.id;
    } catch (err: any) {
      logger.error({ err, userId }, 'Failed to reserve wallet hold for voice session');
      throw new VoiceInsufficientBalanceError('Failed to reserve voice session credits');
    }

    // 5. Create voice session record
    const sessionDoc = await voiceRepository.createSession({
      userId,
      astrologerId: input.astrologerId,
      birthProfileId: input.birthProfileId ?? null,
      language: input.language ?? 'en',
      status: VoiceSessionStatus.ACTIVE,
      pricingSnapshot: {
        pricingVersion: activePricing.version,
        unitPrice: voice.creditsPerUnit,
        billingUnit: voice.billingUnit,
        netAmount: voice.creditsPerUnit,
      },
      holdId,
      idempotencyKey: input.idempotencyKey,
    });

    return toSessionDTO(sessionDoc);
  },

  /**
   * Processes a real-time speech turn:
   * Audio Buffer -> STT -> Intent/Astrology Context -> AI Gateway -> TTS -> Audio Buffer
   */
  async processTurn(
    userId: string,
    sessionId: string,
    input: VoiceTurnInput,
  ): Promise<{
    turn: VoiceTurnDTO;
    audioBase64: string;
    mimeType: string;
    warning?: string;
  }> {
    const session = await voiceRepository.findSessionById(sessionId);
    if (!session) {
      throw new VoiceSessionNotFoundError();
    }

    if (session.userId !== userId) {
      throw new UnauthorizedError('Session does not belong to this user');
    }

    if (session.status !== VoiceSessionStatus.ACTIVE) {
      throw new VoiceSessionAlreadyEndedError();
    }

    const turnIndex = session.turns.length + 1;
    const startTotal = Date.now();

    // 1. STT Phase: Audio In -> User Transcription
    const audioBuffer = Buffer.from(input.audioBase64, 'base64');
    let sttResult;
    try {
      sttResult = await voiceRegistry.transcribeWithFallback(
        audioBuffer,
        input.audioFormat,
        { language: input.language ?? session.language },
      );
    } catch (err: any) {
      logger.error({ err, sessionId }, 'Voice STT phase failed');
      // Terminate billing immediately on failure
      await this.handleProviderFailure(sessionId, `STT Failure: ${err?.message || 'STT provider failed'}`);
      if (err instanceof AppError) throw err;
      throw new VoiceSTTFailedError(err?.message || 'STT provider failed');
    }

    // 2. LLM Phase: Astrology Context & Persona Response
    let astrologerResponseText: string;
    let responseLanguage = (input.language ?? session.language) as string;
    const startLLM = Date.now();
    try {
      // Build brief history of prior voice turns
      const history = session.turns.slice(-6).flatMap((t) => [
        { role: 'user' as const, content: t.userTranscription },
        { role: 'assistant' as const, content: t.assistantText },
      ]);

      const spokenInstruction =
        'Speak directly as a wise, empathetic Vedic astrologer in natural, concise spoken conversational tone. Avoid markdown symbols or asterisks.';

      const res = await generateAstrologerResponse({
        userId,
        birthProfileId: session.birthProfileId ?? null,
        conversationHistory: history,
        userMessage: `${sttResult.text}\n\n[Note: This is a real-time voice call. ${spokenInstruction}]`,
        preferredLanguage: responseLanguage as any,
      });
      astrologerResponseText = res.responseText;
      responseLanguage = res.language;
    } catch (err: any) {
      logger.warn({ err, sessionId }, 'AI Gateway unconfigured or failed; using safe spoken astrological response');
      astrologerResponseText =
        'Namaste. Based on your celestial charts, the planetary energies are currently aligning favorably. Maintain focus and auspicious opportunities are unfolding.';
    }
    const llmMs = Date.now() - startLLM;

    // Clean AI response of any markdown asterisks/dashes before vocalizing
    const speechCleanedText = astrologerResponseText
      .replace(/[*_~`#>-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 3. TTS Phase: Speech Cleaned Text -> Audio Out
    let ttsResult;
    try {
      ttsResult = await voiceRegistry.synthesizeWithFallback(speechCleanedText, {
        language: responseLanguage,
      });
    } catch (err: any) {
      logger.error({ err, sessionId }, 'Voice TTS phase failed');
      await this.handleProviderFailure(sessionId, `TTS Failure: ${err?.message || 'TTS provider failed'}`);
      if (err instanceof AppError) throw err;
      throw new VoiceTTSFailedError(err?.message || 'TTS provider failed');
    }

    const totalMs = Date.now() - startTotal;

    // 4. Record Turn in Session
    const turnData = {
      turnIndex,
      userTranscription: sttResult.text,
      assistantText: speechCleanedText,
      audioUrl: null,
      audioFormat: ttsResult.audioFormat,
      latencyMs: {
        sttMs: sttResult.latencyMs,
        llmMs,
        ttsMs: ttsResult.latencyMs,
        totalMs,
      },
      durationSeconds: ttsResult.durationSeconds,
    };

    await voiceRepository.appendTurn(sessionId, turnData);

    // 5. Calculate Mid-Call Balance & Check for Warning
    const elapsedSeconds = Math.max(
      1,
      Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
    );
    const costEstimate = await pricingService.calculateVoiceCost(elapsedSeconds);
    const balance = await walletService.getBalance(userId);

    let warning: string | undefined;
    if (balance.availableBalance <= costEstimate.finalCredits) {
      warning = 'Low balance: This call will conclude soon.';
    }

    return {
      turn: toTurnDTO({ ...turnData, _id: `turn_${turnIndex}` }),
      audioBase64: ttsResult.audioBuffer.toString('base64'),
      mimeType: ttsResult.mimeType,
      warning,
    };
  },

  /**
   * Periodic client heartbeat to keep call alive and re-check balance constraints.
   */
  async heartbeat(
    userId: string,
    sessionId: string,
    input: VoiceHeartbeatInput,
  ): Promise<{ status: VoiceSessionStatus; shouldEnd: boolean; remainingSeconds: number }> {
    const session = await voiceRepository.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new VoiceSessionNotFoundError();
    }

    if (session.status !== VoiceSessionStatus.ACTIVE) {
      return { status: session.status as any, shouldEnd: true, remainingSeconds: 0 };
    }

    await voiceRepository.updateHeartbeat(sessionId, input.currentDurationSeconds);

    const cost = await pricingService.calculateVoiceCost(input.currentDurationSeconds);
    const balance = await walletService.getBalance(userId);

    const isExhausted = balance.availableBalance < cost.finalCredits;
    const unitRate = session.pricingSnapshot.unitPrice || 1;
    const remainingCredits = Math.max(0, balance.availableBalance - cost.finalCredits);
    const remainingSeconds = Math.floor((remainingCredits / unitRate) * 60);

    return {
      status: session.status as any,
      shouldEnd: isExhausted,
      remainingSeconds,
    };
  },

  /**
   * Finalizes call billing, calculates exact billable duration according to
   * pricing rules (rounding, minimums, free tier), and captures/releases the hold.
   */
  async endSession(
    userId: string,
    sessionId: string,
    input: EndVoiceSessionInput,
  ): Promise<VoiceSessionSummaryDTO> {
    const session = await voiceRepository.findSessionById(sessionId);
    if (!session) {
      throw new VoiceSessionNotFoundError();
    }

    if (session.userId !== userId) {
      throw new UnauthorizedError('Session does not belong to this user');
    }

    // Idempotent return if already settled
    if (session.status === VoiceSessionStatus.COMPLETED || session.status === VoiceSessionStatus.FAILED) {
      const balance = await walletService.getBalance(userId);
      return {
        session: toSessionDTO(session),
        durationSeconds: session.durationSeconds,
        billableSeconds: session.billableSeconds,
        creditsCharged: session.creditsCharged,
        availableBalance: balance.availableBalance,
        isFreeTier: session.creditsCharged === 0,
      };
    }

    // Determine final duration
    const now = new Date();
    const elapsedSeconds = input.clientDurationSeconds ??
      Math.max(0, Math.floor((now.getTime() - session.startedAt.getTime()) / 1000));

    // Calculate final financial cost based on configured pricing rules
    const cost = await pricingService.calculateVoiceCost(elapsedSeconds);
    const finalCredits = cost.finalCredits;

    // Settle Wallet Hold & Create Immutable Ledger Entry
    if (session.holdId) {
      if (finalCredits > 0) {
        try {
          await walletService.capture(
            session.holdId,
            finalCredits,
            `voice_settle_${sessionId}`,
            toPricingSnapshot(session.pricingSnapshot),
          );
        } catch (err: any) {
          logger.error({ err, sessionId, finalCredits }, 'Failed to capture hold for voice session');
          // If capture fails (e.g. hold expired), fallback to direct debit
          await walletService.debit(userId, {
            amount: finalCredits,
            source: WalletTransactionSource.VOICE,
            idempotencyKey: `voice_debit_fallback_${sessionId}`,
            referenceId: sessionId,
            pricingSnapshot: toPricingSnapshot(session.pricingSnapshot),
          });
        }
      } else {
        // Free tier or zero charge -> release hold completely
        await walletService.release(session.holdId);
      }
    } else if (finalCredits > 0) {
      await walletService.debit(userId, {
        amount: finalCredits,
        source: WalletTransactionSource.VOICE,
        idempotencyKey: `voice_debit_${sessionId}`,
        referenceId: sessionId,
        pricingSnapshot: toPricingSnapshot(session.pricingSnapshot),
      });
    }

    // Update Session status to COMPLETED
    const updated = await voiceRepository.updateSessionStatus(
      sessionId,
      VoiceSessionStatus.COMPLETED,
      {
        endedAt: now,
        durationSeconds: elapsedSeconds,
        billableSeconds: cost.billableSeconds,
        creditsCharged: finalCredits,
        endReason: input.reason,
      },
    );

    const balance = await walletService.getBalance(userId);

    return {
      session: toSessionDTO(updated ?? session),
      durationSeconds: elapsedSeconds,
      billableSeconds: cost.billableSeconds,
      creditsCharged: finalCredits,
      availableBalance: balance.availableBalance,
      isFreeTier: finalCredits === 0,
    };
  },

  /**
   * Immediate billing termination and hold release on provider or connection failure.
   */
  async handleProviderFailure(sessionId: string, failureReason: string): Promise<void> {
    const session = await voiceRepository.findSessionById(sessionId);
    if (!session || session.status !== VoiceSessionStatus.ACTIVE) return;

    logger.warn({ sessionId, failureReason }, 'Terminating voice session immediately due to failure');

    if (session.holdId) {
      try {
        await walletService.release(session.holdId);
      } catch (err) {
        logger.error({ err, sessionId }, 'Failed to release hold on provider failure');
      }
    }

    await voiceRepository.updateSessionStatus(sessionId, VoiceSessionStatus.FAILED, {
      endedAt: new Date(),
      failureReason,
      endReason: VoiceEndReason.PROVIDER_ERROR,
      creditsCharged: 0,
      billableSeconds: 0,
    });
  },

  async getUserSessions(
    userId: string,
    query: { limit?: number; cursor?: string },
  ): Promise<PaginatedResult<VoiceSessionDTO>> {
    const limit = query.limit ?? 20;
    const docs = await voiceRepository.listUserSessions(userId, limit + 1, query.cursor);
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!._id.toString() : null;

    return {
      items: items.map(toSessionDTO),
      nextCursor,
    };
  },

  async adminListSessions(
    query: { limit?: number; cursor?: string; status?: any },
  ): Promise<PaginatedResult<VoiceSessionDTO>> {
    const limit = query.limit ?? 20;
    const docs = await voiceRepository.listAllSessions(limit + 1, query.cursor, query.status);
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!._id.toString() : null;

    return {
      items: items.map(toSessionDTO),
      nextCursor,
    };
  },

  async getSessionDetails(sessionId: string): Promise<{
    session: VoiceSessionDTO;
    turns: VoiceTurnDTO[];
  }> {
    const session = await voiceRepository.findSessionById(sessionId);
    if (!session) {
      throw new VoiceSessionNotFoundError();
    }

    return {
      session: toSessionDTO(session),
      turns: (session.turns || []).map(toTurnDTO),
    };
  },

  /**
   * Cleans up and settles voice sessions abandoned due to client disconnection or app kill.
   */
  async reconcileStaleVoiceSessions(staleThresholdMs = 2 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - staleThresholdMs);
    const staleSessions = await VoiceSessionModel.find({
      status: VoiceSessionStatus.ACTIVE,
      lastHeartbeatAt: { $lt: cutoff },
    }).exec();

    let settledCount = 0;
    for (const s of staleSessions) {
      try {
        const elapsed = Math.max(0, Math.floor((s.lastHeartbeatAt.getTime() - s.startedAt.getTime()) / 1000));
        await this.endSession(s.userId, s._id.toString(), {
          clientDurationSeconds: elapsed,
          reason: VoiceEndReason.TIMEOUT,
        });
        settledCount++;
      } catch (err) {
        logger.error({ err, sessionId: s._id }, 'Failed to reconcile stale voice session');
      }
    }
    return settledCount;
  },
};
