import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  BillingUnit,
  PricingConfigStatus,
  ReportType,
  RoundingRule,
} from '@astroai/shared-types';

const creditPackSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    credits: { type: Number, required: true, min: 1 },
    bonusCredits: { type: Number, default: 0, min: 0 },
    priceAmount: { type: Number, required: true, min: 1 }, // in paise / cents
    currency: { type: String, default: 'INR' },
    badge: { type: String, default: null },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const chatPricingSchema = new Schema(
  {
    creditsPerMessage: { type: Number, default: 1, min: 0 },
    freeMessagesPerDay: { type: Number, default: 3, min: 0 },
    freeMessagesOnSignup: { type: Number, default: 5, min: 0 },
  },
  { _id: false },
);

const voicePricingSchema = new Schema(
  {
    billingUnit: {
      type: String,
      enum: Object.values(BillingUnit),
      default: BillingUnit.MINUTE,
    },
    creditsPerUnit: { type: Number, default: 5, min: 1 },
    minimumChargeCredits: { type: Number, default: 5, min: 0 },
    freeInitialSeconds: { type: Number, default: 30, min: 0 },
    roundingRule: {
      type: String,
      enum: Object.values(RoundingRule),
      default: RoundingRule.CEIL,
    },
    maxSessionDurationSeconds: { type: Number, default: 3600, min: 60 },
  },
  { _id: false },
);

const reportItemPricingSchema = new Schema(
  {
    reportType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    credits: { type: Number, required: true, min: 1 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const subscriptionPlanConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    tier: { type: String, required: true },
    interval: { type: String, enum: ['monthly', 'yearly'], required: true },
    priceAmount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    creditsIncludedPerPeriod: { type: Number, default: 0, min: 0 },
    discountPercentOnServices: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const pricingConfigSchema = new Schema(
  {
    version: { type: Number, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(PricingConfigStatus),
      default: PricingConfigStatus.ACTIVE,
      index: true,
    },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveTo: { type: Date, default: null },
    freeCreditsOnSignup: { type: Number, default: 10, min: 0 },
    firstPurchaseDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    creditPacks: { type: [creditPackSchema], default: [] },
    chat: { type: chatPricingSchema, required: true, default: () => ({}) },
    voice: { type: voicePricingSchema, required: true, default: () => ({}) },
    reports: { type: [reportItemPricingSchema], default: [] },
    subscriptions: { type: [subscriptionPlanConfigSchema], default: [] },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

pricingConfigSchema.index({ status: 1, effectiveFrom: -1 });

export type PricingConfigSchemaType = InferSchemaType<typeof pricingConfigSchema>;
export type PricingConfigDocument = HydratedDocument<PricingConfigSchemaType>;

export const PricingConfigModel = model('PricingConfig', pricingConfigSchema);

export const DEFAULT_INITIAL_PRICING_CONFIG = {
  version: 1,
  status: PricingConfigStatus.ACTIVE,
  effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
  effectiveTo: null,
  freeCreditsOnSignup: 10,
  firstPurchaseDiscountPercent: 20,
  creditPacks: [
    {
      id: 'pack_starter',
      name: 'Starter Pack',
      description: 'Ideal for getting started with quick chat sessions',
      credits: 50,
      bonusCredits: 5,
      priceAmount: 4900, // ₹49.00
      currency: 'INR',
      badge: null,
      active: true,
      sortOrder: 1,
    },
    {
      id: 'pack_popular',
      name: 'Astro Explorer',
      description: 'Great value for regular chart analyses and voice calls',
      credits: 200,
      bonusCredits: 40,
      priceAmount: 19900, // ₹199.00
      currency: 'INR',
      badge: 'Popular',
      active: true,
      sortOrder: 2,
    },
    {
      id: 'pack_pro',
      name: 'Cosmic Wisdom',
      description: 'Maximum bonus credits for deep astrological guidance and full reports',
      credits: 500,
      bonusCredits: 150,
      priceAmount: 49900, // ₹499.00
      currency: 'INR',
      badge: 'Best Value',
      active: true,
      sortOrder: 3,
    },
  ],
  chat: {
    creditsPerMessage: 1,
    freeMessagesPerDay: 3,
    freeMessagesOnSignup: 5,
  },
  voice: {
    billingUnit: BillingUnit.MINUTE,
    creditsPerUnit: 5,
    minimumChargeCredits: 5,
    freeInitialSeconds: 30,
    roundingRule: RoundingRule.CEIL,
    maxSessionDurationSeconds: 3600,
  },
  reports: [
    {
      reportType: ReportType.NATAL_CHART,
      title: 'Complete Kundli & Life Forecast',
      description: 'Comprehensive 25+ page Vedic birth chart analysis covering all 12 houses and planetary periods.',
      credits: 50,
      discountPercent: 10,
      active: true,
    },
    {
      reportType: ReportType.COMPATIBILITY,
      title: 'Kundli Milan & Relationship Compatibility',
      description: 'Deep Ashtakoota and planetary compatibility analysis for partners.',
      credits: 40,
      discountPercent: 0,
      active: true,
    },
    {
      reportType: ReportType.TRANSIT_ANNUAL,
      title: 'Annual Planetary Transit & Varshphal',
      description: 'Yearly solar return and planetary transit predictions for career, finance, and health.',
      credits: 60,
      discountPercent: 15,
      active: true,
    },
    {
      reportType: ReportType.CAREER_DASHA,
      title: 'Career & Financial Dasha Roadmap',
      description: 'Detailed focus on Mahadasha and Antardasha timing for career milestones and wealth.',
      credits: 45,
      discountPercent: 0,
      active: true,
    },
  ],
  subscriptions: [
    {
      id: 'sub_monthly_basic',
      name: 'Astro Basic Monthly',
      tier: 'basic',
      interval: 'monthly',
      priceAmount: 29900,
      currency: 'INR',
      creditsIncludedPerPeriod: 300,
      discountPercentOnServices: 10,
      active: true,
    },
    {
      id: 'sub_yearly_pro',
      name: 'Astro Premium Annual',
      tier: 'premium',
      interval: 'yearly',
      priceAmount: 249900,
      currency: 'INR',
      creditsIncludedPerPeriod: 4000,
      discountPercentOnServices: 25,
      active: true,
    },
  ],
  notes: 'Default initial pricing configuration',
};
