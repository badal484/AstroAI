/**
 * Vedic Astrology Knowledge Layer: Vedic Aspects (Drishti)
 * Classical Parashari rules for 7th house general drishti and special planetary aspects (Mars, Jupiter, Saturn, Rahu).
 */

export interface PlanetaryAspectInfo {
  planet: string;
  aspectedHousesRelative: number[]; // Relative house steps (e.g. [7] or [4, 7, 8])
  aspectNature: 'Benefic_Protective' | 'Disciplining_Delay' | 'Dynamic_Assertive' | 'Transformative_Intense';
  classicalDescription: string;
}

export const PLANETARY_ASPECT_RULES: Record<string, PlanetaryAspectInfo> = {
  Sun: {
    planet: 'Sun',
    aspectedHousesRelative: [7],
    aspectNature: 'Dynamic_Assertive',
    classicalDescription: 'Illuminates the 7th house with royal focus, authority, and fiery vitality.'
  },
  Moon: {
    planet: 'Moon',
    aspectedHousesRelative: [7],
    aspectNature: 'Benefic_Protective',
    classicalDescription: 'Nourishes the 7th house with emotional sensitivity, public connection, and mental receptivity.'
  },
  Mars: {
    planet: 'Mars',
    aspectedHousesRelative: [4, 7, 8],
    aspectNature: 'Dynamic_Assertive',
    classicalDescription: 'Special 4th (protective/aggressive), 7th (direct confrontation), and 8th (transformative drive) drishti.'
  },
  Mercury: {
    planet: 'Mercury',
    aspectedHousesRelative: [7],
    aspectNature: 'Benefic_Protective',
    classicalDescription: 'Brings analytical discernment, intellectual curiosity, and communicative balance to the 7th house.'
  },
  Jupiter: {
    planet: 'Jupiter',
    aspectedHousesRelative: [5, 7, 9],
    aspectNature: 'Benefic_Protective',
    classicalDescription: 'Supreme Amrita (nectar) drishti on 5th (wisdom/merit), 7th (partnerships), and 9th (dharmic fortune).'
  },
  Venus: {
    planet: 'Venus',
    aspectedHousesRelative: [7],
    aspectNature: 'Benefic_Protective',
    classicalDescription: 'Graces the 7th house with harmony, artistic refinement, marital diplomacy, and material satisfaction.'
  },
  Saturn: {
    planet: 'Saturn',
    aspectedHousesRelative: [3, 7, 10],
    aspectNature: 'Disciplining_Delay',
    classicalDescription: 'Special 3rd (effort/courage testing), 7th (partnership duty), and 10th (professional responsibility) drishti.'
  },
  Rahu: {
    planet: 'Rahu',
    aspectedHousesRelative: [5, 7, 9],
    aspectNature: 'Transformative_Intense',
    classicalDescription: 'Expands desires, introduces non-traditional opportunities, and triggers intense worldly ambition.'
  },
  Ketu: {
    planet: 'Ketu',
    aspectedHousesRelative: [5, 7, 9],
    aspectNature: 'Transformative_Intense',
    classicalDescription: 'Introduces spiritual detachment, dissolution of ego-illusions, and deep intuitive insights.'
  }
};

/**
 * Calculate the exact houses (1 to 12) aspected by a planet located in a given house (1 to 12)
 */
export function calculateAspectedHouses(planet: string, placedHouse: number): number[] {
  const rule = PLANETARY_ASPECT_RULES[planet];
  if (!rule) {
    // Default 7th aspect
    return [((placedHouse + 6) % 12) || 12];
  }

  return rule.aspectedHousesRelative.map(relStep => {
    return ((placedHouse + relStep - 1) % 12) || 12;
  });
}

/**
 * Provide contextual interpretation of a planet's aspect on a target house
 */
export function interpretDrishtiOnHouse(planet: string, targetHouse: number): string {
  switch (planet) {
    case 'Jupiter':
      return `Jupiter casts its protective, auspicious drishti on the ${targetHouse}th house, mitigating structural hurdles and blessing the house significations with growth.`;
    case 'Saturn':
      return `Saturn casts its stabilizing drishti on the ${targetHouse}th house, requiring disciplined perseverance, patience, and realistic expectations.`;
    case 'Mars':
      return `Mars aspects the ${targetHouse}th house with dynamic energy and assertiveness, prompting proactive initiative while requiring mindful management of impulses.`;
    case 'Venus':
      return `Venus graces the ${targetHouse}th house with harmony, refined aesthetic taste, and mutual cooperation.`;
    case 'Mercury':
      return `Mercury illuminates the ${targetHouse}th house with rational clarity, clear communication, and commercial intelligence.`;
    case 'Sun':
      return `Sun casts its authoritative light on the ${targetHouse}th house, enhancing visibility and administrative focus.`;
    case 'Moon':
      return `Moon casts its soothing, emotional reflection on the ${targetHouse}th house, heightening intuitive attunement.`;
    case 'Rahu':
      return `Rahu casts its expansive, unconventional influence on the ${targetHouse}th house, urging bold innovations.`;
    case 'Ketu':
      return `Ketu brings subtle introspective detachment and spiritual discernment to the ${targetHouse}th house.`;
    default:
      return `${planet} aspects the ${targetHouse}th house.`;
  }
}
