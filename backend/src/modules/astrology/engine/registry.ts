import { env } from '../../../config/env';
import type { AstrologyEngine } from './astrologyEngine.types';
import { unconfiguredEngine } from './unconfiguredEngine';

/**
 * Bumped whenever engine calculation logic changes in a way that affects
 * previously-computed charts (an ephemeris correction, a new engine
 * provider, a bugfix in yoga detection, ...). `astrology.service.ts`
 * recomputes and overwrites any persisted chart stored with an older
 * version rather than silently serving stale facts (ARCHITECTURE.md §6).
 */
export const CURRENT_CALCULATION_VERSION = 1;

export function currentEngine(): AstrologyEngine {
  switch (env.ASTROLOGY_ENGINE_PROVIDER) {
    case 'none':
    default:
      return unconfiguredEngine;
  }
}
