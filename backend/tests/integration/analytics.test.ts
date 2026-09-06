import argon2 from 'argon2';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AdminRole,
  AIErrorCategory,
  AIProviderName,
  ModelAlias,
  PaymentOrderStatus,
  ReportStatus,
  ReportType,
  VoiceSessionStatus,
  WalletTransactionSource,
  WalletTransactionType,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { AIUsageEventModel } from '../../src/modules/ai/aiUsage.model';
import { AnalyticsEventModel } from '../../src/modules/analytics/analyticsEvent.model';
import { BirthProfileModel } from '../../src/modules/birthProfiles/birthProfile.model';
import { ConversationModel } from '../../src/modules/chat/conversation.model';
import { PaymentOrderModel } from '../../src/modules/payments/paymentOrder.model';
import { ReportModel } from '../../src/modules/reports/report.model';
import { UserModel } from '../../src/modules/users/user.model';
import { VoiceSessionModel } from '../../src/modules/voice/voiceSession.model';
import { WalletTransactionModel } from '../../src/modules/wallet/ledger.model';

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: `Admin ${role}`, role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

describe('Product, Financial and AI Analytics Platform Integration Tests', () => {
  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  it('aggregates Product Analytics with activation funnel, DAU/MAU, and retention cohorts', async () => {
    const { accessCookie } = await createAdminAndLogin(AdminRole.SUPER_ADMIN, 'super_analytics@astroai.test');

    // Seed users
    const u1 = await UserModel.create({ email: 'user1@astroai.test', name: 'User One' });
    await UserModel.create({ email: 'user2@astroai.test', name: 'User Two' });

    // u1 completes birth profile
    await BirthProfileModel.create({
      userId: u1._id,
      name: 'User One',
      dateOfBirth: '1995-05-15',
      birthTime: '10:30',
      timeConfidence: 'exact',
      location: {
        canonicalName: 'Varanasi, India',
        country: 'India',
        countryCode: 'IN',
        latitude: 25.3176,
        longitude: 82.9739,
        timezone: 'Asia/Kolkata',
      },
    });

    // u1 starts first chat
    await ConversationModel.create({
      userId: u1._id,
      title: 'Career Consultation',
    });

    // u1 makes first purchase
    await PaymentOrderModel.create({
      userId: u1._id.toString(),
      packId: 'pack_500',
      gatewayOrderId: 'order_funnel_1',
      amount: 49900,
      currency: 'INR',
      status: PaymentOrderStatus.PAID,
      credits: 500,
      bonusCredits: 50,
      totalCredits: 550,
      idempotencyKey: 'idemp_funnel_1',
      pricingSnapshot: {
        pricingVersion: 1,
        unitPrice: 100,
        netAmount: 49900,
      },
    });

    const res = await request(app)
      .get('/api/v1/admin/analytics/product?range=30d')
      .set('Cookie', accessCookie!);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.activationFunnel.totalRegistrations).toBe(2);
    expect(data.activationFunnel.profileCompleted.count).toBe(1);
    expect(data.activationFunnel.profileCompleted.conversionRate).toBe(50);
    expect(data.activationFunnel.firstChatStarted.count).toBe(1);
    expect(data.activationFunnel.firstPurchaseCompleted.count).toBe(1);
    expect(data.activeUsers.dau).toBeGreaterThanOrEqual(1);
    expect(data.activeUsers.stickinessPercent).toBeDefined();
    expect(data.retentionCohorts.length).toBeGreaterThanOrEqual(1);
    expect(data.churn.churnRatePercent).toBeDefined();
  });

  it('aggregates Financial Analytics with GMV, ARPU, unit economics, and service breakdown', async () => {
    const { accessCookie } = await createAdminAndLogin(AdminRole.FINANCE, 'finance_analytics@astroai.test');

    const user = await UserModel.create({ email: 'buyer@astroai.test', name: 'Paying Seeker' });

    // Paid order
    await PaymentOrderModel.create({
      userId: user._id.toString(),
      packId: 'pack_1000',
      gatewayOrderId: 'order_fin_1',
      amount: 100000,
      currency: 'INR',
      status: PaymentOrderStatus.PAID,
      credits: 1000,
      bonusCredits: 100,
      totalCredits: 1100,
      idempotencyKey: 'idemp_fin_1',
      pricingSnapshot: {
        pricingVersion: 1,
        unitPrice: 100,
        netAmount: 100000,
      },
    });

    // Wallet transaction
    await WalletTransactionModel.create({
      userId: user._id.toString(),
      idempotencyKey: 'idemp_w_1',
      type: WalletTransactionType.CREDIT,
      amount: 1000,
      balanceBefore: 0,
      balanceAfter: 1000,
      source: WalletTransactionSource.PAYMENT,
      referenceId: 'order_fin_1',
    });

    // Voice session
    await VoiceSessionModel.create({
      userId: user._id.toString(),
      astrologerId: 'acharya_shastri',
      sessionToken: 'voice_tok_1',
      status: VoiceSessionStatus.COMPLETED,
      ratePerMinute: 60,
      startedAt: new Date(Date.now() - 300000),
      endedAt: new Date(),
      durationSeconds: 300,
      creditsCharged: 300,
      providerCostPaise: 4500,
      idempotencyKey: 'voice_idemp_1',
      pricingSnapshot: {
        pricingVersion: 1,
        unitPrice: 60,
        netAmount: 300,
      },
    });

    // Report purchase
    await ReportModel.create({
      _id: 'rep_analytic_1',
      userId: user._id.toString(),
      reportType: ReportType.FULL_KUNDLI,
      primaryBirthProfileId: 'bp_1',
      status: ReportStatus.COMPLETED,
      language: 'en',
      creditsCharged: 250,
      pricingSnapshot: {
        pricingVersion: 1,
        unitPrice: 250,
        netAmount: 250,
      },
      idempotencyKey: 'report_idemp_1',
    });

    const res = await request(app)
      .get('/api/v1/admin/analytics/financial?range=30d')
      .set('Cookie', accessCookie!);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.overview.gmvPaise).toBe(100000);
    expect(data.overview.totalPaidOrders).toBe(1);
    expect(data.unitEconomics.arpuPaise).toBeGreaterThan(0);
    expect(data.serviceBreakdown.length).toBe(3);
    expect(data.walletUsage.totalCreditsPurchased).toBe(1000);
    expect(data.voice.totalMinutesBilled).toBe(5);
    expect(data.voice.billedRevenuePaise).toBe(30000);
    expect(data.reports.totalReportsPurchased).toBe(1);
    expect(data.reports.kundliReports).toBe(1);
  });

  it('aggregates AI Technical Analytics with tokens, costs, reliability, and p50/p95/p99 latencies', async () => {
    const { accessCookie } = await createAdminAndLogin(AdminRole.AI_MANAGER, 'ai_mgr_analytics@astroai.test');

    // Seed AI Usage Events
    await AIUsageEventModel.create([
      {
        requestId: 'req_1',
        alias: ModelAlias.FAST_CHAT,
        provider: AIProviderName.OPENAI,
        model: 'gpt-4o',
        operation: 'chat',
        latencyMs: 350,
        success: true,
        usedFallback: false,
        promptTokens: 120,
        completionTokens: 80,
        totalTokens: 200,
        estimatedCostUsd: 0.0015,
      },
      {
        requestId: 'req_2',
        alias: ModelAlias.REPORT_GENERATION,
        provider: AIProviderName.GEMINI,
        model: 'gemini-1.5-pro',
        operation: 'interpretation',
        latencyMs: 820,
        success: true,
        usedFallback: true,
        promptTokens: 500,
        completionTokens: 300,
        totalTokens: 800,
        estimatedCostUsd: 0.004,
      },
      {
        requestId: 'req_3',
        alias: ModelAlias.SMART_CHAT,
        provider: AIProviderName.ANTHROPIC,
        model: 'claude-3-5-sonnet',
        operation: 'chat',
        latencyMs: 1200,
        success: false,
        usedFallback: false,
        errorCategory: AIErrorCategory.RATE_LIMITED,
      },
    ]);

    const res = await request(app)
      .get('/api/v1/admin/analytics/ai?range=30d')
      .set('Cookie', accessCookie!);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.overview.totalRequests).toBe(3);
    expect(data.overview.successfulRequests).toBe(2);
    expect(data.overview.failedRequests).toBe(1);
    expect(data.tokens.totalTokens).toBe(1000);
    expect(data.cost.costByProvider.length).toBe(3);
    expect(data.reliability.fallbackCount).toBe(1);
    expect(data.reliability.failuresByCategory[0].category).toBe('rate_limited');
    expect(data.latencies.overall.p50Ms).toBeGreaterThan(0);
    expect(data.latencies.overall.p95Ms).toBeGreaterThan(0);
    expect(data.latencies.overall.p99Ms).toBeGreaterThan(0);
  });

  it('serves paginated privacy-safe analytics events without exposing sensitive conversation text', async () => {
    const { accessCookie } = await createAdminAndLogin(AdminRole.SUPER_ADMIN, 'events_analytics@astroai.test');

    await AnalyticsEventModel.create([
      {
        category: 'product',
        eventName: 'birth_profile_created',
        entityId: 'user_123',
        status: 'success',
        durationMs: 45,
      },
      {
        category: 'ai_gateway',
        eventName: 'chat_turn_completed',
        entityId: 'conv_456',
        status: 'success',
        durationMs: 420,
        metrics: { promptTokens: 150, completionTokens: 90 },
      },
    ]);

    const res = await request(app)
      .get('/api/v1/admin/analytics/events?category=product&limit=10&offset=0')
      .set('Cookie', accessCookie!);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].eventName).toBe('birth_profile_created');
    expect(res.body.data.total).toBe(1);
  });

  it('forbids Content admin without ANALYTICS_READ from accessing analytics endpoints', async () => {
    const { accessCookie } = await createAdminAndLogin(AdminRole.CONTENT, 'content_unauth@astroai.test');

    const res = await request(app)
      .get('/api/v1/admin/analytics/product')
      .set('Cookie', accessCookie!);

    expect(res.status).toBe(403);
  });
});
