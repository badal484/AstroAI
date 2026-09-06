import crypto from 'node:crypto';
import argon2 from 'argon2';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AdminRole,
  VoiceEndReason,
  VoiceSessionStatus,
  WalletTransactionSource,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { mockSTTAdapter } from '../../src/modules/voice/providers/stt/mockSTT.adapter';
import { mockTTSAdapter } from '../../src/modules/voice/providers/tts/mockTTS.adapter';
import { userService } from '../../src/modules/users';
import { walletService } from '../../src/modules/wallet/wallet.service';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: 'Voice Admin', role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

async function createAuthedUser(initialCredits = 50) {
  const user = await userService.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Voice Test User',
    avatarUrl: null,
  });
  if (initialCredits > 0) {
    await walletService.credit(user.id, {
      amount: initialCredits,
      source: WalletTransactionSource.SIGNUP_BONUS,
      idempotencyKey: `init_credit_${crypto.randomUUID()}`,
    });
  }
  const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
  return { user, token };
}

describe('Voice Astrologer Session & Billing Integration Tests', () => {
  beforeEach(() => {
    mockSTTAdapter.setMockResponse(null, false);
    mockTTSAdapter.setShouldFail(false);
  });

  describe('Session Initiation & Wallet Hold', () => {
    it('rejects starting voice session if user balance is insufficient', async () => {
      const { token } = await createAuthedUser(0); // 0 credits

      const res = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_init_fail_1',
        });

      expect(res.status).toBe(402);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VOICE_INSUFFICIENT_BALANCE');
    });

    it('successfully initiates session and creates wallet hold', async () => {
      const { user, token } = await createAuthedUser(100);

      const res = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          language: 'en',
          idempotencyKey: 'voice_init_success_1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeTruthy();
      expect(res.body.data.status).toBe(VoiceSessionStatus.ACTIVE);
      expect(res.body.data.holdId).toBeTruthy();

      // Check held balance in wallet
      const balance = await walletService.getBalance(user.id);
      expect(balance.heldBalance).toBeGreaterThan(0);
    });

    it('returns existing session idempotently when called with identical idempotencyKey', async () => {
      const { token } = await createAuthedUser(100);

      const res1 = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_idempotent_1',
        });

      const res2 = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_idempotent_1',
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.id).toBe(res2.body.data.id);
    });
  });

  describe('Voice Turn Pipeline (STT -> LLM -> TTS)', () => {
    it('processes user audio turn and returns synthesized assistant speech', async () => {
      const { token } = await createAuthedUser(100);

      const initRes = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_turn_test_1',
        });
      const sessionId = initRes.body.data.id;

      mockSTTAdapter.setMockResponse('Will I get a promotion in my career soon?');

      const turnRes = await request(app)
        .post(`/api/v1/voice/sessions/${sessionId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          audioBase64: Buffer.from('FAKE_AUDIO_SAMPLE').toString('base64'),
          audioFormat: 'webm',
        });

      expect(turnRes.status).toBe(200);
      expect(turnRes.body.success).toBe(true);
      expect(turnRes.body.data.turn.userTranscription).toBe('Will I get a promotion in my career soon?');
      expect(turnRes.body.data.turn.assistantText).toBeTruthy();
      expect(turnRes.body.data.audioBase64).toBeTruthy();
      expect(turnRes.body.data.turn.latencyMs.sttMs).toBeGreaterThan(0);
      expect(turnRes.body.data.turn.latencyMs.ttsMs).toBeGreaterThan(0);
    });
  });

  describe('Heartbeats & Session Duration', () => {
    it('updates heartbeat and returns remaining call seconds', async () => {
      const { token } = await createAuthedUser(100);

      const initRes = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_heartbeat_test_1',
        });
      const sessionId = initRes.body.data.id;

      const hbRes = await request(app)
        .post(`/api/v1/voice/sessions/${sessionId}/heartbeat`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentDurationSeconds: 45,
        });

      expect(hbRes.status).toBe(200);
      expect(hbRes.body.success).toBe(true);
      expect(hbRes.body.data.shouldEnd).toBe(false);
      expect(hbRes.body.data.remainingSeconds).toBeGreaterThan(0);
    });
  });

  describe('Call Termination & Financial Settlement', () => {
    it('releases hold and charges 0 credits if call ends within free tier (e.g. 20s)', async () => {
      const { user, token } = await createAuthedUser(100);

      const initRes = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_free_tier_test',
        });
      const sessionId = initRes.body.data.id;

      const endRes = await request(app)
        .post(`/api/v1/voice/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: VoiceEndReason.USER_ENDED,
          clientDurationSeconds: 20, // < 30s free tier
        });

      expect(endRes.status).toBe(200);
      expect(endRes.body.data.creditsCharged).toBe(0);
      expect(endRes.body.data.isFreeTier).toBe(true);

      // Check that held balance was fully released and user has full 100 credits
      const balance = await walletService.getBalance(user.id);
      expect(balance.heldBalance).toBe(0);
      expect(balance.balance).toBe(100);
    });

    it('captures hold and debits wallet for billable duration (> 30s)', async () => {
      const { user, token } = await createAuthedUser(100);

      const initRes = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_billable_test',
        });
      const sessionId = initRes.body.data.id;

      const endRes = await request(app)
        .post(`/api/v1/voice/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: VoiceEndReason.USER_ENDED,
          clientDurationSeconds: 95, // 95s - 30s free = 65s billable = 2 mins (10 credits)
        });

      expect(endRes.status).toBe(200);
      expect(endRes.body.data.creditsCharged).toBeGreaterThan(0);
      expect(endRes.body.data.billableSeconds).toBe(65);

      const balance = await walletService.getBalance(user.id);
      expect(balance.heldBalance).toBe(0);
      expect(balance.balance).toBe(100 - endRes.body.data.creditsCharged);
    });

    it('terminates immediately and releases hold when provider fails', async () => {
      const { user, token } = await createAuthedUser(100);

      const initRes = await request(app)
        .post('/api/v1/voice/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          astrologerId: 'vedic-sage-1',
          idempotencyKey: 'voice_provider_fail_test',
        });
      const sessionId = initRes.body.data.id;

      mockSTTAdapter.setMockResponse(null, true); // Force STT failure

      const turnRes = await request(app)
        .post(`/api/v1/voice/sessions/${sessionId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          audioBase64: Buffer.from('FAKE_AUDIO_SAMPLE').toString('base64'),
          audioFormat: 'webm',
        });

      expect(turnRes.status).toBe(502);

      // Verify session was marked FAILED and wallet hold released
      const detailsRes = await request(app)
        .get(`/api/v1/voice/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(detailsRes.body.data.session.status).toBe(VoiceSessionStatus.FAILED);
      expect(detailsRes.body.data.session.creditsCharged).toBe(0);

      const balance = await walletService.getBalance(user.id);
      expect(balance.heldBalance).toBe(0);
      expect(balance.balance).toBe(100);
    });
  });

  describe('Admin Voice Inspection & Configuration', () => {
    it('allows admin with VOICE_READ permission to list sessions and view call turns', async () => {
      const { accessCookie } = await createAdminAndLogin(
        AdminRole.OPERATIONS,
        `voice-admin-${Date.now()}@example.com`,
      );

      const res = await request(app)
        .get('/api/v1/admin/voice/sessions')
        .set('Cookie', accessCookie!);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });
});
