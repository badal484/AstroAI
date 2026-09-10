import argon2 from 'argon2';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AdminRole,
  PaymentOrderStatus,
  WalletTransactionSource,
  WalletTransactionType,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { paymentService } from '../../src/modules/payments/payment.service';
import { razorpayGateway } from '../../src/modules/payments/razorpayGateway';
import { pricingService } from '../../src/modules/pricing/pricing.service';
import { userService } from '../../src/modules/users';
import { walletService } from '../../src/modules/wallet/wallet.service';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: 'Payment Admin', role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

async function createAuthedUser() {
  const user = await userService.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Payment Test User',
    avatarUrl: null,
  });
  const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
  return { user, token };
}

describe('Razorpay Payments & Reconciliation Integration Tests', () => {
  let activePackId: string;

  beforeEach(async () => {
    const pricing = await pricingService.getActiveConfig();
    activePackId = pricing.creditPacks[0]!.id;
  });

  describe('Order Creation', () => {
    it('creates a new payment order for an active credit pack', async () => {
      const { user, token } = await createAuthedUser();

      const res = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packId: activePackId,
          idempotencyKey: 'order_create_test_1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(user.id);
      expect(res.body.data.packId).toBe(activePackId);
      expect(res.body.data.status).toBe(PaymentOrderStatus.CREATED);
      expect(res.body.data.gatewayOrderId).toBeTruthy();
      expect(res.body.data.amount).toBeGreaterThan(0);
      expect(res.body.data.totalCredits).toBeGreaterThan(0);
    });

    it('returns existing order on duplicate idempotent request', async () => {
      const { token } = await createAuthedUser();

      const res1 = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packId: activePackId,
          idempotencyKey: 'dup_order_key_100',
        });

      const res2 = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          packId: activePackId,
          idempotencyKey: 'dup_order_key_100',
        });

      expect(res1.body.data.id).toBe(res2.body.data.id);
      expect(res1.body.data.gatewayOrderId).toBe(res2.body.data.gatewayOrderId);
    });
  });

  describe('Authoritative Client Verification Flow', () => {
    it('verifies signature, transitions order to PAID, and credits wallet atomically', async () => {
      const { user, token } = await createAuthedUser();

      // 1. Create Order
      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'verify_flow_ord_1',
      });

      // 2. Generate authentic gateway payment signature
      const paymentId = 'pay_verified_999';
      const signature = razorpayGateway.generatePaymentSignature(order.gatewayOrderId, paymentId);

      // 3. Call verify endpoint
      const verifyRes = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.gatewayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.order.status).toBe(PaymentOrderStatus.PAID);
      expect(verifyRes.body.data.order.paidAt).toBeTruthy();
      expect(verifyRes.body.data.walletBalance.balance).toBe(order.totalCredits);

      // 4. Verify immutable wallet ledger entry
      const transactions = await walletService.getTransactions(user.id);
      expect(transactions.items.length).toBe(1);
      expect(transactions.items[0]!.type).toBe(WalletTransactionType.CREDIT);
      expect(transactions.items[0]!.source).toBe(WalletTransactionSource.PAYMENT);
      expect(transactions.items[0]!.amount).toBe(order.totalCredits);
      expect(transactions.items[0]!.referenceId).toBe(paymentId);
    });

    it('rejects tampered or forged client signatures', async () => {
      const { user, token } = await createAuthedUser();

      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'tamper_test_ord_1',
      });

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.gatewayOrderId,
          razorpayPaymentId: 'pay_tampered_1',
          razorpaySignature: 'invalid_forged_hex_signature',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PAYMENT_SIGNATURE_INVALID');

      // Balance remains 0
      const balance = await walletService.getBalance(user.id);
      expect(balance.balance).toBe(0);
    });
  });

  describe('App Crash & Webhook Recovery Scenarios', () => {
    it('credits wallet via webhook when mobile app crashes after payment', async () => {
      const { user } = await createAuthedUser();

      // 1. User created order before app crashed
      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'crash_order_1',
      });

      const paymentId = 'pay_webhook_crash_recovery_101';
      const webhookPayload = {
        event: 'payment.captured',
        id: 'evt_crash_recovery_1',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: order.gatewayOrderId,
              amount: order.amount,
              currency: 'INR',
              status: 'captured',
              method: 'upi',
            },
          },
        },
      };

      const rawPayload = JSON.stringify(webhookPayload);
      const signature = razorpayGateway.generateWebhookSignature(rawPayload);

      // 2. Razorpay sends server-to-server webhook
      const webhookRes = await request(app)
        .post('/api/v1/payments/webhook')
        .set('X-Razorpay-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(webhookRes.status).toBe(200);

      // 3. Wallet is credited without any frontend verify call
      const balance = await walletService.getBalance(user.id);
      expect(balance.balance).toBe(order.totalCredits);

      // 4. Details show order is marked PAID
      const details = await paymentService.getOrderDetails(order.id);
      expect(details.order.status).toBe(PaymentOrderStatus.PAID);
    });

    it('safely handles duplicate webhook deliveries (retries) without double-crediting', async () => {
      const { user } = await createAuthedUser();

      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'webhook_retry_order_1',
      });

      const paymentId = 'pay_webhook_retry_202';
      const webhookPayload = {
        event: 'payment.captured',
        id: 'evt_fixed_unique_event_id_202',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: order.gatewayOrderId,
              amount: order.amount,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      };

      const rawPayload = JSON.stringify(webhookPayload);
      const signature = razorpayGateway.generateWebhookSignature(rawPayload);

      // 1st delivery
      const res1 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('X-Razorpay-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);
      expect(res1.status).toBe(200);

      // 2nd duplicate retry delivery
      const res2 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('X-Razorpay-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);
      expect(res2.status).toBe(200);

      // Final balance is exact, no double credit
      const balance = await walletService.getBalance(user.id);
      expect(balance.balance).toBe(order.totalCredits);
    });

    it('handles out-of-order execution (client verify succeeds -> delayed webhook arrives)', async () => {
      const { user, token } = await createAuthedUser();

      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'interleave_order_303',
      });

      const paymentId = 'pay_interleave_303';
      const signature = razorpayGateway.generatePaymentSignature(order.gatewayOrderId, paymentId);

      // 1. Client verifies first
      await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.gatewayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        });

      // 2. Delayed webhook arrives later with a different event ID
      const webhookPayload = {
        event: 'order.paid',
        id: 'evt_delayed_order_paid_303',
        payload: {
          order: {
            entity: {
              id: order.gatewayOrderId,
              amount: order.amount,
              status: 'paid',
            },
          },
          payment: {
            entity: {
              id: paymentId,
              order_id: order.gatewayOrderId,
              amount: order.amount,
              status: 'captured',
            },
          },
        },
      };

      const rawPayload = JSON.stringify(webhookPayload);
      const webhookSig = razorpayGateway.generateWebhookSignature(rawPayload);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('X-Razorpay-Signature', webhookSig)
        .set('Content-Type', 'application/json')
        .send(rawPayload);
      expect(res.status).toBe(200);

      // Wallet remains credited exactly once
      const balance = await walletService.getBalance(user.id);
      expect(balance.balance).toBe(order.totalCredits);
    });

    it('marks order FAILED on payment.failed webhook without issuing credits', async () => {
      const { user } = await createAuthedUser();

      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'fail_test_order_404',
      });

      const webhookPayload = {
        event: 'payment.failed',
        id: 'evt_payment_failed_404',
        payload: {
          payment: {
            entity: {
              id: 'pay_failed_404',
              order_id: order.gatewayOrderId,
              amount: order.amount,
              status: 'failed',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment was cancelled by the user',
            },
          },
        },
      };

      const rawPayload = JSON.stringify(webhookPayload);
      const signature = razorpayGateway.generateWebhookSignature(rawPayload);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('X-Razorpay-Signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);
      expect(res.status).toBe(200);

      // Order is FAILED
      const details = await paymentService.getOrderDetails(order.id);
      expect(details.order.status).toBe(PaymentOrderStatus.FAILED);

      // Balance remains 0
      const balance = await walletService.getBalance(user.id);
      expect(balance.balance).toBe(0);
    });
  });

  describe('Refunds & Partial Refunds', () => {
    it('executes full refund, debits wallet balance, and updates order status to REFUNDED', async () => {
      const { user, token } = await createAuthedUser();
      const { accessCookie } = await createAdminAndLogin(AdminRole.FINANCE, 'finance_refund@astroai.test');

      // 1. Complete a payment order
      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'refund_test_ord_1',
      });
      const paymentId = 'pay_to_refund_101';
      const sig = razorpayGateway.generatePaymentSignature(order.gatewayOrderId, paymentId);
      await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.gatewayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: sig,
        });

      const balBeforeRefund = await walletService.getBalance(user.id);
      expect(balBeforeRefund.balance).toBe(order.totalCredits);

      // 2. Admin issues full refund
      const refundRes = await request(app)
        .post(`/api/v1/admin/payments/${order.id}/refund`)
        .set('Cookie', accessCookie!)
        .send({
          reason: 'Customer requested refund within 24 hours',
        });

      expect(refundRes.status).toBe(201);
      expect(refundRes.body.data.amount).toBe(order.amount);

      // 3. Order status is REFUNDED
      const details = await paymentService.getOrderDetails(order.id);
      expect(details.order.status).toBe(PaymentOrderStatus.REFUNDED);

      // 4. Wallet debited back to 0
      const balAfterRefund = await walletService.getBalance(user.id);
      expect(balAfterRefund.balance).toBe(0);
    });

    it('executes partial refund proportionally debiting wallet credits', async () => {
      const { user, token } = await createAuthedUser();
      const { accessCookie } = await createAdminAndLogin(AdminRole.FINANCE, 'finance_partial@astroai.test');

      // 1. Complete payment
      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'partial_refund_ord_2',
      });
      const paymentId = 'pay_partial_202';
      const sig = razorpayGateway.generatePaymentSignature(order.gatewayOrderId, paymentId);
      await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.gatewayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: sig,
        });

      // 2. Admin issues 50% partial refund
      const halfAmount = Math.floor(order.amount / 2);
      const refundRes = await request(app)
        .post(`/api/v1/admin/payments/${order.id}/refund`)
        .set('Cookie', accessCookie!)
        .send({
          amount: halfAmount,
          reason: 'Partial courtesy refund',
        });

      expect(refundRes.status).toBe(201);

      // 3. Status is PARTIALLY_REFUNDED
      const details = await paymentService.getOrderDetails(order.id);
      expect(details.order.status).toBe(PaymentOrderStatus.PARTIALLY_REFUNDED);
      expect(details.order.refundedAmount).toBe(halfAmount);

      // 4. Wallet debited proportionally
      const expectedRemainingCredits = order.totalCredits - Math.round((halfAmount / order.amount) * order.totalCredits);
      const bal = await walletService.getBalance(user.id);
      expect(bal.balance).toBe(expectedRemainingCredits);
    });
  });

  describe('Admin Management & Reconciliation', () => {
    it('allows Finance role to list payments and reconcile order', async () => {
      const { accessCookie } = await createAdminAndLogin(AdminRole.FINANCE, 'finance_list_unique_rec@astroai.test');
      const { user } = await createAuthedUser();

      const order = await paymentService.createOrder(user.id, {
        packId: activePackId,
        idempotencyKey: 'admin_list_ord_1',
      });

      // List payments
      const listRes = await request(app)
        .get('/api/v1/admin/payments')
        .set('Cookie', accessCookie!);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBeGreaterThan(0);

      // Reconcile order
      const recRes = await request(app)
        .post(`/api/v1/admin/payments/${order.id}/reconcile`)
        .set('Cookie', accessCookie!);

      expect(recRes.status).toBe(200);
      expect(recRes.body.data.orderId).toBe(order.id);
    });

    it('forbids unauthorized roles from managing refunds', async () => {
      const { accessCookie } = await createAdminAndLogin(AdminRole.MARKETING, 'mktg_refund@astroai.test');

      const res = await request(app)
        .post('/api/v1/admin/payments/dummy_order_id/refund')
        .set('Cookie', accessCookie!)
        .send({ reason: 'Not allowed' });

      expect(res.status).toBe(403);
    });
  });
});
