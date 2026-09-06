import { z } from 'zod';

/**
 * Supported units for voice and time-based billing.
 */
export const BillingUnit = {
  UNIT: 'unit',
  SECOND: 'second',
  THIRTY_SECONDS: 'thirty_seconds',
  MINUTE: 'minute',
} as const;
export type BillingUnit = (typeof BillingUnit)[keyof typeof BillingUnit];

/**
 * Rounding rules for metered billing calculations.
 */
export const RoundingRule = {
  CEIL: 'ceil',
  FLOOR: 'floor',
  NEAREST: 'nearest',
} as const;
export type RoundingRule = (typeof RoundingRule)[keyof typeof RoundingRule];

/**
 * Pricing config lifecycle status.
 */
export const PricingConfigStatus = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
} as const;
export type PricingConfigStatus = (typeof PricingConfigStatus)[keyof typeof PricingConfigStatus];

/**
 * Report types available in the platform.
 */
export const ReportType = {
  NATAL_CHART: 'natal_chart',
  COMPATIBILITY: 'compatibility',
  TRANSIT_ANNUAL: 'transit_annual',
  CAREER_DASHA: 'career_dasha',
  FULL_KUNDLI: 'full_kundli',
  CAREER_FINANCE: 'career_finance',
  RELATIONSHIP_COMPATIBILITY: 'relationship_compatibility',
  TRANSIT_DASHA: 'transit_dasha',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

/**
 * Credit pack structure.
 */
export const creditPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  credits: z.number().int().positive(),
  bonusCredits: z.number().int().nonnegative().default(0),
  priceAmount: z.number().int().positive(), // in lowest currency unit, e.g., paise / cents
  currency: z.string().default('INR'),
  badge: z.string().nullable().default(null), // e.g., 'Popular', 'Best Value'
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type CreditPack = z.infer<typeof creditPackSchema>;

/**
 * Chat pricing configuration schema.
 */
export const chatPricingConfigSchema = z.object({
  creditsPerMessage: z.number().int().nonnegative().default(1),
  freeMessagesPerDay: z.number().int().nonnegative().default(3),
  freeMessagesOnSignup: z.number().int().nonnegative().default(5),
});
export type ChatPricingConfig = z.infer<typeof chatPricingConfigSchema>;

/**
 * Voice pricing configuration schema.
 */
export const voicePricingConfigSchema = z.object({
  billingUnit: z.enum([BillingUnit.UNIT, BillingUnit.SECOND, BillingUnit.THIRTY_SECONDS, BillingUnit.MINUTE]).default(BillingUnit.MINUTE),
  creditsPerUnit: z.number().int().positive().default(5),
  minimumChargeCredits: z.number().int().nonnegative().default(5),
  freeInitialSeconds: z.number().int().nonnegative().default(30),
  roundingRule: z.enum([RoundingRule.CEIL, RoundingRule.FLOOR, RoundingRule.NEAREST]).default(RoundingRule.CEIL),
  maxSessionDurationSeconds: z.number().int().positive().default(3600),
});
export type VoicePricingConfig = z.infer<typeof voicePricingConfigSchema>;

/**
 * Report pricing configuration schema.
 */
export const reportItemPricingSchema = z.object({
  reportType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  credits: z.number().int().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  active: z.boolean().default(true),
});
export type ReportItemPricing = z.infer<typeof reportItemPricingSchema>;

/**
 * Subscription plan configuration schema.
 */
export const subscriptionPlanConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tier: z.string().min(1), // e.g. 'basic', 'premium', 'vip'
  interval: z.enum(['monthly', 'yearly']),
  priceAmount: z.number().int().positive(),
  currency: z.string().default('INR'),
  creditsIncludedPerPeriod: z.number().int().nonnegative(),
  discountPercentOnServices: z.number().min(0).max(100).default(0),
  active: z.boolean().default(true),
});
export type SubscriptionPlanConfig = z.infer<typeof subscriptionPlanConfigSchema>;

/**
 * Overall pricing configuration schema.
 */
export const pricingConfigSchema = z.object({
  version: z.number().int().positive(),
  status: z.enum([PricingConfigStatus.ACTIVE, PricingConfigStatus.DRAFT, PricingConfigStatus.ARCHIVED]).default(PricingConfigStatus.ACTIVE),
  effectiveFrom: z.string(), // ISO date string
  effectiveTo: z.string().nullable().default(null),
  freeCreditsOnSignup: z.number().int().nonnegative().default(10),
  firstPurchaseDiscountPercent: z.number().min(0).max(100).default(0),
  creditPacks: z.array(creditPackSchema),
  chat: chatPricingConfigSchema,
  voice: voicePricingConfigSchema,
  reports: z.array(reportItemPricingSchema),
  subscriptions: z.array(subscriptionPlanConfigSchema).default([]),
  notes: z.string().default(''),
});
export type PricingConfig = z.infer<typeof pricingConfigSchema>;

export const createPricingConfigSchema = pricingConfigSchema.omit({ version: true });
export type CreatePricingConfigInput = z.infer<typeof createPricingConfigSchema>;

/**
 * Public pricing explanation for client consumption.
 */
export interface PricingExplanation {
  freeCreditsOnSignup: number;
  chat: {
    creditsPerMessage: number;
    freeMessagesPerDay: number;
    freeMessagesOnSignup: number;
  };
  voice: {
    billingUnit: BillingUnit;
    creditsPerUnit: number;
    minimumChargeCredits: number;
    freeInitialSeconds: number;
    roundingRule: RoundingRule;
  };
  reports: Array<{
    reportType: string;
    title: string;
    description: string;
    credits: number;
    effectiveCredits: number;
    discountPercent: number;
  }>;
  creditPacks: CreditPack[];
}
