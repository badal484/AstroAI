import {
  CreatePromotionInput,
  PromotionAnalyticsDTO,
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionDTO,
  PromotionStatus,
  PromotionValidationResultDTO,
  UpdatePromotionInput,
  ValidatePromoCodeInput,
} from '@astroai/shared-types';
import { ClientSession } from 'mongoose';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { paymentRepository } from '../payments/payment.repository';
import { DEFAULT_PROMOTIONS } from './defaultPromotions';
import { promotionRepository } from './repositories/promotion.repository';
import { redemptionRepository } from './repositories/redemption.repository';

export class PromotionsService {
  async seedDefaults(): Promise<void> {
    for (const def of DEFAULT_PROMOTIONS) {
      const existing = await promotionRepository.findByCode(def.code);
      if (!existing) {
        await promotionRepository.create(def);
      }
    }
  }

  async createPromotion(input: CreatePromotionInput): Promise<PromotionDTO> {
    // Prohibit manipulative / fear-based copy in promo names & descriptions
    this.assertEthicalCopy(input.name, input.description);

    const existing = await promotionRepository.findByCode(input.code);
    if (existing) {
      throw new ConflictError(`Promotion code "${input.code}" already exists`);
    }

    return promotionRepository.create(input);
  }

  async updatePromotion(id: string, input: UpdatePromotionInput): Promise<PromotionDTO> {
    const promo = await promotionRepository.findById(id);
    if (!promo) {
      throw new NotFoundError(`Promotion with ID "${id}" not found`);
    }

    if (input.name || input.description) {
      this.assertEthicalCopy(input.name || promo.name, input.description || promo.description);
    }

    if (input.code && input.code !== promo.code) {
      const existing = await promotionRepository.findByCode(input.code);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Promotion code "${input.code}" already exists`);
      }
    }

    const updated = await promotionRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Promotion with ID "${id}" not found`);
    }
    return updated;
  }

  async getPromotionById(id: string): Promise<PromotionDTO> {
    const promo = await promotionRepository.findById(id);
    if (!promo) {
      throw new NotFoundError(`Promotion with ID "${id}" not found`);
    }
    return promo;
  }

  async listPromotions(filters: {
    status?: PromotionStatus;
    isActive?: boolean;
    audienceSegment?: PromotionAudienceSegment;
    limit?: number;
  }): Promise<{ items: PromotionDTO[]; total: number }> {
    return promotionRepository.list(filters);
  }

  async setPromotionStatus(id: string, status: PromotionStatus): Promise<PromotionDTO> {
    const updated = await promotionRepository.update(id, {
      status,
      isActive: status === PromotionStatus.ACTIVE,
    } as any);
    if (!updated) {
      throw new NotFoundError(`Promotion with ID "${id}" not found`);
    }
    return updated;
  }

  /**
   * Evaluates promo code validity and calculates applicable discount/bonus.
   */
  async validatePromoCode(
    userId: string,
    input: ValidatePromoCodeInput,
  ): Promise<PromotionValidationResultDTO> {
    const code = input.code.toUpperCase();
    const promo = await promotionRepository.findByCode(code);

    if (!promo || !promo.isActive || promo.status !== PromotionStatus.ACTIVE) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: 'Invalid or inactive promotional code',
      };
    }

    // 1. Date window validation
    const now = new Date();
    if (promo.rules.startDate && new Date(promo.rules.startDate) > now) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: 'This promotion has not started yet',
      };
    }
    if (promo.rules.endDate && new Date(promo.rules.endDate) < now) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: 'This promotion has expired',
      };
    }

    // 2. Target compatibility
    if (
      promo.target !== 'all' &&
      input.targetType !== 'all' &&
      promo.target !== input.targetType
    ) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: `This promo code is only applicable for ${promo.target.replace('_', ' ')}s`,
      };
    }

    // 3. Minimum purchase amount
    if (promo.rules.minPurchaseAmount > 0 && input.amount < promo.rules.minPurchaseAmount) {
      const minCurrency = (promo.rules.minPurchaseAmount / 100).toFixed(0);
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: `Minimum order amount of ₹${minCurrency} required for this coupon`,
      };
    }

    // 4. Global total usage limit
    if (promo.rules.totalUsageLimit !== null && promo.rules.totalUsageLimit !== undefined) {
      const totalRedemptions = await redemptionRepository.countTotalRedemptions(promo.id);
      if (totalRedemptions >= promo.rules.totalUsageLimit) {
        return {
          valid: false,
          code,
          discountAmount: 0,
          bonusCredits: 0,
          originalAmount: input.amount,
          finalAmount: input.amount,
          message: 'This promotion has reached its maximum total usage limit',
        };
      }
    }

    // 5. Per-user usage limit
    const userRedemptions = await redemptionRepository.countUserRedemptions(promo.id, userId);
    if (userRedemptions >= promo.rules.perUserLimit) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: `You have already redeemed this promo code the maximum allowed number of times (${promo.rules.perUserLimit})`,
      };
    }

    // 6. Audience segment & New/Existing user constraints
    const userPaidOrdersCount = await paymentRepository.countPaidOrdersByUser(userId);
    const isNewUser = userPaidOrdersCount === 0;

    if (promo.rules.newUserOnly && !isNewUser) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: 'This offer is exclusively for new seekers making their first purchase',
      };
    }

    if (promo.rules.existingUserOnly && isNewUser) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: input.amount,
        finalAmount: input.amount,
        message: 'This offer is reserved for existing members',
      };
    }

    // 7. Calculate discount & bonus credits
    let discountAmount = 0;
    let bonusCredits = 0;

    if (promo.discountType === PromotionDiscountType.PERCENTAGE) {
      const rawDiscount = Math.round((input.amount * promo.discountValue) / 100);
      discountAmount =
        promo.rules.maxDiscountAmount && rawDiscount > promo.rules.maxDiscountAmount
          ? promo.rules.maxDiscountAmount
          : rawDiscount;
    } else if (promo.discountType === PromotionDiscountType.FIXED_AMOUNT) {
      discountAmount = Math.min(input.amount, promo.discountValue);
    } else if (promo.discountType === PromotionDiscountType.CREDIT_BONUS) {
      bonusCredits = promo.discountValue;
    }

    const finalAmount = Math.max(0, input.amount - discountAmount);

    return {
      valid: true,
      code: promo.code,
      promotionId: promo.id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      bonusCredits,
      originalAmount: input.amount,
      finalAmount,
      message:
        discountAmount > 0
          ? `Promo applied! You saved ₹${(discountAmount / 100).toFixed(0)}`
          : bonusCredits > 0
            ? `Promo applied! You will receive ${bonusCredits} bonus credits`
            : 'Promo code applied successfully',
    };
  }

  /**
   * Applies and records promo redemption inside an existing MongoDB transaction session.
   */
  async applyPromoCodeInTransaction(
    userId: string,
    validationResult: PromotionValidationResultDTO,
    orderId: string,
    session?: ClientSession,
  ): Promise<void> {
    if (!validationResult.valid || !validationResult.promotionId) return;

    await redemptionRepository.record(
      {
        promotionId: validationResult.promotionId,
        code: validationResult.code,
        userId,
        orderId,
        discountApplied: validationResult.discountAmount,
        bonusCreditsGranted: validationResult.bonusCredits,
        originalAmount: validationResult.originalAmount,
        finalAmount: validationResult.finalAmount,
      },
      session,
    );

    await promotionRepository.incrementStats(
      validationResult.promotionId,
      {
        redemptions: 1,
        revenueGenerated: validationResult.finalAmount,
        discountCost: validationResult.discountAmount,
      },
      session,
    );
  }

  /**
   * Returns list of active personalized promotional offers for the user.
   */
  async getAvailableOffers(userId: string): Promise<PromotionDTO[]> {
    const paidOrders = await paymentRepository.countPaidOrdersByUser(userId);
    const isNewUser = paidOrders === 0;

    const applicableSegments: PromotionAudienceSegment[] = [
      PromotionAudienceSegment.ALL_USERS,
      isNewUser
        ? PromotionAudienceSegment.NEW_USERS_ONLY
        : PromotionAudienceSegment.EXISTING_USERS_ONLY,
    ];

    const offers = await promotionRepository.listActiveOffers(applicableSegments);

    // Increment impressions for retrieved active offers
    for (const offer of offers) {
      promotionRepository.incrementStats(offer.id, { impressions: 1 }).catch(() => {});
    }

    return offers;
  }

  /**
   * Computes platform-wide marketing KPIs and ROI.
   */
  async getAnalytics(): Promise<PromotionAnalyticsDTO> {
    const { items: allPromos, total } = await promotionRepository.list({ limit: 500 });
    const activePromos = allPromos.filter((p) => p.isActive && p.status === PromotionStatus.ACTIVE);

    let totalRedemptions = 0;
    let totalGrossRevenue = 0;
    let totalDiscountCost = 0;
    let totalImpressions = 0;

    const topPromotions = allPromos.map((p) => {
      totalRedemptions += p.stats.redemptions;
      totalGrossRevenue += p.stats.revenueGenerated;
      totalDiscountCost += p.stats.discountCost;
      totalImpressions += p.stats.impressions;

      const promoNet = p.stats.revenueGenerated - p.stats.discountCost;
      const promoRoi =
        p.stats.discountCost > 0
          ? Math.round((promoNet / p.stats.discountCost) * 100) / 100
          : p.stats.revenueGenerated > 0
            ? 1
            : 0;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        redemptions: p.stats.redemptions,
        revenueGenerated: p.stats.revenueGenerated,
        discountCost: p.stats.discountCost,
        roi: promoRoi,
      };
    });

    topPromotions.sort((a, b) => b.revenueGenerated - a.revenueGenerated);

    const netRevenue = totalGrossRevenue - totalDiscountCost;
    const overallROI =
      totalDiscountCost > 0
        ? Math.round((netRevenue / totalDiscountCost) * 100) / 100
        : totalGrossRevenue > 0
          ? 1
          : 0;
    const conversionRate =
      totalImpressions > 0
        ? Math.round((totalRedemptions / totalImpressions) * 10000) / 100
        : 0;

    return {
      totalPromotions: total,
      activePromotions: activePromos.length,
      totalRedemptions,
      totalGrossRevenue,
      totalDiscountCost,
      netRevenue,
      overallROI,
      conversionRate,
      topPromotions: topPromotions.slice(0, 10),
    };
  }

  /**
   * Enforces ethical astrological marketing invariants ("Do not build manipulative fear-based astrology marketing").
   */
  private assertEthicalCopy(name: string, description: string): void {
    const fearKeywords = [
      'curse',
      'evil eye',
      'black magic',
      'kaal sarp danger',
      'imminent doom',
      'grave disaster',
      'punishment from planets',
      'buy now or suffer',
      'terrible omen',
    ];

    const content = `${name} ${description}`.toLowerCase();
    for (const keyword of fearKeywords) {
      if (content.includes(keyword)) {
        throw new ValidationError(
          `Manipulative or fear-based astrology marketing language ("${keyword}") is strictly prohibited.`,
        );
      }
    }
  }
}

export const promotionsService = new PromotionsService();
