import argon2 from 'argon2';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AdminRole,
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionType,
  PromotionTarget,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { pricingService } from '../../src/modules/pricing';
import { promotionsService } from '../../src/modules/promotions';
import { userService } from '../../src/modules/users';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: 'Marketing Admin', role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

describe('Marketing & Promotions Platform Integration Tests', () => {
  let userToken: string;
  let userId: string;
  let referrerToken: string;
  let referrerId: string;
  let adminCookie: string;
  let referrerCode: string;
  let activePackId: string;

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    const pricing = await pricingService.getActiveConfig();
    activePackId = pricing.creditPacks[0]!.id;
    await promotionsService.seedDefaults();

    // Create primary test user
    const user = await userService.createUser({
      email: 'seeker.promo@test.com',
      name: 'Promo Seeker',
      avatarUrl: null,
    });
    userId = user._id.toString();
    const userAuth = signAccessToken(
      { sub: userId, role: 'user' },
      env.JWT_ACCESS_SECRET,
      900,
    );
    userToken = userAuth.token;

    // Create referrer user
    const referrer = await userService.createUser({
      email: 'referrer.guru@test.com',
      name: 'Referrer Guru',
      avatarUrl: null,
    });
    referrerId = referrer._id.toString();
    const referrerAuth = signAccessToken(
      { sub: referrerId, role: 'user' },
      env.JWT_ACCESS_SECRET,
      900,
    );
    referrerToken = referrerAuth.token;

    // Derive referrer code
    const cleanId = referrerId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    referrerCode = `ASTRO${cleanId.slice(-6)}`;

    // Create marketing admin
    const admin = await createAdminAndLogin(
      AdminRole.SUPER_ADMIN,
      'marketing.lead@astroai.test',
    );
    adminCookie = admin.accessCookie!;
  });

  describe('User Promotion Validation & Offers', () => {
    it('validates default WELCOME100 coupon and returns bonus credits calculation', async () => {
      const res = await request(app)
        .post('/api/v1/promotions/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'WELCOME100',
          amount: 19900,
          targetType: 'all',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.code).toBe('WELCOME100');
      expect(res.body.data.bonusCredits).toBe(50);
    });

    it('validates COSMIC20 coupon with 20% discount calculation', async () => {
      const res = await request(app)
        .post('/api/v1/promotions/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'COSMIC20',
          amount: 20000, // ₹200
          targetType: 'report',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.discountAmount).toBe(4000); // 20% of 20000 is 4000 (₹40)
      expect(res.body.data.finalAmount).toBe(16000); // ₹160
    });

    it('retrieves active personalized offers for user without manipulative marketing', async () => {
      const res = await request(app)
        .get('/api/v1/promotions/offers')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Referrals & Rewards Program', () => {
    it('retrieves user referral code and summary', async () => {
      const res = await request(app)
        .get('/api/v1/promotions/referral')
        .set('Authorization', `Bearer ${referrerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referralCode).toBe(referrerCode);
      expect(res.body.data.referralLink).toContain(referrerCode);
    });

    it('rejects self-referral attempt', async () => {
      const res = await request(app)
        .post('/api/v1/promotions/referral/claim')
        .set('Authorization', `Bearer ${referrerToken}`)
        .send({
          referralCode: referrerCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('cannot redeem your own referral code');
    });

    it('claims valid referral code and awards welcome bonus to referee', async () => {
      const res = await request(app)
        .post('/api/v1/promotions/referral/claim')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          referralCode: referrerCode,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.referrerId).toBe(referrerId);
    });

    it('prevents referee from claiming a second referral code', async () => {
      // First claim
      await request(app)
        .post('/api/v1/promotions/referral/claim')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          referralCode: referrerCode,
        });

      // Second claim attempt
      const res = await request(app)
        .post('/api/v1/promotions/referral/claim')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          referralCode: referrerCode,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Payment Checkout Flow with Promo Code', () => {
    it('creates a payment order with promo code discount applied', async () => {
      const res = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          packId: activePackId,
          idempotencyKey: `ord_promo_test_${Date.now()}`,
          promoCode: 'FIRST50',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('created');
    });
  });

  describe('Admin Promotions & Marketing Analytics', () => {
    it('lists all promotional coupons for marketing admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/promotions')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('creates a new campaign promo code with custom rules', async () => {
      const res = await request(app)
        .post('/api/v1/admin/promotions')
        .set('Cookie', [adminCookie])
        .send({
          code: 'DIWALI2026',
          name: 'Diwali Festival of Light',
          description: 'Auspicious illumination with 25% discount on all astro services.',
          type: PromotionType.SEASONAL_CAMPAIGN,
          discountType: PromotionDiscountType.PERCENTAGE,
          discountValue: 25,
          target: PromotionTarget.ALL,
          audienceSegment: PromotionAudienceSegment.ALL_USERS,
          rules: {
            minPurchaseAmount: 10000,
            maxDiscountAmount: 25000,
            totalUsageLimit: 5000,
            perUserLimit: 2,
            newUserOnly: false,
            existingUserOnly: false,
          },
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('DIWALI2026');
      expect(res.body.data.discountValue).toBe(25);
    });

    it('fetches platform marketing ROI analytics and conversion metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/promotions/analytics')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalPromotions');
      expect(res.body.data).toHaveProperty('activePromotions');
      expect(res.body.data).toHaveProperty('overallROI');
      expect(res.body.data).toHaveProperty('topPromotions');
    });

    it('lists referral records for admin inspection', async () => {
      const res = await request(app)
        .get('/api/v1/admin/promotions/referrals')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
