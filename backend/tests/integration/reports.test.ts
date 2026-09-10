import crypto from 'node:crypto';
import argon2 from 'argon2';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AdminRole,
  FactPrecision,
  ReportStatus,
  ReportType,
  TimeConfidence,
  WalletTransactionSource,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { birthProfileService } from '../../src/modules/birthProfiles';
import { reportQueue } from '../../src/modules/reports/jobs/reportQueue';
import { ReportModel } from '../../src/modules/reports/report.model';
import { userService } from '../../src/modules/users';
import { walletService } from '../../src/modules/wallet/wallet.service';
import { signAccessToken } from '../../src/shared/tokens';

const mockEngine = vi.hoisted(() => ({
  providerId: 'test-vedic-engine',
  computeChart: vi.fn(),
  computeTransits: vi.fn(),
  computeCompatibility: vi.fn(),
}));

vi.mock('../../src/modules/astrology/engine/registry', () => ({
  CURRENT_CALCULATION_VERSION: 1,
  currentEngine: () => mockEngine,
}));

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: 'Report Admin', role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

describe('Reports & Compatibility Pipeline Integration Tests', () => {
  let userToken: string;
  let adminCookie: string;
  let userId: string;
  let profileAId: string;
  let profileBId: string;

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();

    mockEngine.computeChart.mockResolvedValue({
      ascendant: { sign: 'Aries', degree: 15.2, nakshatra: 'Ashwini', pada: 2, precision: FactPrecision.RELIABLE },
      planetPositions: [
        { planet: 'Moon', sign: 'Aries', longitude: 12.5, speed: 13.2, isRetrograde: false, nakshatra: 'Ashwini', pada: 1, house: 1, precision: FactPrecision.RELIABLE },
        { planet: 'Mars', sign: 'Leo', longitude: 130.0, speed: 0.5, isRetrograde: false, nakshatra: 'Magha', pada: 1, house: 5, precision: FactPrecision.RELIABLE },
        { planet: 'Jupiter', sign: 'Sagittarius', longitude: 245.0, speed: 0.2, isRetrograde: false, nakshatra: 'Mula', pada: 2, house: 9, precision: FactPrecision.RELIABLE },
      ],
      houses: [
        { number: 1, sign: 'Aries', cuspDegree: 15.2, planets: ['Moon'], precision: FactPrecision.RELIABLE },
      ],
      moonNakshatra: { name: 'Ashwini', lord: 'Ketu', pada: 1 },
      currentDasha: { planet: 'Jupiter', startDate: '2020-01-01', endDate: '2036-01-01', antardashas: [] },
      yogas: [{ name: 'Gaja Kesari Yoga', description: 'Auspicious wisdom and prosperity yoga', planetsInvolved: ['Moon', 'Jupiter'] }],
    });

    // Create User
    const user = await userService.createUser({
      email: `${crypto.randomUUID()}@example.com`,
      name: 'Arjun Verma',
      avatarUrl: null,
    });
    userId = user.id;
    const { token } = signAccessToken({ sub: userId, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
    userToken = token;

    // Seed Wallet with 100 Credits
    await walletService.credit(userId, {
      amount: 100,
      source: WalletTransactionSource.SIGNUP_BONUS,
      metadata: { description: 'Initial test wallet credit' },
      idempotencyKey: `seed_${Date.now()}_${Math.random()}`,
    });

    // Create Admin and Login
    const admin = await createAdminAndLogin(
      AdminRole.SUPER_ADMIN,
      `admin_${crypto.randomUUID()}@example.com`,
    );
    adminCookie = admin.accessCookie!;

    // Create Person A Birth Profile
    const profileA = await birthProfileService.create(userId, {
      name: 'Arjun Verma',
      dateOfBirth: '1995-04-14',
      birthTime: '10:30',
      timeConfidence: TimeConfidence.EXACT,
      location: {
        manual: {
          canonicalName: 'New Delhi, India',
          latitude: 28.6139,
          longitude: 77.209,
          country: 'India',
          countryCode: 'IN',
        },
      },
    });
    profileAId = profileA.id;

    // Create Person B Birth Profile
    const profileB = await birthProfileService.create(userId, {
      name: 'Priya Sharma',
      dateOfBirth: '1997-08-20',
      birthTime: '14:15',
      timeConfidence: TimeConfidence.EXACT,
      location: {
        manual: {
          canonicalName: 'Jaipur, Rajasthan, India',
          latitude: 26.9124,
          longitude: 75.7873,
          country: 'India',
          countryCode: 'IN',
        },
      },
    });
    profileBId = profileB.id;
  });

  it('rejects report purchase when user has insufficient wallet credits', async () => {
    // Empty user wallet
    const bal = await walletService.getBalance(userId);
    await walletService.debit(userId, {
      amount: bal.availableBalance,
      source: WalletTransactionSource.REPORT,
      metadata: { description: 'Drain wallet for test' },
      idempotencyKey: `drain_${Date.now()}`,
    });

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.FULL_KUNDLI,
        primaryBirthProfileId: profileAId,
        idempotencyKey: 'rep_insufficient_1',
      });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('REPORT_INSUFFICIENT_CREDITS');
  });

  it('purchases, processes, and completes a personalized Life Kundli report', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.FULL_KUNDLI,
        primaryBirthProfileId: profileAId,
        idempotencyKey: 'rep_kundli_key_1',
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    const reportId = res.body.data.id;
    expect(reportId).toBeDefined();
    expect(res.body.data.status).toBe(ReportStatus.QUEUED);
    expect(res.body.data.creditsCharged).toBeGreaterThan(0);

    // Wait for asynchronous job execution
    await reportQueue.processJob(reportId);

    // Verify report detail
    const detailRes = await request(app)
      .get(`/api/v1/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.report.status).toBe(ReportStatus.COMPLETED);
    expect(detailRes.body.data.report.pdfUrl).toBe(`/api/v1/reports/${reportId}/pdf`);
    expect(detailRes.body.data.sections.length).toBeGreaterThan(0);
    expect(detailRes.body.data.astrologyData.ascendant).toBeDefined();
  }, 60000);

  it('generates a deterministic Ashtakoota compatibility report without AI score invention', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.RELATIONSHIP_COMPATIBILITY,
        primaryBirthProfileId: profileAId,
        partnerBirthProfileId: profileBId,
        idempotencyKey: 'rep_comp_key_1',
      });

    expect(res.status).toBe(202);
    const reportId = res.body.data.id;

    // Process async worker
    await reportQueue.processJob(reportId);

    const detailRes = await request(app)
      .get(`/api/v1/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(detailRes.status).toBe(200);
    const compScore = detailRes.body.data.compatibilityScore;
    expect(compScore).toBeDefined();
    expect(compScore.maxScore).toBe(36);
    expect(compScore.totalScore).toBeGreaterThanOrEqual(0);
    expect(compScore.totalScore).toBeLessThanOrEqual(36);
    expect(compScore.categories).toHaveLength(8);

    // Confirm AI sections describe the calculated score
    const sections = detailRes.body.data.sections;
    const summarySec = sections.find((s: any) => s.category === 'summary');
    expect(summarySec).toBeDefined();
    expect(summarySec.content).toContain(`${compScore.totalScore}`);
    expect(summarySec.content).toContain('36');
  }, 60000);

  it('downloads the generated PDF file stream', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.FULL_KUNDLI,
        primaryBirthProfileId: profileAId,
        idempotencyKey: 'rep_pdf_test_1',
      });

    const reportId = res.body.data.id;
    await reportQueue.processJob(reportId);

    const pdfRes = await request(app)
      .get(`/api/v1/reports/${reportId}/pdf`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(100);
  }, 60000);

  it('prevents double-debiting on duplicate idempotency requests', async () => {
    const balBefore = (await walletService.getBalance(userId)).availableBalance;

    const res1 = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.FULL_KUNDLI,
        primaryBirthProfileId: profileAId,
        idempotencyKey: 'rep_dup_key_99',
      });

    const balAfter1 = (await walletService.getBalance(userId)).availableBalance;
    const charged = balBefore - balAfter1;
    expect(charged).toBeGreaterThan(0);

    const res2 = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.FULL_KUNDLI,
        primaryBirthProfileId: profileAId,
        idempotencyKey: 'rep_dup_key_99',
      });

    const balAfter2 = (await walletService.getBalance(userId)).availableBalance;
    expect(res1.body.data.id).toBe(res2.body.data.id);
    expect(balAfter1).toBe(balAfter2); // No double charge
  });

  it('handles terminal report failure and automatically refunds credits to the user', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.RELATIONSHIP_COMPATIBILITY,
        primaryBirthProfileId: profileAId,
        partnerBirthProfileId: 'invalid_non_existent_profile_id',
        idempotencyKey: 'rep_fail_refund_1',
      });

    const reportId = res.body.data.id;
    const chargedCredits = res.body.data.creditsCharged;
    const balanceBeforeRefund = (await walletService.getBalance(userId)).availableBalance;

    // Simulate final failure directly
    await reportQueue.handleFinalFailure(
      reportId,
      'astrology_engine' as any,
      'Partner profile not found',
    );

    const failedReport = await ReportModel.findById(reportId);
    expect(failedReport?.status).toBe(ReportStatus.FAILED);
    expect(failedReport?.failureReason).toBeDefined();

    const balanceAfterRefund = (await walletService.getBalance(userId)).availableBalance;
    expect(balanceAfterRefund).toBe(balanceBeforeRefund + chargedCredits);
  });

  it('provides admin report inspection and manual retry endpoint', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportType: ReportType.FULL_KUNDLI,
        primaryBirthProfileId: profileAId,
        idempotencyKey: 'rep_admin_key_1',
      });

    const reportId = res.body.data.id;

    // Admin List
    const adminListRes = await request(app)
      .get('/api/v1/admin/reports')
      .set('Cookie', adminCookie);

    expect(adminListRes.status).toBe(200);
    expect(adminListRes.body.data.items.some((r: any) => r.id === reportId)).toBe(true);

    // Admin Get
    const adminGetRes = await request(app)
      .get(`/api/v1/admin/reports/${reportId}`)
      .set('Cookie', adminCookie);

    expect(adminGetRes.status).toBe(200);
    expect(adminGetRes.body.data.report.id).toBe(reportId);
  });
});
