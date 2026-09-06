import { z } from 'zod';

/**
 * Immutable ledger transaction types.
 */
export const WalletTransactionType = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  REFUND: 'refund',
  BONUS: 'bonus',
  PROMOTIONAL_CREDIT: 'promotional_credit',
  REFERRAL_CREDIT: 'referral_credit',
  ADJUSTMENT: 'adjustment',
} as const;
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

/**
 * Origin source for a wallet ledger entry.
 */
export const WalletTransactionSource = {
  PAYMENT: 'payment',
  CHAT: 'chat',
  VOICE: 'voice',
  REPORT: 'report',
  ADMIN: 'admin',
  SIGNUP_BONUS: 'signup_bonus',
  REFERRAL_REWARD: 'referral_reward',
  PROMO_COUPON: 'promo_coupon',
  SUBSCRIPTION: 'subscription',
} as const;
export type WalletTransactionSource = (typeof WalletTransactionSource)[keyof typeof WalletTransactionSource];

/**
 * Ledger transaction status.
 */
export const WalletTransactionStatus = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  REVERSED: 'reversed',
} as const;
export type WalletTransactionStatus = (typeof WalletTransactionStatus)[keyof typeof WalletTransactionStatus];

/**
 * Hold status for 2-phase metered operations.
 */
export const WalletHoldStatus = {
  ACTIVE: 'active',
  CAPTURED: 'captured',
  RELEASED: 'released',
  EXPIRED: 'expired',
} as const;
export type WalletHoldStatus = (typeof WalletHoldStatus)[keyof typeof WalletHoldStatus];

/**
 * Historical snapshot of pricing applied at transaction time.
 */
export interface PricingSnapshot {
  pricingVersion: number;
  unitPrice: number;
  unitsCalculated?: number;
  billingUnit?: string;
  discountAppliedPercent?: number;
  grossAmount?: number;
  netAmount: number;
}

/**
 * User wallet balance summary DTO.
 */
export interface WalletBalanceDTO {
  userId: string;
  balance: number;
  heldBalance: number;
  availableBalance: number;
  currency: string;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

/**
 * Immutable wallet transaction ledger entry DTO.
 */
export interface WalletTransactionDTO {
  id: string;
  userId: string;
  idempotencyKey: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  source: WalletTransactionSource;
  referenceId: string | null;
  status: WalletTransactionStatus;
  pricingSnapshot?: PricingSnapshot | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Hold reservation DTO.
 */
export interface WalletHoldDTO {
  id: string;
  userId: string;
  amount: number;
  referenceId: string | null;
  source: WalletTransactionSource;
  status: WalletHoldStatus;
  expiresAt: string;
  createdAt: string;
}

/**
 * Admin manual balance adjustment schema.
 */
export const adminWalletAdjustmentSchema = z.object({
  type: z.enum([WalletTransactionType.CREDIT, WalletTransactionType.DEBIT]),
  amount: z.number().int().positive('Adjustment amount must be a positive integer'),
  reason: z.string().min(3, 'Reason is required for audit trails (min 3 chars)'),
  referenceId: z.string().optional(),
  idempotencyKey: z.string().min(1).optional(),
});
export type AdminWalletAdjustmentInput = z.infer<typeof adminWalletAdjustmentSchema>;

/**
 * Filter and pagination query for wallet transaction ledger.
 */
export const walletTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  type: z.enum([
    WalletTransactionType.CREDIT,
    WalletTransactionType.DEBIT,
    WalletTransactionType.REFUND,
    WalletTransactionType.BONUS,
    WalletTransactionType.PROMOTIONAL_CREDIT,
    WalletTransactionType.REFERRAL_CREDIT,
    WalletTransactionType.ADJUSTMENT,
  ]).optional(),
  source: z.enum([
    WalletTransactionSource.PAYMENT,
    WalletTransactionSource.CHAT,
    WalletTransactionSource.VOICE,
    WalletTransactionSource.REPORT,
    WalletTransactionSource.ADMIN,
    WalletTransactionSource.SIGNUP_BONUS,
    WalletTransactionSource.REFERRAL_REWARD,
    WalletTransactionSource.PROMO_COUPON,
    WalletTransactionSource.SUBSCRIPTION,
  ]).optional(),
});
export type WalletTransactionsQuery = z.infer<typeof walletTransactionsQuerySchema>;
