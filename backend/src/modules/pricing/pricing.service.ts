import {
  BillingUnit,
  PricingConfigStatus,
  RoundingRule,
  type CreatePricingConfigInput,
  type CreditPack,
  type PricingConfig,
  type PricingExplanation,
} from '@astroai/shared-types';
import { redis } from '../../lib/redis';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import { pricingRepository } from './pricing.repository';
import type { PricingConfigDocument } from './pricingConfig.model';

const REDIS_ACTIVE_PRICING_KEY = 'pricing:active:v1';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export interface CalculatedVoiceCost {
  billableSeconds: number;
  billableUnits: number;
  billingUnit: BillingUnit;
  creditsPerUnit: number;
  grossCredits: number;
  finalCredits: number;
  minimumChargeCredits: number;
  freeInitialSeconds: number;
  pricingVersion: number;
}

export interface CalculatedChatCost {
  creditsRequired: number;
  pricingVersion: number;
  isFreeQuota: boolean;
}

export interface CalculatedReportCost {
  reportType: string;
  baseCredits: number;
  discountPercent: number;
  finalCredits: number;
  pricingVersion: number;
}

function toPricingConfigDTO(doc: PricingConfigDocument): PricingConfig {
  return {
    version: doc.version,
    status: doc.status as PricingConfigStatus,
    effectiveFrom: doc.effectiveFrom.toISOString(),
    effectiveTo: doc.effectiveTo ? doc.effectiveTo.toISOString() : null,
    freeCreditsOnSignup: doc.freeCreditsOnSignup,
    firstPurchaseDiscountPercent: doc.firstPurchaseDiscountPercent,
    creditPacks: doc.creditPacks.map((pack) => ({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      credits: pack.credits,
      bonusCredits: pack.bonusCredits,
      priceAmount: pack.priceAmount,
      currency: pack.currency,
      badge: pack.badge ?? null,
      active: pack.active,
      sortOrder: pack.sortOrder,
    })),
    chat: {
      creditsPerMessage: doc.chat.creditsPerMessage,
      freeMessagesPerDay: doc.chat.freeMessagesPerDay,
      freeMessagesOnSignup: doc.chat.freeMessagesOnSignup,
    },
    voice: {
      billingUnit: doc.voice.billingUnit as BillingUnit,
      creditsPerUnit: doc.voice.creditsPerUnit,
      minimumChargeCredits: doc.voice.minimumChargeCredits,
      freeInitialSeconds: doc.voice.freeInitialSeconds,
      roundingRule: doc.voice.roundingRule as RoundingRule,
      maxSessionDurationSeconds: doc.voice.maxSessionDurationSeconds,
    },
    reports: doc.reports.map((report) => ({
      reportType: report.reportType,
      title: report.title,
      description: report.description,
      credits: report.credits,
      discountPercent: report.discountPercent,
      active: report.active,
    })),
    subscriptions: doc.subscriptions.map((sub) => ({
      id: sub.id,
      name: sub.name,
      tier: sub.tier,
      interval: sub.interval as 'monthly' | 'yearly',
      priceAmount: sub.priceAmount,
      currency: sub.currency,
      creditsIncludedPerPeriod: sub.creditsIncludedPerPeriod,
      discountPercentOnServices: sub.discountPercentOnServices,
      active: sub.active,
    })),
    notes: doc.notes,
  };
}

