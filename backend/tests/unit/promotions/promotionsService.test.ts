import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionStatus,
  PromotionTarget,
  PromotionType,
} from '@astroai/shared-types';
import { promotionsService } from '../../../src/modules/promotions/promotions.service';
import { promotionRepository } from '../../../src/modules/promotions/repositories/promotion.repository';
import { redemptionRepository } from '../../../src/modules/promotions/repositories/redemption.repository';
import { paymentRepository } from '../../../src/modules/payments/payment.repository';

vi.mock('../../../src/modules/promotions/repositories/promotion.repository', () => ({
  promotionRepository: {
    findByCode: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
    listActiveOffers: vi.fn(),
    incrementStats: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('../../../src/modules/promotions/repositories/redemption.repository', () => ({
  redemptionRepository: {
    record: vi.fn(),
    countUserRedemptions: vi.fn(),
    countTotalRedemptions: vi.fn(),
    findByOrder: vi.fn(),
    listByUser: vi.fn(),
  },
}));

vi.mock('../../../src/modules/payments/payment.repository', () => ({
  paymentRepository: {
    countPaidOrdersByUser: vi.fn(),
  },
}));

const mockFindPromoByCode = vi.mocked(promotionRepository.findByCode);
const mockCountUserRedemptions = vi.mocked(redemptionRepository.countUserRedemptions);
const mockCountTotalRedemptions = vi.mocked(redemptionRepository.countTotalRedemptions);
const mockCountPaidOrdersByUser = vi.mocked(paymentRepository.countPaidOrdersByUser);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PromotionsService Unit Tests', () => {
  describe('validatePromoCode', () => {
    it('applies percentage discount capped at maxDiscountAmount', async () => {
      mockFindPromoByCode.mockResolvedValue({
        id: 'promo_1',
        code: 'SAVE30',
        name: 'Save 30%',
        description: 'Get 30% off up to ₹100',
        type: PromotionType.PROMO_CODE,
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 30,
        target: PromotionTarget.ALL,
        targetIds: [],
        audienceSegment: PromotionAudienceSegment.ALL_USERS,
        rules: {
          minPurchaseAmount: 10000, // ₹100
          maxDiscountAmount: 10000, // ₹100 max cap
          totalUsageLimit: 100,
          perUserLimit: 2,
          newUserOnly: false,
          existingUserOnly: false,
        },
        stats: { impressions: 10, redemptions: 2, revenueGenerated: 50000, discountCost: 15000 },
        status: PromotionStatus.ACTIVE,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      mockCountTotalRedemptions.mockResolvedValue(5);
      mockCountUserRedemptions.mockResolvedValue(0);
      mockCountPaidOrdersByUser.mockResolvedValue(1);

      // Order of ₹500 (50000 paise): 30% is ₹150 (15000 paise), but capped at ₹100 (10000 paise)
      const res = await promotionsService.validatePromoCode('user_1', {
        code: 'SAVE30',
        amount: 50000,
        targetType: PromotionTarget.CREDIT_PACK,
      });

      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(10000); // capped at 10000
      expect(res.finalAmount).toBe(40000);
    });

    it('rejects promo code if order does not meet minimum purchase amount', async () => {
      mockFindPromoByCode.mockResolvedValue({
        id: 'promo_min',
        code: 'MIN200',
        name: 'Min 200 Order',
        description: 'Requires ₹200 min purchase',
        type: PromotionType.COUPON,
        discountType: PromotionDiscountType.FIXED_AMOUNT,
        discountValue: 5000,
        target: PromotionTarget.ALL,
        targetIds: [],
        audienceSegment: PromotionAudienceSegment.ALL_USERS,
        rules: {
          minPurchaseAmount: 20000, // ₹200
          maxDiscountAmount: null,
          totalUsageLimit: 500,
          perUserLimit: 1,
          newUserOnly: false,
          existingUserOnly: false,
        },
        stats: { impressions: 0, redemptions: 0, revenueGenerated: 0, discountCost: 0 },
        status: PromotionStatus.ACTIVE,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      mockCountTotalRedemptions.mockResolvedValue(0);
      mockCountUserRedemptions.mockResolvedValue(0);
      mockCountPaidOrdersByUser.mockResolvedValue(0);

      const res = await promotionsService.validatePromoCode('user_1', {
        code: 'MIN200',
        amount: 10000, // ₹100 is less than ₹200
        targetType: PromotionTarget.ALL,
      });

      expect(res.valid).toBe(false);
      expect(res.message).toContain('Minimum order amount');
    });

    it('rejects promo code if user has exceeded per-user redemption limit', async () => {
      mockFindPromoByCode.mockResolvedValue({
        id: 'promo_limit',
        code: 'ONCEONLY',
        name: 'Once Only',
        description: 'Single use per seeker',
        type: PromotionType.COUPON,
        discountType: PromotionDiscountType.CREDIT_BONUS,
        discountValue: 20,
        target: PromotionTarget.ALL,
        targetIds: [],
        audienceSegment: PromotionAudienceSegment.ALL_USERS,
        rules: {
          minPurchaseAmount: 0,
          maxDiscountAmount: null,
          totalUsageLimit: 1000,
          perUserLimit: 1,
          newUserOnly: false,
          existingUserOnly: false,
        },
        stats: { impressions: 0, redemptions: 0, revenueGenerated: 0, discountCost: 0 },
        status: PromotionStatus.ACTIVE,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      mockCountTotalRedemptions.mockResolvedValue(10);
      mockCountUserRedemptions.mockResolvedValue(1); // User already used 1 time
      mockCountPaidOrdersByUser.mockResolvedValue(1);

      const res = await promotionsService.validatePromoCode('user_1', {
        code: 'ONCEONLY',
        amount: 10000,
        targetType: PromotionTarget.ALL,
      });

      expect(res.valid).toBe(false);
      expect(res.message).toContain('maximum allowed number of times');
    });

    it('rejects new-user promo code if user is an existing paying customer', async () => {
      mockFindPromoByCode.mockResolvedValue({
        id: 'promo_new',
        code: 'NEWSEEKER',
        name: 'New Seeker Only',
        description: 'First order only',
        type: PromotionType.WELCOME_OFFER,
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 50,
        target: PromotionTarget.ALL,
        targetIds: [],
        audienceSegment: PromotionAudienceSegment.NEW_USERS_ONLY,
        rules: {
          minPurchaseAmount: 0,
          maxDiscountAmount: null,
          totalUsageLimit: 500,
          perUserLimit: 1,
          newUserOnly: true,
          existingUserOnly: false,
        },
        stats: { impressions: 0, redemptions: 0, revenueGenerated: 0, discountCost: 0 },
        status: PromotionStatus.ACTIVE,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      mockCountTotalRedemptions.mockResolvedValue(0);
      mockCountUserRedemptions.mockResolvedValue(0);
      mockCountPaidOrdersByUser.mockResolvedValue(3); // Existing paying customer!

      const res = await promotionsService.validatePromoCode('user_1', {
        code: 'NEWSEEKER',
        amount: 10000,
        targetType: PromotionTarget.ALL,
      });

      expect(res.valid).toBe(false);
      expect(res.message).toContain('exclusively for new seekers');
    });
  });

  describe('assertEthicalCopy', () => {
    it('throws BadRequestError when fear-based or manipulative copy is used', async () => {
      await expect(
        promotionsService.createPromotion({
          code: 'CURSEOFF',
          name: 'Remove Evil Eye and Curse',
          description: 'Get rid of imminent doom now',
          type: PromotionType.PROMO_CODE,
          discountType: PromotionDiscountType.PERCENTAGE,
          discountValue: 10,
          target: PromotionTarget.ALL,
          targetIds: [],
          audienceSegment: PromotionAudienceSegment.ALL_USERS,
          rules: {
            minPurchaseAmount: 0,
            maxDiscountAmount: null,
            totalUsageLimit: null,
            perUserLimit: 1,
            newUserOnly: false,
            existingUserOnly: false,
          },
          isActive: true,
        }),
      ).rejects.toThrow(/Manipulative or fear-based astrology marketing/);
    });
  });
});
