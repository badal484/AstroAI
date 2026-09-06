import { z } from 'zod';

export const PromotionDiscountType = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  CREDIT_BONUS: 'credit_bonus',
} as const;
export type PromotionDiscountType =
  (typeof PromotionDiscountType)[keyof typeof PromotionDiscountType];

export const PromotionType = {
  PROMO_CODE: 'promo_code',
  COUPON: 'coupon',
  WELCOME_OFFER: 'welcome_offer',
  FIRST_PURCHASE_OFFER: 'first_purchase_offer',
  SEASONAL_CAMPAIGN: 'seasonal_campaign',
} as const;
export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];

export const PromotionTarget = {
  ALL: 'all',
  CREDIT_PACK: 'credit_pack',
  REPORT: 'report',
  VOICE_SESSION: 'voice_session',
} as const;
export type PromotionTarget = (typeof PromotionTarget)[keyof typeof PromotionTarget];

export const PromotionAudienceSegment = {
  ALL_USERS: 'all_users',
  NEW_USERS_ONLY: 'new_users_only',
  EXISTING_USERS_ONLY: 'existing_users_only',
  INACTIVE_USERS: 'inactive_users',
  HIGH_INTENT: 'high_intent',
  VIP_USERS: 'vip_users',
} as const;
export type PromotionAudienceSegment =
  (typeof PromotionAudienceSegment)[keyof typeof PromotionAudienceSegment];

export const PromotionStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  DEPLETED: 'depleted',
} as const;
export type PromotionStatus = (typeof PromotionStatus)[keyof typeof PromotionStatus];

export const ReferralStatus = {
  PENDING: 'pending',
  QUALIFIED: 'qualified',
  REWARDED: 'rewarded',
  REJECTED_ABUSE: 'rejected_abuse',
} as const;
export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus];

// Zod validation schemas
export const promotionRulesSchema = z.object({
  minPurchaseAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().min(0).nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  totalUsageLimit: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).default(1),
  newUserOnly: z.boolean().default(false),
  existingUserOnly: z.boolean().default(false),
});
export type PromotionRules = z.infer<typeof promotionRulesSchema>;

export const createPromotionSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(30, 'Code max 30 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric')
    .transform((val) => val.toUpperCase()),
  name: z.string().min(3).max(100),
  description: z.string().max(500).default(''),
  type: z.enum([
    PromotionType.PROMO_CODE,
    PromotionType.COUPON,
    PromotionType.WELCOME_OFFER,
    PromotionType.FIRST_PURCHASE_OFFER,
    PromotionType.SEASONAL_CAMPAIGN,
  ]),
  discountType: z.enum([
    PromotionDiscountType.PERCENTAGE,
    PromotionDiscountType.FIXED_AMOUNT,
    PromotionDiscountType.CREDIT_BONUS,
  ]),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  target: z.enum([
    PromotionTarget.ALL,
    PromotionTarget.CREDIT_PACK,
    PromotionTarget.REPORT,
    PromotionTarget.VOICE_SESSION,
  ]).default(PromotionTarget.ALL),
  targetIds: z.array(z.string()).default([]),
  audienceSegment: z.enum([
    PromotionAudienceSegment.ALL_USERS,
    PromotionAudienceSegment.NEW_USERS_ONLY,
    PromotionAudienceSegment.EXISTING_USERS_ONLY,
    PromotionAudienceSegment.INACTIVE_USERS,
    PromotionAudienceSegment.HIGH_INTENT,
    PromotionAudienceSegment.VIP_USERS,
  ]).default(PromotionAudienceSegment.ALL_USERS),
  rules: promotionRulesSchema.default({}),
  isActive: z.boolean().default(true),
});
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

export const updatePromotionSchema = createPromotionSchema.partial();
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

export const validatePromoCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .transform((val) => val.trim().toUpperCase()),
  amount: z.number().min(0),
  targetType: z.enum([
    PromotionTarget.ALL,
    PromotionTarget.CREDIT_PACK,
    PromotionTarget.REPORT,
    PromotionTarget.VOICE_SESSION,
  ]).default(PromotionTarget.ALL),
  targetId: z.string().optional(),
});
export type ValidatePromoCodeInput = z.infer<typeof validatePromoCodeSchema>;

export const claimReferralCodeSchema = z.object({
  referralCode: z
    .string()
    .min(3)
    .max(20)
    .transform((val) => val.trim().toUpperCase()),
  deviceId: z.string().optional(),
  ipAddress: z.string().optional(),
});
export type ClaimReferralCodeInput = z.infer<typeof claimReferralCodeSchema>;

// DTOs
export interface PromotionDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  type: PromotionType;
  discountType: PromotionDiscountType;
  discountValue: number;
  target: PromotionTarget;
  targetIds: string[];
  audienceSegment: PromotionAudienceSegment;
  rules: PromotionRules;
  stats: {
    impressions: number;
    redemptions: number;
    revenueGenerated: number;
    discountCost: number;
  };
  status: PromotionStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionValidationResultDTO {
  valid: boolean;
  code: string;
  promotionId?: string;
  discountType?: PromotionDiscountType;
  discountValue?: number;
  discountAmount: number;
  bonusCredits: number;
  originalAmount: number;
  finalAmount: number;
  message: string;
}

export interface RedemptionDTO {
  id: string;
  promotionId: string;
  code: string;
  userId: string;
  orderId?: string;
  discountApplied: number;
  bonusCreditsGranted: number;
  originalAmount: number;
  finalAmount: number;
  createdAt: string;
}

export interface ReferralRecordDTO {
  id: string;
  referrerId: string;
  referrerCode: string;
  refereeId: string;
  refereeName?: string;
  refereeEmail?: string;
  status: ReferralStatus;
  referrerRewardCredits: number;
  refereeRewardCredits: number;
  qualifyingOrderId?: string;
  abuseSignals?: string[];
  rewardedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserReferralSummaryDTO {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  referrerRewardPerInvite: number;
  refereeRewardOnSignup: number;
  history: ReferralRecordDTO[];
}

export interface PromotionAnalyticsDTO {
  totalPromotions: number;
  activePromotions: number;
  totalRedemptions: number;
  totalGrossRevenue: number;
  totalDiscountCost: number;
  netRevenue: number;
  overallROI: number; // (Gross Revenue - Discount Cost) / Discount Cost
  conversionRate: number; // Redemptions / Impressions
  topPromotions: Array<{
    id: string;
    code: string;
    name: string;
    redemptions: number;
    revenueGenerated: number;
    discountCost: number;
    roi: number;
  }>;
}
