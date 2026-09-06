import { describe, expect, it } from 'vitest';
import { razorpayGateway } from '../../../src/modules/payments/razorpayGateway';

describe('Razorpay Signature Verification Unit Tests', () => {
  const orderId = 'order_DAvD8z4qWn1Q3z';
  const paymentId = 'pay_29QQoUBcxNqdf0';

  it('validates authentic payment signature matching secret', () => {
    const validSignature = razorpayGateway.generatePaymentSignature(orderId, paymentId);
    const isValid = razorpayGateway.verifyPaymentSignature(orderId, paymentId, validSignature);
    expect(isValid).toBe(true);
  });

  it('rejects tampered payment signature', () => {
    const validSignature = razorpayGateway.generatePaymentSignature(orderId, paymentId);
    const tampered = validSignature.slice(0, -4) + 'abcd';
    const isValid = razorpayGateway.verifyPaymentSignature(orderId, paymentId, tampered);
    expect(isValid).toBe(false);
  });

  it('rejects signature when orderId or paymentId is modified', () => {
    const validSignature = razorpayGateway.generatePaymentSignature(orderId, paymentId);
    const isOrderTampered = razorpayGateway.verifyPaymentSignature(
      'order_DIFFERENT_123',
      paymentId,
      validSignature,
    );
    expect(isOrderTampered).toBe(false);

    const isPaymentTampered = razorpayGateway.verifyPaymentSignature(
      orderId,
      'pay_DIFFERENT_999',
      validSignature,
    );
    expect(isPaymentTampered).toBe(false);
  });

  it('validates authentic webhook HMAC signature', () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: paymentId, order_id: orderId, amount: 4900 } },
      },
    });

    const validWebhookSig = razorpayGateway.generateWebhookSignature(payload);
    const isValid = razorpayGateway.verifyWebhookSignature(payload, validWebhookSig);
    expect(isValid).toBe(true);
  });

  it('rejects webhook with modified body payload or incorrect signature', () => {
    const originalPayload = JSON.stringify({
      event: 'payment.captured',
      payload: { amount: 4900 },
    });
    const validWebhookSig = razorpayGateway.generateWebhookSignature(originalPayload);

    const tamperedPayload = JSON.stringify({
      event: 'payment.captured',
      payload: { amount: 99000 },
    });

    const isValid = razorpayGateway.verifyWebhookSignature(tamperedPayload, validWebhookSig);
    expect(isValid).toBe(false);
  });
});
