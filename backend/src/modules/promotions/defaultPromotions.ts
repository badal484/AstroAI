import {
  CreatePromotionInput,
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionTarget,
  PromotionType,
} from '@astroai/shared-types';

export const DEFAULT_PROMOTIONS: CreatePromotionInput[] = [
  {
    code: 'WELCOME100',
    name: 'New Seeker Welcome Bonus',
    description: 'Get 50 bonus wallet credits to begin your astrological journey of cosmic guidance.',
    type: PromotionType.WELCOME_OFFER,
    discountType: PromotionDiscountType.CREDIT_BONUS,
    discountValue: 50,
    target: PromotionTarget.ALL,
    targetIds: [],
    audienceSegment: PromotionAudienceSegment.NEW_USERS_ONLY,
    rules: {
      minPurchaseAmount: 0,
      maxDiscountAmount: null,
      totalUsageLimit: 10000,
      perUserLimit: 1,
      newUserOnly: true,
      existingUserOnly: false,
    },
    isActive: true,
  },
  {
    code: 'FIRST50',
    name: 'First Recharge Extra Credits',
    description: 'Enjoy 50% extra credits on your very first wallet top-up pack.',
    type: PromotionType.FIRST_PURCHASE_OFFER,
    discountType: PromotionDiscountType.PERCENTAGE,
    discountValue: 50,
    target: PromotionTarget.CREDIT_PACK,
    targetIds: [],
    audienceSegment: PromotionAudienceSegment.NEW_USERS_ONLY,
    rules: {
      minPurchaseAmount: 10000, // ₹100 min
      maxDiscountAmount: 50000, // ₹500 max cap
      totalUsageLimit: 5000,
      perUserLimit: 1,
      newUserOnly: true,
      existingUserOnly: false,
    },
    isActive: true,
  },
  {
    code: 'COSMIC20',
    name: 'Planetary Harmony Discount',
    description: 'Receive 20% discount on in-depth Vedic Kundli & Compatibility reports.',
    type: PromotionType.PROMO_CODE,
    discountType: PromotionDiscountType.PERCENTAGE,
    discountValue: 20,
    target: PromotionTarget.REPORT,
    targetIds: [],
    audienceSegment: PromotionAudienceSegment.ALL_USERS,
    rules: {
      minPurchaseAmount: 0,
      maxDiscountAmount: 10000, // ₹100 max cap
      totalUsageLimit: 10000,
      perUserLimit: 3,
      newUserOnly: false,
      existingUserOnly: false,
    },
    isActive: true,
  },
  {
    code: 'VEDIC25',
    name: 'Vedic Consultation Privilege',
    description: 'Save ₹50 on all premium consultation packs.',
    type: PromotionType.COUPON,
    discountType: PromotionDiscountType.FIXED_AMOUNT,
    discountValue: 5000, // ₹50 in paise
    target: PromotionTarget.CREDIT_PACK,
    targetIds: [],
    audienceSegment: PromotionAudienceSegment.EXISTING_USERS_ONLY,
    rules: {
      minPurchaseAmount: 19900, // ₹199 min
      maxDiscountAmount: 5000,
      totalUsageLimit: 2000,
      perUserLimit: 2,
      newUserOnly: false,
      existingUserOnly: true,
    },
    isActive: true,
  },
];
