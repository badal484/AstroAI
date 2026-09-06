import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionStatus,
  PromotionTarget,
  PromotionType,
  ReferralStatus,
} from '@astroai/shared-types';
import AdminPromotionsPage from '../src/app/(dashboard)/promotions/page';
import { adminPromotionsApi } from '../src/lib/adminPromotionsApi';

vi.mock('../src/lib/adminPromotionsApi', () => ({
  adminPromotionsApi: {
    listPromotions: vi.fn(),
    createPromotion: vi.fn(),
    getPromotion: vi.fn(),
    updatePromotion: vi.fn(),
    updateStatus: vi.fn(),
    getAnalytics: vi.fn(),
    listReferrals: vi.fn(),
  },
}));

const mockListPromotions = vi.mocked(adminPromotionsApi.listPromotions);
const mockCreatePromotion = vi.mocked(adminPromotionsApi.createPromotion);
const mockGetAnalytics = vi.mocked(adminPromotionsApi.getAnalytics);
const mockListReferrals = vi.mocked(adminPromotionsApi.listReferrals);

beforeEach(() => {
  vi.clearAllMocks();

  mockListPromotions.mockResolvedValue({
    items: [
      {
        id: 'promo_1',
        code: 'WELCOME100',
        name: 'New Seeker Welcome Bonus',
        description: 'Get 50 bonus wallet credits to begin your astrological journey.',
        type: PromotionType.WELCOME_OFFER,
        discountType: PromotionDiscountType.CREDIT_BONUS,
        discountValue: 50,
        target: PromotionTarget.ALL,
        targetIds: [],
        audienceSegment: PromotionAudienceSegment.NEW_USERS_ONLY,
        rules: {
          minPurchaseAmount: 0,
          maxDiscountAmount: null,
          totalUsageLimit: 1000,
          perUserLimit: 1,
          newUserOnly: true,
          existingUserOnly: false,
        },
        stats: { impressions: 120, redemptions: 45, revenueGenerated: 89500, discountCost: 22500 },
        status: PromotionStatus.ACTIVE,
        isActive: true,
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      },
    ],
    total: 1,
  });

  mockGetAnalytics.mockResolvedValue({
    totalPromotions: 4,
    activePromotions: 3,
    totalRedemptions: 125,
    totalGrossRevenue: 4500000, // ₹45,000
    totalDiscountCost: 900000, // ₹9,000
    netRevenue: 3600000,
    overallROI: 4.0,
    conversionRate: 18.5,
    topPromotions: [
      {
        id: 'promo_1',
        code: 'WELCOME100',
        name: 'New Seeker Welcome Bonus',
        redemptions: 45,
        revenueGenerated: 89500,
        discountCost: 22500,
        roi: 3.98,
      },
    ],
  });

  mockListReferrals.mockResolvedValue([
    {
      id: 'ref_1',
      referrerId: 'usr_guru_1',
      referrerCode: 'ASTROGURU',
      refereeId: 'usr_seeker_2',
      status: ReferralStatus.REWARDED,
      referrerRewardCredits: 25,
      refereeRewardCredits: 25,
      abuseSignals: [],
      rewardedAt: '2026-09-02T12:00:00Z',
      createdAt: '2026-09-02T11:30:00Z',
      updatedAt: '2026-09-02T12:00:00Z',
    },
  ]);
});

describe('Admin Promotions Page Tests', () => {
  it('renders marketing KPIs and promo codes list', async () => {
    render(<AdminPromotionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Marketing & Promotions/i)).toBeInTheDocument();
      expect(screen.getByText('WELCOME100')).toBeInTheDocument();
      expect(screen.getByText('New Seeker Welcome Bonus')).toBeInTheDocument();
      expect(screen.getByText(/4x/i)).toBeInTheDocument();
      expect(screen.getByText(/18.5%/i)).toBeInTheDocument();
    });
  });

  it('opens create modal and submits new promo code', async () => {
    mockCreatePromotion.mockResolvedValue({
      id: 'promo_new',
      code: 'FESTIVE30',
      name: 'Festive 30% Off',
      description: 'Festive celebration discount',
      type: PromotionType.PROMO_CODE,
      discountType: PromotionDiscountType.PERCENTAGE,
      discountValue: 30,
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
      stats: { impressions: 0, redemptions: 0, revenueGenerated: 0, discountCost: 0 },
      status: PromotionStatus.ACTIVE,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<AdminPromotionsPage />);

    await waitFor(() => {
      expect(screen.getByText('+ Create Promo Code')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Create Promo Code'));
    expect(screen.getByText('Create New Promotional Offer')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. FESTIVAL25'), {
      target: { value: 'FESTIVE30' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Diwali Cosmic Blessings'), {
      target: { value: 'Festive 30% Off' },
    });

    fireEvent.click(screen.getByText('Save Promotion'));

    await waitFor(() => {
      expect(mockCreatePromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FESTIVE30',
          name: 'Festive 30% Off',
        }),
      );
    });
  });

  it('switches to Referral Program tab and renders referral attribution table', async () => {
    render(<AdminPromotionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Referral Program/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Referral Program/));

    await waitFor(() => {
      expect(screen.getByText('ASTROGURU')).toBeInTheDocument();
      expect(screen.getAllByText(/25 credits/i).length).toBeGreaterThan(0);
      expect(screen.getByText('REWARDED')).toBeInTheDocument();
    });
  });

  it('switches to Analytics tab and displays top performing campaigns and ROI', async () => {
    render(<AdminPromotionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Campaign ROI & Analytics/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Campaign ROI & Analytics/));

    await waitFor(() => {
      expect(screen.getByText(/Top Performing Promotions & ROI/i)).toBeInTheDocument();
      expect(screen.getByText(/3.98/i)).toBeInTheDocument();
    });
  });
});
