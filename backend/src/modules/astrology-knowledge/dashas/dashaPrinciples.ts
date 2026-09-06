/**
 * Vedic Astrology Knowledge Layer: Vimshottari Dasha Principles
 * Classical Parashari planetary period mechanics, house activation rules, and Antardasha relationship dynamics.
 */

export interface GrahaDashaDuration {
  planet: string;
  durationYears: number;
  order: number;
  generalTheme: string;
  lifeKeywords: string[];
}

export const VIMSHOTTARI_PERIODS: Record<string, GrahaDashaDuration> = {
  Sun: {
    planet: 'Sun',
    durationYears: 6,
    order: 1,
    generalTheme: 'Self-realization, authority, career visibility, soul purpose, fatherly relations',
    lifeKeywords: ['Authority', 'Leadership', 'Government', 'Vitality', 'Self-worth']
  },
  Moon: {
    planet: 'Moon',
    durationYears: 10,
    order: 2,
    generalTheme: 'Emotional expansion, home, motherly bonds, psychological maturity, public interactions',
    lifeKeywords: ['Emotions', 'Mind', 'Public', 'Home', 'Travel']
  },
  Mars: {
    planet: 'Mars',
    durationYears: 7,
    order: 3,
    generalTheme: 'Courage, initiative, property acquisition, physical drive, competitive focus',
    lifeKeywords: ['Action', 'Courage', 'Property', 'Brothers', 'Energy']
  },
  Rahu: {
    planet: 'Rahu',
    durationYears: 18,
    order: 4,
    generalTheme: 'Material ambition, unconventional expansion, foreign connections, psychological transformation',
    lifeKeywords: ['Ambition', 'Foreign Lands', 'Innovation', 'Obsession', 'Breakthroughs']
  },
  Jupiter: {
    planet: 'Jupiter',
    durationYears: 16,
    order: 5,
    generalTheme: 'Higher wisdom, expansion of family and wealth, dharmic growth, children, auspicious milestones',
    lifeKeywords: ['Wisdom', 'Marriage/Children', 'Wealth', 'Dharma', 'Mentorship']
  },
  Saturn: {
    planet: 'Saturn',
    durationYears: 19,
    order: 6,
    generalTheme: 'Karmic consolidation, disciplined perseverance, professional maturity, humility, enduring achievements',
    lifeKeywords: ['Discipline', 'Career Endurance', 'Patience', 'Service', 'Karmic Lessons']
  },
  Mercury: {
    planet: 'Mercury',
    durationYears: 17,
    order: 7,
    generalTheme: 'Intellectual development, commercial expansion, communication, writing, analytical mastery',
    lifeKeywords: ['Business', 'Intellect', 'Communication', 'Learning', 'Networking']
  },
  Ketu: {
    planet: 'Ketu',
    durationYears: 7,
    order: 8,
    generalTheme: 'Spiritual detachment, dissolution of ego-driven desires, inner awakening, research, liberation',
    lifeKeywords: ['Spirituality', 'Detachment', 'Occult', 'Liberation', 'Introspection']
  },
  Venus: {
    planet: 'Venus',
    durationYears: 20,
    order: 9,
    generalTheme: 'Artistic fruition, romantic relationships, luxury, material comfort, aesthetic appreciation',
    lifeKeywords: ['Love & Marriage', 'Arts', 'Luxury', 'Vehicles', 'Sensory Fulfillment']
  }
};

export type DashaRelationshipType =
  | 'SAMBANDHA_KENDRA_TRIKONA' // 1-1, 1-4, 1-5, 1-7, 1-9, 1-10: Highly supportive/fruitful
  | 'SHADASHTAKA' // 6-8: Friction, legal hurdles, health or sudden transformations
  | 'DVIDWADASA' // 2-12: Expenditure, relocation, detachment, investment
  | 'TRINE_SUPPORTIVE' // 5-9: Dharmic grace, mutual harmony
  | 'NEUTRAL';

/**
 * Determine the mutual geometric relationship between Mahadasha Lord and Antardasha Lord
 */
export function analyzeDashaLordRelationship(
  mahaHouse: number, // 1 to 12
  antarHouse: number // 1 to 12
): {
  relativeDistance: number; // 1 to 12 from Maha to Antar
  relationshipType: DashaRelationshipType;
  sanskritDescription: string;
  interpretiveGuidance: string;
} {
  const relativeDistance = ((antarHouse - mahaHouse + 12) % 12) + 1;

  let relationshipType: DashaRelationshipType = 'NEUTRAL';
  let sanskritDescription = 'Samanya Sambandha';
  let interpretiveGuidance = 'Balanced interaction between the two planetary periods.';

  if (relativeDistance === 1) {
    relationshipType = 'SAMBANDHA_KENDRA_TRIKONA';
    sanskritDescription = 'Sva-Bhava (1-1 Mutual placement)';
    interpretiveGuidance = 'Direct manifestation of the Mahadasha lord’s core agenda with focused energy.';
  } else if (relativeDistance === 5 || relativeDistance === 9) {
    relationshipType = 'TRINE_SUPPORTIVE';
    sanskritDescription = 'Navapanchama (5-9 Auspicious Trine)';
    interpretiveGuidance = 'Dharmic harmony, easy flow of beneficial results, and mutual reinforcement between lords.';
  } else if (relativeDistance === 4 || relativeDistance === 7 || relativeDistance === 10) {
    relationshipType = 'SAMBANDHA_KENDRA_TRIKONA';
    sanskritDescription = 'Kendra Sambandha (Angular Pillar)';
    interpretiveGuidance = 'Active, prominent material progress and public visibility.';
  } else if (relativeDistance === 6 || relativeDistance === 8) {
    relationshipType = 'SHADASHTAKA';
    sanskritDescription = 'Shadashtaka (6-8 Inharmonious axis)';
    interpretiveGuidance = 'Requires patience; indicates temporary resistance, health adjustments, or conflict of priorities.';
  } else if (relativeDistance === 2 || relativeDistance === 12) {
    relationshipType = 'DVIDWADASA';
    sanskritDescription = 'Dvidwadasa (2-12 Financial/Expenditure axis)';
    interpretiveGuidance = 'Focus on resources, investment, potential relocation, or balancing spending with income.';
  }

  return {
    relativeDistance,
    relationshipType,
    sanskritDescription,
    interpretiveGuidance
  };
}

/**
 * Check if current period is Dasha Chidra (final Antardasha of a Mahadasha)
 */
export function isDashaChidra(mahaLord: string, antarLord: string): {
  isChidra: boolean;
  transitionalTheme?: string;
} {
  const finalSubPeriods: Record<string, string> = {
    Sun: 'Venus',
    Moon: 'Sun',
    Mars: 'Moon',
    Rahu: 'Mars',
    Jupiter: 'Rahu',
    Saturn: 'Jupiter',
    Mercury: 'Saturn',
    Ketu: 'Mercury',
    Venus: 'Ketu'
  };

  const isChidra = finalSubPeriods[mahaLord] === antarLord;
  if (isChidra) {
    return {
      isChidra: true,
      transitionalTheme: `Dasha Chidra (${mahaLord}-${antarLord}): Final phase of the ${mahaLord} cycle. Old karmic obligations are settled before transitioning into the next Mahadasha.`
    };
  }

  return { isChidra: false };
}
