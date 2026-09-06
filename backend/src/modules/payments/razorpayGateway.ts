import crypto from 'node:crypto';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import { PaymentGatewayError } from '../../shared/errors';

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPaymentResult {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  captured: boolean;
  error_code?: string;
  error_description?: string;
}

export interface RazorpayRefundResult {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
}

export const razorpayGateway = {
  get isConfigured(): boolean {
    return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  },

  get keyId(): string {
    return env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id';
  },

  get keySecret(): string {
    return env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_key_secret';
  },

  get webhookSecret(): string {
    return env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_mock_webhook_secret';
  },

  /**
   * Verifies HMAC-SHA256 client payment return signature:
   * hmac_sha256(order_id + '|' + payment_id, secret)
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) return false;
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    try {
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  /**
   * Verifies Razorpay Webhook signature:
   * hmac_sha256(rawBody, webhookSecret) === headerSignature
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!rawBody || !signature) return false;
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyStr)
      .digest('hex');

    try {
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  /**
   * Generates valid payment return signature (useful for testing & SDK responses).
   */
  generatePaymentSignature(orderId: string, paymentId: string): string {
    return crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  },

  /**
   * Generates valid webhook signature (useful for automated testing).
   */
  generateWebhookSignature(payload: string | Record<string, unknown>): string {
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyStr)
      .digest('hex');
  },

  /**
   * Creates an order with Razorpay REST API (or deterministic mock if offline).
   */
  async createOrder(params: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    if (!this.isConfigured) {
      const mockId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
      logger.info({ mockId, params }, 'Razorpay unconfigured: Generated mock order');
      return {
        id: mockId,
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        status: 'created',
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency,
          receipt: params.receipt,
          notes: params.notes,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        logger.error({ status: res.status, errJson }, 'Razorpay createOrder failed');
        throw new PaymentGatewayError('Failed to create Razorpay order', errJson);
      }

      return (await res.json()) as RazorpayOrderResult;
    } catch (err: any) {
      if (err instanceof PaymentGatewayError) throw err;
      logger.error({ err }, 'Razorpay network error on createOrder');
      throw new PaymentGatewayError('Network error communicating with Razorpay');
    }
  },

  /**
   * Fetches payment details from Razorpay API.
   */
  async fetchPayment(paymentId: string): Promise<RazorpayPaymentResult> {
    if (!this.isConfigured) {
      return {
        id: paymentId,
        order_id: 'order_mock_sample',
        amount: 4900,
        currency: 'INR',
        status: 'captured',
        captured: true,
        method: 'upi',
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        throw new PaymentGatewayError('Failed to fetch Razorpay payment', errJson);
      }

      return (await res.json()) as RazorpayPaymentResult;
    } catch (err: any) {
      if (err instanceof PaymentGatewayError) throw err;
      throw new PaymentGatewayError('Network error communicating with Razorpay');
    }
  },

  /**
   * Creates a refund on Razorpay.
   */
  async createRefund(
    paymentId: string,
    params: { amount?: number; notes?: Record<string, string> },
  ): Promise<RazorpayRefundResult> {
    if (!this.isConfigured) {
      const mockRefundId = `rfnd_mock_${crypto.randomBytes(8).toString('hex')}`;
      logger.info({ mockRefundId, paymentId, params }, 'Razorpay unconfigured: Generated mock refund');
      return {
        id: mockRefundId,
        payment_id: paymentId,
        amount: params.amount ?? 0,
        currency: 'INR',
        status: 'processed',
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          notes: params.notes,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        throw new PaymentGatewayError('Failed to create Razorpay refund', errJson);
      }

      return (await res.json()) as RazorpayRefundResult;
    } catch (err: any) {
      if (err instanceof PaymentGatewayError) throw err;
      throw new PaymentGatewayError('Network error communicating with Razorpay refund API');
    }
  },
};
