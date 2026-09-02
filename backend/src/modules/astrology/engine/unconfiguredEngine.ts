import { AstrologyEngineUnavailableError } from '../../../shared/errors';
import type { AstrologyEngine } from './astrologyEngine.types';

/**
 * Default engine when `ASTROLOGY_ENGINE_PROVIDER=none` (the default).
 * Deliberately computes nothing and returns nothing that looks like a real
 * chart — CLAUDE.md is explicit: "Do not hardcode fake astrology results as
 * if they were real." Every method throws a clear, typed, isolated error
 * instead, so callers (and the mobile UI) can show "astrology isn't set up
 * yet" rather than silently displaying fabricated planetary positions.
 *
 * This is the seam a real engine (in-house ephemeris binding, or a
 * licensed third-party Vedic astrology API) plugs into — see
 * `ARCHITECTURE.md` §6 for the open build-vs-integrate decision.
 */
export const unconfiguredEngine: AstrologyEngine = {
  providerId: 'none',

  computeChart() {
    return Promise.reject(new AstrologyEngineUnavailableError());
  },

  computeTransits() {
    return Promise.reject(new AstrologyEngineUnavailableError());
  },

  computeCompatibility() {
    return Promise.reject(new AstrologyEngineUnavailableError());
  },
};
