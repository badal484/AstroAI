import type { AstrologyChart, CompatibilityScore, Transit } from '@astroai/shared-types';
import { redis } from '../../lib/redis';
import { eventBus } from '../../shared/eventBus';
import { logger } from '../../shared/logger';
import { birthProfileService } from '../birthProfiles';
import { astrologyRepository } from './astrology.repository';
import { applyPrecisionPolicy, toAstrologyChart, toEngineInput } from './astrology.types';
import { CURRENT_CALCULATION_VERSION, currentEngine } from './engine/registry';

// Transits are a snapshot for a given calendar date — safe to cache for
// part of a day without risking staleness (CLAUDE.md §41's "cache
// deterministic calculations appropriately").
const TRANSIT_CACHE_TTL_SECONDS = 60 * 60 * 12;

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const astrologyService = {
  /**
   * Natal chart for a birth profile. Static for a fixed birth input, so
   * it's persisted (ARCHITECTURE.md §6) and only recomputed when missing
   * or stamped with an older `calculationVersion` than the current engine.
   */
  async getChart(userId: string, birthProfileId: string): Promise<AstrologyChart> {
    const existing = await astrologyRepository.findChart(birthProfileId);
    if (existing && existing.calculationVersion === CURRENT_CALCULATION_VERSION) {
      return toAstrologyChart(existing);
    }

    const profile = await birthProfileService.getById(userId, birthProfileId);
    const engine = currentEngine();
    const computed = await engine.computeChart(toEngineInput(profile));
    const facts = applyPrecisionPolicy(computed, profile.timeConfidence);

    const doc = await astrologyRepository.upsertChart(birthProfileId, {
      calculationVersion: CURRENT_CALCULATION_VERSION,
      engineProviderId: engine.providerId,
      facts,
    });
    return toAstrologyChart(doc);
  },

  /** Transits move day to day, so unlike the natal chart these are cached
   * (Redis, short TTL) rather than permanently persisted to Mongo. */
  async getTransits(userId: string, birthProfileId: string, date?: string): Promise<Transit[]> {
    const atDate = date ?? todayISODate();
    const cacheKey = `astrology:transits:${birthProfileId}:${atDate}:v${CURRENT_CALCULATION_VERSION}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Transit[];

    const profile = await birthProfileService.getById(userId, birthProfileId);
    const engine = currentEngine();
    const transits = await engine.computeTransits(toEngineInput(profile), atDate);

    await redis.set(cacheKey, JSON.stringify(transits), 'EX', TRANSIT_CACHE_TTL_SECONDS);
    return transits;
  },

  async getCompatibility(
    userId: string,
    birthProfileIdA: string,
    birthProfileIdB: string,
  ): Promise<CompatibilityScore> {
    const existing = await astrologyRepository.findCompatibility(birthProfileIdA, birthProfileIdB);
    if (existing && existing.calculationVersion === CURRENT_CALCULATION_VERSION) {
      return existing.score;
    }

    const [profileA, profileB] = await Promise.all([
      birthProfileService.getById(userId, birthProfileIdA),
      birthProfileService.getById(userId, birthProfileIdB),
    ]);
    const engine = currentEngine();
    const score = await engine.computeCompatibility(
      toEngineInput(profileA),
      toEngineInput(profileB),
    );

    const doc = await astrologyRepository.upsertCompatibility(birthProfileIdA, birthProfileIdB, {
      calculationVersion: CURRENT_CALCULATION_VERSION,
      engineProviderId: engine.providerId,
      score,
    });
    return doc.score;
  },

  async invalidateForBirthProfile(birthProfileId: string): Promise<void> {
    await astrologyRepository.deleteChartsAndCompatibilityFor(birthProfileId);
    logger.info(
      { birthProfileId },
      'Invalidated stored astrology results for a birth profile change',
    );
  },
};

/**
 * Decoupled from `birthProfiles` via the in-process event bus
 * (ARCHITECTURE.md §2) rather than `birthProfile.service` importing and
 * calling this module directly — `birthProfiles` doesn't need to know
 * astrology exists. Registered once, when this module is first loaded
 * (routes/v1/index.ts imports `modules/astrology`'s index.ts at boot).
 */
function invalidateAndLog(birthProfileId: string): void {
  astrologyService.invalidateForBirthProfile(birthProfileId).catch((error: unknown) => {
    logger.error({ err: error, birthProfileId }, 'Failed to invalidate astrology results');
  });
}

eventBus.on('birthProfile.changed', ({ birthProfileId }) => invalidateAndLog(birthProfileId));
eventBus.on('birthProfile.deleted', ({ birthProfileId }) => invalidateAndLog(birthProfileId));
