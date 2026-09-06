import { z } from 'zod';
import type { PricingSnapshot } from './wallet';

/**
 * Lifecycle state of a user payment order for credit packs or subscriptions.
 */
export const PaymentOrderStatus = {
  CREATED: 'created',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;
export type PaymentOrderStatus =
  (typeof PaymentOrderStatus)[keyof typeof PaymentOrderStatus];

/**
 * Individual payment transaction/attempt status.
 */
export const PaymentTransactionStatus = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentTransactionStatus =
  (typeof PaymentTransactionStatus)[keyof typeof PaymentTransactionStatus];

/**
 * Refund processing state.
 */
export const PaymentRefundStatus = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;
export type PaymentRefundStatus =
  (typeof PaymentRefundStatus)[keyof typeof PaymentRefundStatus];

/**
 * Supported payment gateways.
 */
export const PaymentGateway = {
  RAZORPAY: 'razorpay',
} as const;
export type PaymentGateway =
  (typeof PaymentGateway)[keyof typeof PaymentGateway];

/**
 * Schema for creating a payment order from a credit pack.
 */
export const createPaymentOrderSchema = z.object({
  packId: z.string().min(1, 'packId is required'),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
  promoCode: z.string().optional(),
});
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

/**
 * Schema for verifying a client payment return from Razorpay checkout.
 */
export const paymentVerificationSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
  razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
  razorpaySignature: z.string().min(1, 'razorpaySignature is required'),
});
export type PaymentVerificationInput = z.infer<typeof paymentVerificationSchema>;

/**
 * Schema for admin manual refund execution.
 */
export const adminPaymentRefundSchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z.string().min(3, 'Audit reason must be at least 3 characters'),
});
export type AdminPaymentRefundInput = z.infer<typeof adminPaymentRefundSchema>;

/**
 * Query schema for payment history pagination & filtering.
 */
export const paymentHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  status: z.nativeEnum(PaymentOrderStatus).optional(),
});
export type PaymentHistoryQuery = z.infer<typeof paymentHistoryQuerySchema>;

/**
 * Data Transfer Object for a Payment Order.
 */
export interface PaymentOrderDTO {
  id: string;
  userId: string;
  packId: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  amount: number; // in paise / subunit
  currency: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  promoCode?: string;
  discountAmount?: number;
  status: PaymentOrderStatus;
  idempotencyKey: string;
  pricingSnapshot: PricingSnapshot;
  refundedAmount: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data Transfer Object for a Payment Transaction attempt.
 */
export interface PaymentTransactionDTO {
  id: string;
  orderId: string;
  userId: string;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  method: string | null;
  status: PaymentTransactionStatus;
  errorCode: string | null;
  errorDescription: string | null;
  rawResponse?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Data Transfer Object for a Payment Refund.
 */
export interface PaymentRefundDTO {
  id: string;
  orderId: string;
  gatewayRefundId: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: PaymentRefundStatus;
  adminId: string | null;
  createdAt: string;
}

/**
 * Result of reconciling an order with Razorpay gateway.
 */
export interface PaymentReconciliationResult {
  orderId: string;
  gatewayOrderId: string;
  gatewayStatus: string;
  internalStatus: PaymentOrderStatus;
  isSynced: boolean;
  walletCredited: boolean;
}
