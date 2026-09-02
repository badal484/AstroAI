import type {
  Ascendant,
  CompatibilityScore,
  DashaPeriod,
  House,
  MoonNakshatra,
  PlanetPosition,
  TimeConfidence,
  Transit,
  Yoga,
} from '@astroai/shared-types';

/**
 * Everything the engine needs to compute a chart, already normalized —
 * civil date/time as entered plus the resolved coordinates/timezone. The
 * engine never sees a birth profile id or any user data beyond this.
 */
export interface AstrologyEngineInput {
  dateOfBirth: string;
  birthTime: string | null;
  timeConfidence: TimeConfidence;
  latitude: number;
  longitude: number;
  timezone: string;
}

/** The natal chart facts an engine computes for a fixed birth input —
 * everything in `AstrologyChart` except the persistence/versioning
 * metadata the astrology service attaches once it stores the result. */
export interface ComputedNatalChart {
  ascendant: Ascendant;
  planetPositions: PlanetPosition[];
  houses: House[];
  moonNakshatra: MoonNakshatra;
  currentDasha: DashaPeriod | null;
  yogas: Yoga[];
}

/**
 * THE astrology engine abstraction (CLAUDE.md's hard requirement: the LLM
 * never calculates astrology; this interface is the sole authoritative
 * source of astrology facts). A real implementation — an in-house
 * ephemeris binding or a licensed third-party Vedic astrology API — is
 * plugged in behind this interface without any caller (astrology.service,
 * and transitively chat/reports/horoscope) needing to change.
 *
 * `astrology.service.ts` owns caching/persistence/versioning; an engine
 * implementation is a pure calculation function and must not have I/O side
 * effects beyond what it needs to compute (e.g. calling a provider API).
 */
export interface AstrologyEngine {
  readonly providerId: string;
  computeChart(input: AstrologyEngineInput): Promise<ComputedNatalChart>;
  computeTransits(input: AstrologyEngineInput, atDate: string): Promise<Transit[]>;
  computeCompatibility(
    a: AstrologyEngineInput,
    b: AstrologyEngineInput,
  ): Promise<CompatibilityScore>;
}
