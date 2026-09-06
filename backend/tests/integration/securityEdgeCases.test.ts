import argon2 from 'argon2';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AccountStatus,
  AICapability,
  AdminRole,
  AIProviderName,
  ModelAlias,
  PaymentOrderStatus,
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionStatus,
  PromotionTarget,
  PromotionType,
  ReportType,
  WalletTransactionSource,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { redis } from '../../src/lib/redis';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { AdminUserModel } from '../../src/modules/admin/adminUser.model';
import { aiConfigService } from '../../src/modules/ai/aiConfig.service';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../src/modules/ai/registry';
import { routeCall } from '../../src/modules/ai/router/modelRouter';
import { BirthProfileModel } from '../../src/modules/birthProfiles/birthProfile.model';
import { conversationRepository } from '../../src/modules/chat/conversation.repository';
import { chatService } from '../../src/modules/chat/chat.service';
import { PaymentOrderModel } from '../../src/modules/payments/paymentOrder.model';
import { paymentRepository } from '../../src/modules/payments/payment.repository';
import { paymentService } from '../../src/modules/payments/payment.service';
import { razorpayGateway } from '../../src/modules/payments/razorpayGateway';
import { PromotionModel } from '../../src/modules/promotions/models/promotion.model';
import { referralService } from '../../src/modules/promotions/referral.service';
import { reportRepository } from '../../src/modules/reports/report.repository';
import { reportService } from '../../src/modules/reports/report.service';
import { userService } from '../../src/modules/users/user.service';
import { voiceRepository } from '../../src/modules/voice/voice.repository';
import { voiceService } from '../../src/modules/voice/voice.service';
import { VoiceSessionModel } from '../../src/modules/voice/voiceSession.model';
import { WalletHoldModel } from '../../src/modules/wallet/hold.model';
import { walletService } from '../../src/modules/wallet/wallet.service';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

function fakeAdapter(
  providerName: AIProviderName,
  capabilities: AICapability[] = [AICapability.TEXT_GENERATION],
) {
  return {
    providerName,
    capabilities: new Set(capabilities),
    generateText: vi.fn(),
    streamText: vi.fn(),
    generateStructured: vi.fn(),
    generateEmbedding: vi.fn(),
  };
}

async function createAdminAndGetCookie(
  role: AdminRole,
  email = 'sec_admin@astroai.test',
  status = AccountStatus.ACTIVE,
) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const admin = await adminUserRepository.create({
    email,
    passwordHash,
    name: `Admin ${role}`,
    role,
  });
  if (status && status !== 'active') {
    await AdminUserModel.findByIdAndUpdate(admin._id, { status });
  }

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { admin, accessCookie };
}

