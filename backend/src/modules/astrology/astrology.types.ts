import {
  FactPrecision,
  TimeConfidence,
  type AstrologyChart,
  type BirthProfile,
} from '@astroai/shared-types';
import type { AstrologyEngineInput, ComputedNatalChart } from './engine/astrologyEngine.types';
import type { ChartDocument } from './astrology.model';

export function toEngineInput(profile: BirthProfile): AstrologyEngineInput {
  return {
    dateOfBirth: profile.dateOfBirth,
    birthTime: profile.birthTime,
    timeConfidence: profile.timeConfidence,
    latitude: profile.location.latitude,
    longitude: profile.location.longitude,
    timezone: profile.location.timezone,
  };
}

function downgradePrecision(
  timeConfidence: TimeConfidence,
  enginePrecision: FactPrecision,
): FactPrecision {
  if (timeConfidence === TimeConfidence.UNKNOWN) return FactPrecision.UNAVAILABLE;
  if (timeConfidence === TimeConfidence.APPROXIMATE && enginePrecision === FactPrecision.RELIABLE) {
    return FactPrecision.LOW_CONFIDENCE;
  }
  return enginePrecision;
}

/**
 * Centrally enforces CLAUDE.md's "never present a guess as fact" rule for
 * time-sensitive facts (ascendant, houses), regardless of what a given
 * engine implementation returns — a single policy point rather than
 * trusting every current and future engine to remember it independently.
 */
export function applyPrecisionPolicy(
  chart: ComputedNatalChart,
  timeConfidence: TimeConfidence,
): ComputedNatalChart {
  return {
    ...chart,
    ascendant: {
      ...chart.ascendant,
      precision: downgradePrecision(timeConfidence, chart.ascendant.precision),
    },
    houses: chart.houses.map((house) => ({
      ...house,
      precision: downgradePrecision(timeConfidence, house.precision),
    })),
  };
}

export function toAstrologyChart(doc: ChartDocument): AstrologyChart {
  return {
    birthProfileId: doc.birthProfileId.toString(),
    calculationVersion: doc.calculationVersion,
    engineProviderId: doc.engineProviderId,
    generatedAt: doc.updatedAt.toISOString(),
    ...doc.facts,
  };
}