export const pricingService = {
  /**
   * Retrieves the currently active pricing configuration.
   * Cached in Redis with TTL; fast cache invalidation on updates.
   */
  async getActiveConfig(forceRefresh = false): Promise<PricingConfig> {
    if (!forceRefresh) {
      try {
        const cached = await redis.get(REDIS_ACTIVE_PRICING_KEY);
        if (cached) {
          return JSON.parse(cached) as PricingConfig;
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to read pricing cache from Redis');
      }
    }

    const doc = await pricingRepository.findActive();
    const dto = toPricingConfigDTO(doc);

    try {
      await redis.setex(REDIS_ACTIVE_PRICING_KEY, CACHE_TTL_SECONDS, JSON.stringify(dto));
    } catch (err) {
      logger.warn({ err }, 'Failed to write pricing cache to Redis');
    }

    return dto;
  },

  /**
   * Calculates the chat cost for a user message based on current pricing.
   */
  async calculateChatCost(_userId?: string): Promise<CalculatedChatCost> {
    const config = await this.getActiveConfig();
    return {
      creditsRequired: config.chat.creditsPerMessage,
      pricingVersion: config.version,
      isFreeQuota: false,
    };
  },

  /**
   * Calculates voice call cost based on session duration, billing unit,
   * rounding rule, minimum charge, and free initial seconds.
   */
  async calculateVoiceCost(durationSeconds: number): Promise<CalculatedVoiceCost> {
    const config = await this.getActiveConfig();
    const { voice } = config;

    const rawSeconds = Math.max(0, Math.floor(durationSeconds));
    const freeSeconds = voice.freeInitialSeconds ?? 0;
    const billableSeconds = Math.max(0, rawSeconds - freeSeconds);

    if (billableSeconds === 0) {
      return {
        billableSeconds: 0,
        billableUnits: 0,
        billingUnit: voice.billingUnit,
        creditsPerUnit: voice.creditsPerUnit,
        grossCredits: 0,
        finalCredits: 0,
        minimumChargeCredits: voice.minimumChargeCredits,
        freeInitialSeconds: freeSeconds,
        pricingVersion: config.version,
      };
    }

    // Determine unit divisor in seconds
    let unitSizeSeconds = 60;
    if (voice.billingUnit === BillingUnit.SECOND) {
      unitSizeSeconds = 1;
    } else if (voice.billingUnit === BillingUnit.THIRTY_SECONDS) {
      unitSizeSeconds = 30;
    } else if (voice.billingUnit === BillingUnit.MINUTE) {
      unitSizeSeconds = 60;
    } else if (voice.billingUnit === BillingUnit.UNIT) {
      unitSizeSeconds = 60;
    }

    // Apply rounding rules
    const rawUnits = billableSeconds / unitSizeSeconds;
    let roundedUnits = 0;

    switch (voice.roundingRule) {
      case RoundingRule.FLOOR:
        roundedUnits = Math.max(1, Math.floor(rawUnits));
        break;
      case RoundingRule.NEAREST:
        roundedUnits = Math.max(1, Math.round(rawUnits));
        break;
      case RoundingRule.CEIL:
      default:
        roundedUnits = Math.ceil(rawUnits);
        break;
    }

    const grossCredits = roundedUnits * voice.creditsPerUnit;
    const finalCredits = Math.max(voice.minimumChargeCredits, grossCredits);

    return {
      billableSeconds,
      billableUnits: roundedUnits,
      billingUnit: voice.billingUnit,
      creditsPerUnit: voice.creditsPerUnit,
      grossCredits,
      finalCredits,
      minimumChargeCredits: voice.minimumChargeCredits,
      freeInitialSeconds: freeSeconds,
      pricingVersion: config.version,
    };
  },

  /**
   * Calculates report purchase price based on report type and active discount.
   */
  async calculateReportCost(
    reportType: string,
    isFirstPurchase = false,
  ): Promise<CalculatedReportCost> {
    const config = await this.getActiveConfig();
    const normalizeType = (t: string) => {
      if (t === 'full_kundli') return 'natal_chart';
      if (t === 'relationship_compatibility') return 'compatibility';
      if (t === 'career_finance') return 'career_dasha';
      if (t === 'transit_dasha') return 'transit_annual';
      return t;
    };
    const norm = normalizeType(reportType);
    const reportItem = config.reports.find(
      (r) => (r.reportType === reportType || r.reportType === norm) && r.active,
    );

    if (!reportItem) {
      throw new NotFoundError(`Pricing for report type '${reportType}' not found`);
    }

    let discount = reportItem.discountPercent;
    if (isFirstPurchase && config.firstPurchaseDiscountPercent > discount) {
      discount = config.firstPurchaseDiscountPercent;
    }

    const discountAmount = Math.floor((reportItem.credits * discount) / 100);
    const finalCredits = Math.max(1, reportItem.credits - discountAmount);

    return {
      reportType,
      baseCredits: reportItem.credits,
      discountPercent: discount,
      finalCredits,
      pricingVersion: config.version,
    };
  },

  /**
   * Returns all active credit packs.
   */
  async getCreditPacks(): Promise<CreditPack[]> {
    const config = await this.getActiveConfig();
    return config.creditPacks
      .filter((pack) => pack.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /**
   * Returns a structured pricing explanation for user UI.
   */
  async getPricingExplanation(): Promise<PricingExplanation> {
    const config = await this.getActiveConfig();
    return {
      freeCreditsOnSignup: config.freeCreditsOnSignup,
      chat: {
        creditsPerMessage: config.chat.creditsPerMessage,
        freeMessagesPerDay: config.chat.freeMessagesPerDay,
        freeMessagesOnSignup: config.chat.freeMessagesOnSignup,
      },
      voice: {
        billingUnit: config.voice.billingUnit,
        creditsPerUnit: config.voice.creditsPerUnit,
        minimumChargeCredits: config.voice.minimumChargeCredits,
        freeInitialSeconds: config.voice.freeInitialSeconds,
        roundingRule: config.voice.roundingRule,
      },
      reports: config.reports
        .filter((r) => r.active)
        .map((r) => {
          const discountAmt = Math.floor((r.credits * r.discountPercent) / 100);
          return {
            reportType: r.reportType,
            title: r.title,
            description: r.description,
            credits: r.credits,
            discountPercent: r.discountPercent,
            effectiveCredits: Math.max(1, r.credits - discountAmt),
          };
        }),
      creditPacks: config.creditPacks
        .filter((p) => p.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  },

  /**
   * Admin: Creates and publishes a new immutable version of the pricing configuration.
   * Automatically increments version number, sets effective date, archives previous version,
   * and invalidates Redis cache.
   */
  async createConfigVersion(
    _adminId: string,
    input: CreatePricingConfigInput,
  ): Promise<PricingConfig> {
    const latestVersion = await pricingRepository.findLatestVersion();
    const nextVersion = latestVersion + 1;

    const effectiveFromDate = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();
    if (isNaN(effectiveFromDate.getTime())) {
      throw new ValidationError('Invalid effectiveFrom date format');
    }

    if (input.status === PricingConfigStatus.ACTIVE) {
      await pricingRepository.archivePriorActive(nextVersion, effectiveFromDate);
    }

    const created = await pricingRepository.create({
      ...input,
      version: nextVersion,
      effectiveFrom: effectiveFromDate,
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
    });

    // Invalidate Redis cache
    try {
      await redis.del(REDIS_ACTIVE_PRICING_KEY);
    } catch (err) {
      logger.warn({ err }, 'Failed to clear pricing cache in Redis');
    }

    return toPricingConfigDTO(created);
  },

  /**
   * Retrieves a specific historical pricing config version.
   */
  async getByVersion(version: number): Promise<PricingConfig> {
    const doc = await pricingRepository.findByVersion(version);
    if (!doc) {
      throw new NotFoundError(`Pricing configuration version ${version} not found`);
    }
    return toPricingConfigDTO(doc);
  },

  /**
   * Admin: Lists historical versions for audit and inspection.
   */
  async listVersions(limit = 20, cursor?: string): Promise<{ items: PricingConfig[]; nextCursor: string | null }> {
    const docs = await pricingRepository.listVersions(limit + 1, cursor);
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!._id.toString() : null;

    return {
      items: items.map(toPricingConfigDTO),
      nextCursor,
    };
  },
};
