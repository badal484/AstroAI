import type {
  PricingSnapshot,
  VoiceAudioFormat,
  VoiceEndReason,
  VoiceSessionStatus,
} from '@astroai/shared-types';
import {
  VoiceSessionModel,
  type VoiceSessionDocument,
} from './voiceSession.model';

export const voiceRepository = {
  async findSessionById(id: string): Promise<VoiceSessionDocument | null> {
    return VoiceSessionModel.findById(id);
  },

  async findSessionByUserAndIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<VoiceSessionDocument | null> {
    return VoiceSessionModel.findOne({ userId, idempotencyKey });
  },

  async createSession(data: {
    userId: string;
    astrologerId: string;
    birthProfileId?: string | null;
    language?: string;
    status: VoiceSessionStatus;
    pricingSnapshot: PricingSnapshot;
    holdId: string | null;
    idempotencyKey: string;
  }): Promise<VoiceSessionDocument> {
    const [doc] = await VoiceSessionModel.create([data]);
    return doc!;
  },

  async updateSessionStatus(
    sessionId: string,
    status: VoiceSessionStatus,
    updates: {
      endedAt?: Date | null;
      durationSeconds?: number;
      billableSeconds?: number;
      creditsCharged?: number;
      endReason?: VoiceEndReason | null;
      failureReason?: string | null;
    } = {},
  ): Promise<VoiceSessionDocument | null> {
    return VoiceSessionModel.findByIdAndUpdate(
      sessionId,
      { $set: { status, ...updates } },
      { new: true },
    );
  },

  async updateHeartbeat(
    sessionId: string,
    durationSeconds: number,
  ): Promise<VoiceSessionDocument | null> {
    return VoiceSessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          lastHeartbeatAt: new Date(),
          durationSeconds,
        },
      },
      { new: true },
    );
  },

  async appendTurn(
    sessionId: string,
    turn: {
      turnIndex: number;
      userTranscription: string;
      assistantText: string;
      audioUrl?: string | null;
      audioFormat: VoiceAudioFormat;
      latencyMs: {
        sttMs: number;
        llmMs: number;
        ttsMs: number;
        totalMs: number;
      };
      durationSeconds: number;
    },
  ): Promise<VoiceSessionDocument | null> {
    return VoiceSessionModel.findByIdAndUpdate(
      sessionId,
      {
        $push: { turns: turn },
        $set: { lastHeartbeatAt: new Date() },
      },
      { new: true },
    );
  },

  async listUserSessions(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<VoiceSessionDocument[]> {
    const query: Record<string, unknown> = { userId };
    if (cursor) {
      query._id = { $lt: cursor };
    }
    return VoiceSessionModel.find(query)
      .sort({ _id: -1 })
      .limit(limit);
  },

  async listAllSessions(
    limit = 20,
    cursor?: string,
    status?: VoiceSessionStatus,
  ): Promise<VoiceSessionDocument[]> {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (cursor) query._id = { $lt: cursor };

    return VoiceSessionModel.find(query)
      .sort({ _id: -1 })
      .limit(limit);
  },
};
