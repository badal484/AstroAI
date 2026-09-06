import { beforeEach, describe, expect, it } from 'vitest';
import { BillingUnit, RoundingRule } from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { pricingRepository } from '../../../src/modules/pricing/pricing.repository';
import { pricingService } from '../../../src/modules/pricing/pricing.service';

describe('Voice Billing Calculation Unit Tests', () => {
  beforeEach(async () => {
    await redis.flushall();
  });

  it('calculates zero cost when duration is within free initial seconds', async () => {
    // Default active config has freeInitialSeconds = 30
    const cost = await pricingService.calculateVoiceCost(20);

    expect(cost.billableSeconds).toBe(0);
    expect(cost.billableUnits).toBe(0);
    expect(cost.finalCredits).toBe(0);
  });

  it('calculates cost per minute with CEIL rounding rule', async () => {
    // 30s free, call lasts 95s -> 65s billable -> 2 minutes with CEIL
    const cost = await pricingService.calculateVoiceCost(95);

    expect(cost.billableSeconds).toBe(65);
    expect(cost.billableUnits).toBe(2);
    expect(cost.finalCredits).toBe(2 * cost.creditsPerUnit);
  });

  it('enforces minimum charge credits when billable gross credits are below minimum', async () => {
    // Set custom config with minimumChargeCredits = 10, creditsPerUnit = 2
    const current = await pricingRepository.findActive();
    await pricingRepository.create({
      version: current.version + 1,
      chat: current.chat,
      voice: {
        creditsPerUnit: 2,
        billingUnit: BillingUnit.MINUTE,
        roundingRule: RoundingRule.CEIL,
        freeInitialSeconds: 0,
        minimumChargeCredits: 10,
        maximumSessionDurationSeconds: 1800,
      },
      reports: current.reports,
      effectiveFrom: new Date(),
      effectiveTo: null,
      adminId: 'admin_test',
    });
    await redis.flushall();

    // 1 minute call = 2 credits gross, but minimum charge is 10
    const cost = await pricingService.calculateVoiceCost(60);

    expect(cost.billableUnits).toBe(1);
    expect(cost.grossCredits).toBe(2);
    expect(cost.finalCredits).toBe(10);
  });

  it('supports per 30 seconds billing unit', async () => {
    const current = await pricingRepository.findActive();
    await pricingRepository.create({
      version: current.version + 1,
      chat: current.chat,
      voice: {
        creditsPerUnit: 3,
        billingUnit: BillingUnit.THIRTY_SECONDS,
        roundingRule: RoundingRule.CEIL,
        freeInitialSeconds: 10,
        minimumChargeCredits: 0,
        maximumSessionDurationSeconds: 1800,
      },
      reports: current.reports,
      effectiveFrom: new Date(),
      effectiveTo: null,
      adminId: 'admin_test',
    });
    await redis.flushall();

    // 70s call - 10s free = 60s billable -> 2 units of 30s -> 6 credits
    const cost = await pricingService.calculateVoiceCost(70);

    expect(cost.billableSeconds).toBe(60);
    expect(cost.billableUnits).toBe(2);
    expect(cost.finalCredits).toBe(6);
  });

  it('supports per second billing unit', async () => {
    const current = await pricingRepository.findActive();
    await pricingRepository.create({
      version: current.version + 1,
      chat: current.chat,
      voice: {
        creditsPerUnit: 1,
        billingUnit: BillingUnit.SECOND,
        roundingRule: RoundingRule.CEIL,
        freeInitialSeconds: 0,
        minimumChargeCredits: 5,
        maximumSessionDurationSeconds: 1800,
      },
      reports: current.reports,
      effectiveFrom: new Date(),
      effectiveTo: null,
      adminId: 'admin_test',
    });
    await redis.flushall();

    // 8s call -> 8 billable units -> 8 credits
    const cost = await pricingService.calculateVoiceCost(8);

    expect(cost.billableSeconds).toBe(8);
    expect(cost.billableUnits).toBe(8);
    expect(cost.finalCredits).toBe(8);
  });
});