describe('Dedicated Security & Edge-Case Verification Suite', () => {
  let user: any;
  let userToken: string;
  let authHeader: string;

  beforeEach(async () => {
    await redis.flushall();
    __resetProviderRegistryForTests();
    vi.restoreAllMocks();

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key]?.deleteMany({});
    }

    user = await userService.createUser({
      email: 'seeker.edge@astroai.test',
      name: 'Seeker Edge',
      avatarUrl: null,
    });
    const { token } = signAccessToken(
      { sub: user._id.toString(), role: 'user' },
      env.JWT_ACCESS_SECRET,
      900,
    );
    userToken = token;
    authHeader = `Bearer ${userToken}`;

    await walletService.credit(user._id.toString(), {
      amount: 1000,
      source: WalletTransactionSource.SIGNUP_BONUS,
      idempotencyKey: `init_credit_${user._id}`,
    });
  });

  // ---------------------------------------------------------------------------
  // 1. PAYMENT DOUBLE TAP & IDEMPOTENCY
  // ---------------------------------------------------------------------------
  it('Edge 1: User double taps payment checkout -> handles idempotently without duplicate orders', async () => {
    const checkoutPayload = {
      packId: 'pack_starter',
      idempotencyKey: 'idemp_double_tap_pay',
    };

    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/payments/orders').set('Authorization', authHeader).send(checkoutPayload),
      request(app).post('/api/v1/payments/orders').set('Authorization', authHeader).send(checkoutPayload),
    ]);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.data.id).toBe(res2.body.data.id);
    expect(res1.body.data.gatewayOrderId).toBe(res2.body.data.gatewayOrderId);

    const totalOrders = await PaymentOrderModel.countDocuments({ idempotencyKey: 'idemp_double_tap_pay' });
    expect(totalOrders).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // 2. DUPLICATE WEBHOOK HANDLING
  // ---------------------------------------------------------------------------
  it('Edge 2: Duplicate payment webhook -> credits wallet balance exactly once', async () => {
    const order = await paymentService.createOrder(user._id.toString(), {
      packId: 'pack_starter',
      idempotencyKey: 'idemp_webhook_test',
    });

    const fakeWebhookBody = JSON.stringify({
      id: 'evt_dup_123',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_rzp_dup_999',
            order_id: order.gatewayOrderId,
            amount: order.amount,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
          },
        },
      },
    });

    vi.spyOn(razorpayGateway, 'verifyWebhookSignature').mockReturnValue(true);

    // Send webhook twice (concurrent duplicate delivery simulation)
    const [wb1, wb2] = await Promise.all([
      paymentService.handleWebhook(fakeWebhookBody, 'fake_sig_1'),
      paymentService.handleWebhook(fakeWebhookBody, 'fake_sig_1'),
    ]);

    expect(wb1.status).toBeDefined();
    expect(wb2.status).toBeDefined();

    const balance = await walletService.getBalance(user._id.toString());
    // Starting balance 1000 + Pack credits credited exactly once
    expect(balance.balance).toBe(1000 + order.totalCredits);
  });

  // ---------------------------------------------------------------------------
  // 3. APP KILLED DURING PAYMENT CHECKOUT
  // ---------------------------------------------------------------------------
  it('Edge 3: App killed during payment -> webhook arrives later and reconciles successfully', async () => {
    const order = await paymentService.createOrder(user._id.toString(), {
      packId: 'pack_starter',
      idempotencyKey: 'idemp_app_killed_pay',
    });

    // Order sits in CREATED status while app is dead
    const pendingOrder = await paymentRepository.findOrderById(order.id);
    expect(pendingOrder?.status).toBe(PaymentOrderStatus.CREATED);

    // Later, payment gateway webhook fires
    const webhookBody = JSON.stringify({
      id: 'evt_delayed_recover',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_delayed_1',
            order_id: order.gatewayOrderId,
            amount: order.amount,
            status: 'captured',
          },
        },
      },
    });

    vi.spyOn(razorpayGateway, 'verifyWebhookSignature').mockReturnValue(true);
    await paymentService.handleWebhook(webhookBody, 'valid_sig');

    const reconciled = await paymentRepository.findOrderById(order.id);
    expect(reconciled?.status).toBe(PaymentOrderStatus.PAID);

    const bal = await walletService.getBalance(user._id.toString());
    expect(bal.balance).toBe(1000 + order.totalCredits);
  });

  // ---------------------------------------------------------------------------
  // 4. APP KILLED DURING VOICE CONSULTATION (HOLD AUTO-RELEASE)
  // ---------------------------------------------------------------------------
  it('Edge 4: App killed during voice consultation -> stale hold is safely settled & released', async () => {
    const voiceSession = await voiceService.startSession(user._id.toString(), {
      astrologerId: 'acharya_shastri',
      language: 'en',
      idempotencyKey: 'idemp_voice_kill',
    });

    const activeHold = await WalletHoldModel.findOne({ holdId: voiceSession.holdId });
    expect(activeHold?.status).toBe('active');

    // Manually age the session heartbeat to simulate abandoned call
    await VoiceSessionModel.findByIdAndUpdate(voiceSession.id, {
      lastHeartbeatAt: new Date(Date.now() - 300000), // 5 minutes ago
    });

    // Run stale session reconciliation
    const settled = await voiceService.reconcileStaleVoiceSessions(60000);
    expect(settled).toBe(1);

    const endedSession = await voiceRepository.findSessionById(voiceSession.id);
    expect(endedSession?.status).toBe('completed');

    const settledHold = await WalletHoldModel.findOne({ holdId: voiceSession.holdId });
    expect(['released', 'settled']).toContain(settledHold?.status);
  });

  // ---------------------------------------------------------------------------
  // 5. NETWORK DISAPPEARS DURING CHAT TURN
  // ---------------------------------------------------------------------------
  it('Edge 5: Duplicate message dispatch -> handled idempotently without duplicate debit', async () => {
    const conv = await conversationRepository.create({
      userId: user._id.toString(),
      birthProfileId: null,
      title: 'Test Chat',
    });

    // Send first message
    const msg1 = await chatService.sendMessage(user._id.toString(), conv._id.toString(), {
      content: 'Tell me about Jupiter',
      clientMessageId: 'client-msg-race-1',
    });

    // Send identical message (duplicate client tap or retry)
    const msg2 = await chatService.sendMessage(user._id.toString(), conv._id.toString(), {
      content: 'Tell me about Jupiter',
      clientMessageId: 'client-msg-race-1',
    });

    expect(msg1.id).toBe(msg2.id);

    // Verify balance was not debited improperly
    const bal = await walletService.getBalance(user._id.toString());
    expect(bal.availableBalance).toBe(1000);
  });

  // ---------------------------------------------------------------------------
  // 6. PRIMARY AI PROVIDER FAILS -> FALLBACK TO SECONDARY
  // ---------------------------------------------------------------------------
  it('Edge 6: Primary AI provider unavailable -> router automatically falls back to secondary provider', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText.mockRejectedValue(new Error('OpenAI 503 Service Unavailable'));

    const gemini = fakeAdapter(AIProviderName.GEMINI);
    gemini.generateText.mockResolvedValue({
      text: 'Astrological guidance from secondary provider',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    });

    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: openai,
      [AIProviderName.GEMINI]: gemini,
    });

    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.GEMINI, model: 'gemini-1.5-flash' },
    ]);

    const result = await routeCall({
      alias: ModelAlias.FAST_CHAT,
      requiredCapability: AICapability.TEXT_GENERATION,
      requestId: 'req-fallback-test',
      operation: 'generateText',
      call: (adapter, model, signal) => adapter.generateText({ model, messages: [], signal }),
      extractUsage: (output) => output.usage,
    });

    expect(result.output.text).toBe('Astrological guidance from secondary provider');
    expect(result.usedFallback).toBe(true);
    expect(result.provider).toBe(AIProviderName.GEMINI);
  });

  // ---------------------------------------------------------------------------
  // 7. MULTI-LEVEL AI FAILURES -> ALL CANDIDATES FAIL
  // ---------------------------------------------------------------------------
  it('Edge 7: All AI providers fail -> fails gracefully with classified gateway error', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText.mockRejectedValue(new Error('OpenAI Down'));

    const gemini = fakeAdapter(AIProviderName.GEMINI);
    gemini.generateText.mockRejectedValue(new Error('Gemini Down'));

    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: openai,
      [AIProviderName.GEMINI]: gemini,
    });

    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.GEMINI, model: 'gemini-1.5-flash' },
    ]);

    await expect(
      routeCall({
        alias: ModelAlias.FAST_CHAT,
        requiredCapability: AICapability.TEXT_GENERATION,
        requestId: 'req-all-fail',
        operation: 'generateText',
        call: (adapter, model, signal) => adapter.generateText({ model, messages: [], signal }),
        extractUsage: (output) => output.usage,
      }),
    ).rejects.toThrow();
  });

  // ---------------------------------------------------------------------------
  // 8. ASYNC REPORT RUNS TWICE -> DEDUPLICATION
  // ---------------------------------------------------------------------------
  it('Edge 8: Report job requested twice with same idempotencyKey -> creates exactly one report job', async () => {
    const profile = await BirthProfileModel.create({
      userId: user._id,
      name: 'Seeker',
      dateOfBirth: '1990-01-01',
      birthTime: '12:00',
      timeConfidence: 'exact',
      location: {
        canonicalName: 'Delhi',
        country: 'India',
        countryCode: 'IN',
        latitude: 28.6,
        longitude: 77.2,
        timezone: 'Asia/Kolkata',
      },
    });

    const reportPayload = {
      reportType: ReportType.FULL_KUNDLI,
      primaryBirthProfileId: profile._id.toString(),
      language: 'en' as const,
      idempotencyKey: 'idemp_rep_twice',
    };

    const [r1, r2] = await Promise.all([
      reportService.createReport(user._id.toString(), reportPayload),
      reportService.createReport(user._id.toString(), reportPayload),
    ]);

    expect(r1.id).toBe(r2.id);
    const count = await reportRepository.listAll({ limit: 10 });
    expect(count.items.length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // 9. DUPLICATE WALLET DEBIT REQUEST
  // ---------------------------------------------------------------------------
  it('Edge 9: Wallet debit requested twice with duplicate key -> debits balance only once', async () => {
    const [d1, d2] = await Promise.all([
      walletService.debit(user._id.toString(), {
        amount: 150,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: 'idemp_debit_twice',
      }),
      walletService.debit(user._id.toString(), {
        amount: 150,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: 'idemp_debit_twice',
      }),
    ]);

    expect(d1.id).toBe(d2.id);
    expect(d1.balanceAfter).toBe(850);
    expect(d2.balanceAfter).toBe(850);

    const bal = await walletService.getBalance(user._id.toString());
    expect(bal.availableBalance).toBe(850);
  });

  // ---------------------------------------------------------------------------
  // 10. HIGH-CONTENTION CONCURRENT WALLET DEBITS
  // ---------------------------------------------------------------------------
  it('Edge 10: Concurrent wallet debits -> balance never drops below zero and prevents double-spending', async () => {
    // User has 1000 credits. Attempt 12 simultaneous debits of 100 credits each (total 1200 > 1000)
    const debitPromises = Array.from({ length: 12 }, (_, i) =>
      walletService.debit(user._id.toString(), {
        amount: 100,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: `idemp_race_debit_${i}`,
      }).catch((err) => ({ error: err.message })),
    );

    const results = await Promise.all(debitPromises);
    const successful = results.filter((r: any) => !r.error);
    const failed = results.filter((r: any) => r.error);

    expect(successful.length).toBe(10); // exactly 10 succeed (10 * 100 = 1000)
    expect(failed.length).toBe(2); // exactly 2 fail due to insufficient funds

    const finalBalance = await walletService.getBalance(user._id.toString());
    expect(finalBalance.availableBalance).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 11. COUPON REDEEMED TWICE CONCURRENTLY
  // ---------------------------------------------------------------------------
  it('Edge 11: Single-use coupon redeemed concurrently -> exactly one redemption succeeds', async () => {
    const promo = await PromotionModel.create({
      code: 'LIMITED1',
      name: 'Limited Offer',
      description: 'Single use coupon',
      type: PromotionType.PROMO_CODE,
      discountType: PromotionDiscountType.FIXED_AMOUNT,
      discountValue: 5000,
      target: PromotionTarget.CREDIT_PACK,
      audienceSegment: PromotionAudienceSegment.ALL_USERS,
      status: PromotionStatus.ACTIVE,
      isActive: true,
      rules: {
        minPurchaseAmount: 10000,
        totalUsageLimit: 1,
        perUserLimit: 1,
      },
      stats: {
        impressions: 0,
        redemptions: 0,
        revenueGenerated: 0,
        discountCost: 0,
      },
    });

    const claimCoupon = async () => {
      return PromotionModel.findOneAndUpdate(
        { _id: promo._id, isActive: true, 'stats.redemptions': { $lt: promo.rules.totalUsageLimit! } },
        { $inc: { 'stats.redemptions': 1 } },
        { new: true },
      );
    };

    const [res1, res2] = await Promise.all([
      claimCoupon(),
      claimCoupon(),
    ]);

    const winner = [res1, res2].filter(Boolean);
    expect(winner.length).toBe(1);

    const updatedPromo = await PromotionModel.findById(promo._id);
    expect(updatedPromo?.stats.redemptions).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // 12. CIRCULAR REFERRAL LOOP DETECTION (A -> B -> A)
  // ---------------------------------------------------------------------------
  it('Edge 12: Circular referral loop -> rejected with validation error', async () => {
    const userA = user;
    const userB = await userService.createUser({
      email: 'user.b@astroai.test',
      name: 'User B',
      avatarUrl: null,
    });

    // A refers B
    const codeA = referralService.getUserReferralCode(userA._id.toString());
    await referralService.claimReferralCode({
      refereeId: userB._id.toString(),
      referralCode: codeA,
    });

    // Now B tries to refer A (Circular cycle A -> B -> A)
    const codeB = referralService.getUserReferralCode(userB._id.toString());
    await expect(
      referralService.claimReferralCode({
        refereeId: userA._id.toString(),
        referralCode: codeB,
      }),
    ).rejects.toThrow('Circular referral loop detected');
  });

  // ---------------------------------------------------------------------------
  // 13. EXPIRED AUTHENTICATION TOKEN
  // ---------------------------------------------------------------------------
  it('Edge 13: Expired user token -> returns 401 Unauthorized', async () => {
    // Generate expired token (1 hour in the past)
    const { token: expiredToken } = signAccessToken(
      { sub: user._id.toString(), role: 'user' },
      env.JWT_ACCESS_SECRET,
      -3600,
    );

    const res = await request(app)
      .get('/api/v1/wallet/balance')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // 14. UNAUTHORIZED ADMIN REQUEST (SEEKER TOKEN ON ADMIN ROUTE)
  // ---------------------------------------------------------------------------
  it('Edge 14: Regular user token on admin endpoint -> returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // 15. REVOKED / DEACTIVATED ADMIN ACCESS
  // ---------------------------------------------------------------------------
  it('Edge 15: Deactivated admin token -> immediately rejected on next request', async () => {
    const { admin, accessCookie } = await createAdminAndGetCookie(
      AdminRole.SUPER_ADMIN,
      'revoked_admin@astroai.test',
      AccountStatus.ACTIVE,
    );

    // Initial request works
    const res1 = await request(app)
      .get('/api/v1/admin/feature-flags')
      .set('Cookie', accessCookie!);
    expect(res1.status).toBe(200);

    // Deactivate admin account
    await AdminUserModel.findByIdAndUpdate(admin._id, { status: AccountStatus.SUSPENDED });

    // Subsequent request fails immediately
    const res2 = await request(app)
      .get('/api/v1/admin/feature-flags')
      .set('Cookie', accessCookie!);
    expect(res2.status).toBe(403);
  });

  // ---------------------------------------------------------------------------
  // 16. MALFORMED USER INPUT & SCHEMA INJECTION
  // ---------------------------------------------------------------------------
  it('Edge 16: Malformed input -> rejected with 400 Bad Request and validation error details', async () => {
    // Invalid birth profile input (missing coordinates and invalid date format)
    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: '',
        dateOfBirth: 'invalid-date',
        birthTime: '99:99',
        timeConfidence: 'not_valid_enum',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
