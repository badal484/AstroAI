/**
 * Vedic Astrology Knowledge Layer: Planetary Dignities (Avasthas & Dignity States)
 * Classical rules for Exaltation, Debilitation, Moolatrikona, Combustion (Asta), Retrograde (Vakri), and Panchadha Maitri.
 */

export interface CombustionThreshold {
  planet: string;
  directDegreeLimit: number; // Degrees within Sun to be considered combust
  retrogradeDegreeLimit?: number;
}

export const COMBUSTION_LIMITS: Record<string, CombustionThreshold> = {
  Moon: { planet: 'Moon', directDegreeLimit: 12.0 },
  Mars: { planet: 'Mars', directDegreeLimit: 17.0, retrogradeDegreeLimit: 17.0 },
  Mercury: { planet: 'Mercury', directDegreeLimit: 14.0, retrogradeDegreeLimit: 12.0 },
  Jupiter: { planet: 'Jupiter', directDegreeLimit: 11.0, retrogradeDegreeLimit: 11.0 },
  Venus: { planet: 'Venus', directDegreeLimit: 10.0, retrogradeDegreeLimit: 8.0 },
  Saturn: { planet: 'Saturn', directDegreeLimit: 15.0, retrogradeDegreeLimit: 15.0 }
};

export interface NaturalFriendshipInfo {
  planet: string;
  friends: string[];
  neutrals: string[];
  enemies: string[];
}

export const NATURAL_FRIENDSHIPS: Record<string, NaturalFriendshipInfo> = {
  Sun: {
    planet: 'Sun',
    friends: ['Moon', 'Mars', 'Jupiter'],
    neutrals: ['Mercury'],
    enemies: ['Venus', 'Saturn', 'Rahu', 'Ketu']
  },
  Moon: {
    planet: 'Moon',
    friends: ['Sun', 'Mercury'],
    neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    enemies: ['Rahu', 'Ketu']
  },
  Mars: {
    planet: 'Mars',
    friends: ['Sun', 'Moon', 'Jupiter'],
    neutrals: ['Venus', 'Saturn'],
    enemies: ['Mercury', 'Rahu', 'Ketu']
  },
  Mercury: {
    planet: 'Mercury',
    friends: ['Sun', 'Venus'],
    neutrals: ['Mars', 'Jupiter', 'Saturn'],
    enemies: ['Moon']
  },
  Jupiter: {
    planet: 'Jupiter',
    friends: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Saturn'],
    enemies: ['Mercury', 'Venus']
  },
  Venus: {
    planet: 'Venus',
    friends: ['Mercury', 'Saturn'],
    neutrals: ['Mars', 'Jupiter'],
    enemies: ['Sun', 'Moon']
  },
  Saturn: {
    planet: 'Saturn',
    friends: ['Mercury', 'Venus'],
    neutrals: ['Jupiter'],
    enemies: ['Sun', 'Moon', 'Mars']
  },
  Rahu: {
    planet: 'Rahu',
    friends: ['Venus', 'Saturn', 'Mercury'],
    neutrals: ['Jupiter'],
    enemies: ['Sun', 'Moon', 'Mars']
  },
  Ketu: {
    planet: 'Ketu',
    friends: ['Mars', 'Jupiter', 'Sun'],
    neutrals: ['Mercury', 'Venus'],
    enemies: ['Saturn', 'Rahu']
  }
};

/**
 * Check if a planet is combust based on longitude distance from the Sun
 */
export function isPlanetCombust(
  planet: string,
  planetLongitude: number,
  sunLongitude: number,
  isRetrograde: boolean = false
): { isCombust: boolean; degreeDiff: number; interpretation?: string } {
  if (planet === 'Sun' || planet === 'Rahu' || planet === 'Ketu') {
    return { isCombust: false, degreeDiff: 0 };
  }

  const threshold = COMBUSTION_LIMITS[planet];
  if (!threshold) return { isCombust: false, degreeDiff: 0 };

  const rawDiff = Math.abs(planetLongitude - sunLongitude);
  const degreeDiff = rawDiff > 180 ? 360 - rawDiff : rawDiff;
  const limit = isRetrograde && threshold.retrogradeDegreeLimit
    ? threshold.retrogradeDegreeLimit
    : threshold.directDegreeLimit;

  const isCombust = degreeDiff <= limit;
  return {
    isCombust,
    degreeDiff,
    interpretation: isCombust
      ? `${planet} is within ${degreeDiff.toFixed(1)}° of the Sun (Asta/Combust), indicating internalized expression of its natural karakatwas.`
      : undefined
  };
}

/**
 * Interpret Retrograde (Vakri) status of a planet
 */
export function interpretRetrogradeStatus(planet: string): string {
  switch (planet) {
    case 'Mercury':
      return 'Mercury Retrograde (Vakri): Deep reflective intellect; reviews decisions thoroughly and re-evaluates commercial or communicative strategies.';
    case 'Jupiter':
      return 'Jupiter Retrograde (Vakri): Inward philosophical orientation; seeks authentic personal truth over rigid dogmatic conventions.';
    case 'Venus':
      return 'Venus Retrograde (Vakri): Re-evaluates relationship dynamics, values emotional depth and creative authenticity over surface appearances.';
    case 'Mars':
      return 'Mars Retrograde (Vakri): High internal stamina and strategic recalibration; acts with calculated deliberation rather than rash impulse.';
    case 'Saturn':
      return 'Saturn Retrograde (Vakri): Strong karmic discipline and introspective perseverance; re-examines professional commitments with serious accountability.';
    default:
      return `${planet} in retrograde motion indicates focused internal energy.`;
  }
}
