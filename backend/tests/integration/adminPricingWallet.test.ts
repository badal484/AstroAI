import argon2 from 'argon2';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  AdminRole,
  BillingUnit,
  PricingConfigStatus,
  RoundingRule,
  WalletTransactionSource,
  WalletTransactionType,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { userService } from '../../src/modules/users';
import { walletService } from '../../src/modules/wallet/wallet.service';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: 'Admin User', role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

async function createAuthedUser() {
  const user = await userService.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Wallet Test User',
    avatarUrl: null,
  });
  const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
  return { user, token };
}

describe('Pricing & Wallet API Endpoints Integration', () => {
  describe('Public / User Pricing Routes', () => {
    it('GET /api/v1/pricing returns public pricing explanation', async () => {
      const res = await request(app).get('/api/v1/pricing');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.chat).toBeDefined();
      expect(res.body.data.voice).toBeDefined();
      expect(res.body.data.reports).toBeInstanceOf(Array);
      expect(res.body.data.creditPacks).toBeInstanceOf(Array);
    });

    it('GET /api/v1/pricing/packs returns active credit packs', async () => {
      const res = await request(app).get('/api/v1/pricing/packs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('User Wallet Routes', () => {
    it('GET /api/v1/wallet requires authentication', async () => {
      const res = await request(app).get('/api/v1/wallet');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/wallet returns current balance for authenticated user', async () => {
      const { user, token } = await createAuthedUser();

      const res = await request(app)
        .get('/api/v1/wallet')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(user.id);
      expect(res.body.data.balance).toBe(0);
    });

    it('GET /api/v1/wallet/transactions returns paginated transactions', async () => {
      const { user, token } = await createAuthedUser();

      // Seed a transaction
      await walletService.credit(user.id, {
        amount: 50,
        source: WalletTransactionSource.PAYMENT,
        idempotencyKey: 'user_route_tx_seed',
      });

      const res = await request(app)
        .get('/api/v1/wallet/transactions?limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].amount).toBe(50);
    });
  });

  describe('Admin Pricing Management', () => {
    it('allows Finance role to view and create new pricing config version', async () => {
      const { accessCookie } = await createAdminAndLogin(AdminRole.FINANCE, 'finance@astroai.test');

      const getRes = await request(app)
        .get('/api/v1/admin/pricing')
        .set('Cookie', accessCookie!);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.version).toBeDefined();

      const postRes = await request(app)
        .post('/api/v1/admin/pricing')
        .set('Cookie', accessCookie!)
        .send({
          status: PricingConfigStatus.ACTIVE,
          effectiveFrom: new Date().toISOString(),
          effectiveTo: null,
          freeCreditsOnSignup: 25,
          firstPurchaseDiscountPercent: 30,
          creditPacks: [
            {
              id: 'custom_pack_1',
              name: 'Holiday Pack',
              description: 'Special bundle',
              credits: 300,
              bonusCredits: 60,
              priceAmount: 29900,
              currency: 'INR',
              badge: 'Festive',
              active: true,
              sortOrder: 1,
            },
          ],
          chat: {
            creditsPerMessage: 3,
            freeMessagesPerDay: 5,
            freeMessagesOnSignup: 10,
          },
          voice: {
            billingUnit: BillingUnit.MINUTE,
            creditsPerUnit: 6,
            minimumChargeCredits: 6,
            freeInitialSeconds: 15,
            roundingRule: RoundingRule.CEIL,
            maxSessionDurationSeconds: 1800,
          },
          reports: [
            {
              reportType: 'natal_chart',
              title: 'Kundli',
              description: 'Desc',
              credits: 60,
              discountPercent: 10,
              active: true,
            },
          ],
          subscriptions: [],
          notes: 'Festive pricing version',
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.data.version).toBeGreaterThanOrEqual(1);
      expect(postRes.body.data.freeCreditsOnSignup).toBe(25);
    });

    it('rejects unauthorized role from managing pricing', async () => {
      const { accessCookie } = await createAdminAndLogin(AdminRole.SUPPORT, 'support_pricing@astroai.test');

      const res = await request(app)
        .post('/api/v1/admin/pricing')
        .set('Cookie', accessCookie!)
        .send({
          status: PricingConfigStatus.ACTIVE,
          effectiveFrom: new Date().toISOString(),
          notes: 'Illegal update',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Admin Wallet Management', () => {
    it('allows Finance role to adjust balance and reconcile ledger', async () => {
      const { accessCookie } = await createAdminAndLogin(AdminRole.FINANCE, 'finance_wallet@astroai.test');
      const targetUser = 'user_admin_target_1';

      // 1. Adjust wallet with a manual credit
      const adjustRes = await request(app)
        .post(`/api/v1/admin/wallets/${targetUser}/adjust`)
        .set('Cookie', accessCookie!)
        .send({
          type: WalletTransactionType.CREDIT,
          amount: 150,
          reason: 'Promotional loyalty grant',
        });

      expect(adjustRes.status).toBe(201);
      expect(adjustRes.body.data.amount).toBe(150);
      expect(adjustRes.body.data.balanceAfter).toBe(150);

      // 2. View user wallet
      const viewRes = await request(app)
        .get(`/api/v1/admin/wallets/${targetUser}`)
        .set('Cookie', accessCookie!);

      expect(viewRes.status).toBe(200);
      expect(viewRes.body.data.balance.balance).toBe(150);
      expect(viewRes.body.data.transactions.items.length).toBe(1);

      // 3. Reconcile user ledger
      const recRes = await request(app)
        .post(`/api/v1/admin/wallets/${targetUser}/reconcile`)
        .set('Cookie', accessCookie!);

      expect(recRes.status).toBe(200);
      expect(recRes.body.data.reconciled).toBe(true);
      expect(recRes.body.data.ledgerBalance).toBe(150);
    });

    it('forbids Support role from adjusting user balances', async () => {
      const { accessCookie } = await createAdminAndLogin(AdminRole.SUPPORT, 'support_wallet@astroai.test');

      const res = await request(app)
        .post('/api/v1/admin/wallets/user_x/adjust')
        .set('Cookie', accessCookie!)
        .send({
          type: WalletTransactionType.CREDIT,
          amount: 50,
          reason: 'Unauthorized attempt',
        });

      expect(res.status).toBe(403);
    });
  });
});
