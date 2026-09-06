import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  BillingUnit,
  PricingConfigStatus,
  RoundingRule,
  type PricingConfig,
} from '@astroai/shared-types';
import { pricingService } from '../../../src/modules/pricing/pricing.service';
import { pricingRepository } from '../../../src/modules/pricing/pricing.repository';

vi.mock('../../../src/lib/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

describe('pricingService', () => {
  const mockConfig: PricingConfig = {
    version: 1,
    status: PricingConfigStatus.ACTIVE,
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    freeCreditsOnSignup: 10,
    firstPurchaseDiscountPercent: 20,
    creditPacks: [
      {
        id: 'pack_1',
        name: 'Starter Pack',
        description: 'Starter credits',
        credits: 50,
        bonusCredits: 5,
        priceAmount: 4900,
        currency: 'INR',
        badge: null,
        active: true,
        sortOrder: 1,
      },
      {
        id: 'pack_2',
        name: 'Pro Pack',
        description: 'Pro credits',
        credits: 200,
        bonusCredits: 40,
        priceAmount: 19900,
        currency: 'INR',
        badge: 'Popular',
        active: true,
        sortOrder: 2,
      },
    ],
    chat: {
      creditsPerMessage: 2,
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
        reportType: 'natal_chart',
        title: 'Full Kundli',
        description: 'Birth chart',
        credits: 50,
        discountPercent: 10,
        active: true,
      },
      {
        reportType: 'compatibility',
        title: 'Kundli Milan',
        description: 'Compatibility',
        credits: 40,
        discountPercent: 0,
        active: true,
      },
    ],
    subscriptions: [],
    notes: 'Test config',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(pricingRepository, 'findActive').mockResolvedValue({
      ...mockConfig,
      effectiveFrom: new Date(mockConfig.effectiveFrom),
      effectiveTo: null,
      _id: 'config_123',
    } as any);
  });

  describe('calculateChatCost', () => {
    it('returns configured credits per message', async () => {
      const result = await pricingService.calculateChatCost('user_1');
      expect(result.creditsRequired).toBe(2);
      expect(result.pricingVersion).toBe(1);
    });
  });

  describe('calculateVoiceCost', () => {
    it('returns 0 credits if duration is within free initial seconds', async () => {
      const result = await pricingService.calculateVoiceCost(25);
      expect(result.billableSeconds).toBe(0);
      expect(result.finalCredits).toBe(0);
    });

    it('applies per-minute ceil rounding and minimum charge', async () => {
      // Free initial 30s -> 90s - 30s = 60s billable -> 1 unit = 5 credits
      const result1 = await pricingService.calculateVoiceCost(90);
      expect(result1.billableSeconds).toBe(60);
      expect(result1.billableUnits).toBe(1);
      expect(result1.finalCredits).toBe(5);

      // 95s - 30s = 65s billable -> ceil(65/60) = 2 units = 10 credits
      const result2 = await pricingService.calculateVoiceCost(95);
      expect(result2.billableSeconds).toBe(65);
      expect(result2.billableUnits).toBe(2);
      expect(result2.finalCredits).toBe(10);
    });

    it('enforces minimum charge if gross credits are below minimum', async () => {
      vi.spyOn(pricingRepository, 'findActive').mockResolvedValueOnce({
        ...mockConfig,
        effectiveFrom: new Date(mockConfig.effectiveFrom),
        effectiveTo: null,
        voice: {
          ...mockConfig.voice,
          creditsPerUnit: 2,
          minimumChargeCredits: 10,
        },
        _id: 'config_123',
      } as any);

      // 1 unit = 2 credits, but minimum charge is 10
      const result = await pricingService.calculateVoiceCost(90);
      expect(result.grossCredits).toBe(2);
      expect(result.finalCredits).toBe(10);
    });

    it('supports per-second billing unit', async () => {
      vi.spyOn(pricingRepository, 'findActive').mockResolvedValueOnce({
        ...mockConfig,
        effectiveFrom: new Date(mockConfig.effectiveFrom),
        effectiveTo: null,
        voice: {
          ...mockConfig.voice,
          billingUnit: BillingUnit.SECOND,
          creditsPerUnit: 1,
          minimumChargeCredits: 1,
          freeInitialSeconds: 0,
        },
        _id: 'config_123',
      } as any);

      const result = await pricingService.calculateVoiceCost(45);
      expect(result.billableSeconds).toBe(45);
      expect(result.billableUnits).toBe(45);
      expect(result.finalCredits).toBe(45);
    });

    it('supports rounding rules (floor and nearest)', async () => {
      // Test FLOOR rule
      vi.spyOn(pricingRepository, 'findActive').mockResolvedValueOnce({
        ...mockConfig,
        effectiveFrom: new Date(mockConfig.effectiveFrom),
        effectiveTo: null,
        voice: {
          ...mockConfig.voice,
          roundingRule: RoundingRule.FLOOR,
          freeInitialSeconds: 0,
          minimumChargeCredits: 0,
        },
        _id: 'config_123',
      } as any);

      const resultFloor = await pricingService.calculateVoiceCost(110); // 110s / 60 = 1.83 -> floor = 1 unit = 5
      expect(resultFloor.billableUnits).toBe(1);
      expect(resultFloor.finalCredits).toBe(5);

      // Test NEAREST rule
      vi.spyOn(pricingRepository, 'findActive').mockResolvedValueOnce({
        ...mockConfig,
        effectiveFrom: new Date(mockConfig.effectiveFrom),
        effectiveTo: null,
        voice: {
          ...mockConfig.voice,
          roundingRule: RoundingRule.NEAREST,
          freeInitialSeconds: 0,
          minimumChargeCredits: 0,
        },
        _id: 'config_123',
      } as any);

      const resultNearest = await pricingService.calculateVoiceCost(80); // 80s / 60 = 1.33 -> round = 1 unit = 5
      expect(resultNearest.billableUnits).toBe(1);
      expect(resultNearest.finalCredits).toBe(5);

      vi.spyOn(pricingRepository, 'findActive').mockResolvedValueOnce({
        ...mockConfig,
        effectiveFrom: new Date(mockConfig.effectiveFrom),
        effectiveTo: null,
        voice: {
          ...mockConfig.voice,
          roundingRule: RoundingRule.NEAREST,
          freeInitialSeconds: 0,
          minimumChargeCredits: 0,
        },
        _id: 'config_123',
      } as any);

      const resultNearestUp = await pricingService.calculateVoiceCost(100); // 100s / 60 = 1.66 -> round = 2 units = 10
      expect(resultNearestUp.billableUnits).toBe(2);
      expect(resultNearestUp.finalCredits).toBe(10);
    });
  });

  describe('calculateReportCost', () => {
    it('applies catalog discount percent correctly', async () => {
      // natal_chart: 50 credits - 10% (5 credits) = 45 credits
      const result = await pricingService.calculateReportCost('natal_chart', false);
      expect(result.baseCredits).toBe(50);
      expect(result.discountPercent).toBe(10);
      expect(result.finalCredits).toBe(45);
    });

    it('applies first purchase discount if higher than catalog discount', async () => {
      // first purchase discount is 20%, catalog is 10% -> 50 - 20% (10 credits) = 40 credits
      const result = await pricingService.calculateReportCost('natal_chart', true);
      expect(result.discountPercent).toBe(20);
      expect(result.finalCredits).toBe(40);
    });

    it('throws NotFoundError for unknown report type', async () => {
      await expect(pricingService.calculateReportCost('unknown_report')).rejects.toThrow(
        /not found/i,
      );
    });
  });

  describe('getCreditPacks', () => {
    it('returns only active packs sorted by sortOrder', async () => {
      const packs = await pricingService.getCreditPacks();
      expect(packs.length).toBe(2);
      expect(packs[0]!.id).toBe('pack_1');
      expect(packs[1]!.id).toBe('pack_2');
    });
  });

  describe('getPricingExplanation', () => {
    it('returns structured human-readable pricing details', async () => {
      const explanation = await pricingService.getPricingExplanation();
      expect(explanation.freeCreditsOnSignup).toBe(10);
      expect(explanation.chat.creditsPerMessage).toBe(2);
      expect(explanation.voice.creditsPerUnit).toBe(5);
      expect(explanation.reports.length).toBe(2);
      expect(explanation.reports[0]!.effectiveCredits).toBe(45);
      expect(explanation.creditPacks.length).toBe(2);
    });
  });

  describe('createConfigVersion', () => {
    it('increments version and archives prior active version', async () => {
      vi.spyOn(pricingRepository, 'findLatestVersion').mockResolvedValue(1);
      const archiveSpy = vi.spyOn(pricingRepository, 'archivePriorActive').mockResolvedValue(undefined);
      vi.spyOn(pricingRepository, 'create').mockImplementation(async (data: any) => ({
        ...data,
        _id: 'config_new_456',
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: null,
      }));

      const newConfig = await pricingService.createConfigVersion('admin_1', {
        ...mockConfig,
        notes: 'Updated chat price',
        chat: { ...mockConfig.chat, creditsPerMessage: 3 },
      });

      expect(newConfig.version).toBe(2);
      expect(newConfig.chat.creditsPerMessage).toBe(3);
      expect(archiveSpy).toHaveBeenCalledWith(2, expect.any(Date));
    });
  });
});
