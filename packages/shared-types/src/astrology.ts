import { z } from 'zod';

/**
 * Structured astrology domain types (ARCHITECTURE.md §6). These are facts,
 * never natural-language text — interpretation is the AI Gateway's job,
 * fed these facts as verified context (CLAUDE.md §11).
 */

export const Planet = {
  SUN: 'sun',
  MOON: 'moon',
  MARS: 'mars',
  MERCURY: 'mercury',
  JUPITER: 'jupiter',
  VENUS: 'venus',
  SATURN: 'saturn',
  RAHU: 'rahu',
  KETU: 'ketu',
} as const;
export type Planet = (typeof Planet)[keyof typeof Planet];

export const ZodiacSign = {
  ARIES: 'aries',
  TAURUS: 'taurus',
  GEMINI: 'gemini',
  CANCER: 'cancer',
  LEO: 'leo',
  VIRGO: 'virgo',
  LIBRA: 'libra',
  SCORPIO: 'scorpio',
  SAGITTARIUS: 'sagittarius',
  CAPRICORN: 'capricorn',
  AQUARIUS: 'aquarius',
  PISCES: 'pisces',
} as const;
export type ZodiacSign = (typeof ZodiacSign)[keyof typeof ZodiacSign];

/**
 * How much a computed fact can be trusted given the birth profile's
 * `timeConfidence`. Ascendant/houses are time-sensitive (minutes matter);
 * planetary sign positions and nakshatra are stable for a whole day in the
 * overwhelming majority of cases. Never presented as exact when it isn't
 * (CLAUDE.md §20).
 */
export const FactPrecision = {
  RELIABLE: 'reliable',
  LOW_CONFIDENCE: 'low_confidence',
  UNAVAILABLE: 'unavailable',
} as const;
export type FactPrecision = (typeof FactPrecision)[keyof typeof FactPrecision];

export interface PlanetPosition {
  planet: Planet;
  sign: ZodiacSign;
  /** Degrees within the sign, 0-30. */
  signDegree: number;
  house: number | null;
  nakshatra: string;
  nakshatraPada: number;
  isRetrograde: boolean;
}

export interface Ascendant {
  sign: ZodiacSign;
  degree: number;
  precision: FactPrecision;
}

export interface House {
  number: number;
  sign: ZodiacSign;
  cuspDegree: number;
  planets: Planet[];
  precision: FactPrecision;
}

export interface MoonNakshatra {
  name: string;
  lord: Planet;
  pada: number;
}

export interface DashaPeriod {
  planet: Planet;
  startDate: string;
  endDate: string;
  antardashas: AntardashaPeriod[];
}

export interface AntardashaPeriod {
  planet: Planet;
  startDate: string;
  endDate: string;
}

export interface Yoga {
  name: string;
  description: string;
  planetsInvolved: Planet[];
}

export interface Transit {
  planet: Planet;
  sign: ZodiacSign;
  house: number | null;
  isRetrograde: boolean;
}

export interface CompatibilityCategoryScore {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface CompatibilityScore {
  totalScore: number;
  maxScore: number;
  categories: CompatibilityCategoryScore[];
}

/** The full natal chart bundle for a birth profile — persisted, versioned,
 * cached. Static for a given birth input (unlike transits, which move). */
export interface AstrologyChart {
  birthProfileId: string;
  calculationVersion: number;
  engineProviderId: string;
  generatedAt: string;
  ascendant: Ascendant;
  planetPositions: PlanetPosition[];
  houses: House[];
  moonNakshatra: MoonNakshatra;
  currentDasha: DashaPeriod | null;
  yogas: Yoga[];
}

export const transitsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
    .optional(),
});
export type TransitsQuery = z.infer<typeof transitsQuerySchema>;

export const compatibilityRequestSchema = z.object({
  birthProfileIdA: z.string().trim().min(1),
  birthProfileIdB: z.string().trim().min(1),
});
export type CompatibilityRequest = z.infer<typeof compatibilityRequestSchema>;
