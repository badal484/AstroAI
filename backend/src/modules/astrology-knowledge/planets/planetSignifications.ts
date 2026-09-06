/**
 * Vedic Planetary Significations & Karakatwas (Graha Karakas)
 */

export interface PlanetSignification {
  name: string;
  sanskritName: string;
  naturalNature: 'BENEFIC' | 'MALEFIC' | 'NEUTRAL_ADAPTABLE';
  karakatwas: string[]; // Primary significations
  governs: string[]; // Body parts / life areas
  exaltationSign: string;
  debilitationSign: string;
  ownSigns: string[];
  moolatrikonaSign: string;
  friends: string[];
  enemies: string[];
  neutrals: string[];
  drishtiHouses: number[]; // Aspect reach (relative house distances)
}

export const PLANET_SIGNIFICATIONS: Record<string, PlanetSignification> = {
  Sun: {
    name: 'Sun',
    sanskritName: 'Surya',
    naturalNature: 'MALEFIC', // Cruel / Krura
    karakatwas: ['Soul (Atma)', 'Father (Pitri)', 'Authority', 'Leadership', 'Government', 'Ego', 'Vitality', 'Self-respect'],
    governs: ['Heart', 'Bones', 'Eyesight', 'Immunity', 'Public recognition'],
    exaltationSign: 'Aries',
    debilitationSign: 'Libra',
    ownSigns: ['Leo'],
    moolatrikonaSign: 'Leo',
    friends: ['Moon', 'Mars', 'Jupiter'],
    enemies: ['Venus', 'Saturn'],
    neutrals: ['Mercury'],
    drishtiHouses: [7],
  },
  Moon: {
    name: 'Moon',
    sanskritName: 'Chandra',
    naturalNature: 'BENEFIC', // Benefic when waxing (Shukla Paksha)
    karakatwas: ['Mind (Manas)', 'Mother (Matri)', 'Emotions', 'Intuition', 'Memory', 'Public connection', 'Nourishment'],
    governs: ['Chest', 'Fluids', 'Sleep quality', 'Mental equilibrium', 'Peace of mind'],
    exaltationSign: 'Taurus',
    debilitationSign: 'Scorpio',
    ownSigns: ['Cancer'],
    moolatrikonaSign: 'Taurus',
    friends: ['Sun', 'Mercury'],
    enemies: [],
    neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    drishtiHouses: [7],
  },
  Mars: {
    name: 'Mars',
    sanskritName: 'Mangal',
    naturalNature: 'MALEFIC',
    karakatwas: ['Courage', 'Energy', 'Siblings (Bhratri)', 'Real Estate / Land', 'Technical skills', 'Willpower', 'Passions'],
    governs: ['Blood', 'Muscles', 'Bone marrow', 'Surgery', 'Physical drive'],
    exaltationSign: 'Capricorn',
    debilitationSign: 'Cancer',
    ownSigns: ['Aries', 'Scorpio'],
    moolatrikonaSign: 'Aries',
    friends: ['Sun', 'Moon', 'Jupiter'],
    enemies: ['Mercury'],
    neutrals: ['Venus', 'Saturn'],
    drishtiHouses: [4, 7, 8], // Special 4th & 8th aspects
  },
  Mercury: {
    name: 'Mercury',
    sanskritName: 'Budha',
    naturalNature: 'NEUTRAL_ADAPTABLE', // Becomes benefic with benefics, malefic with malefics
    karakatwas: ['Intellect (Buddhi)', 'Speech', 'Analytical ability', 'Commerce & Trade', 'Writing', 'Calculations'],
    governs: ['Nervous system', 'Skin', 'Lungs', 'Cognitive processing', 'Adaptability'],
    exaltationSign: 'Virgo',
    debilitationSign: 'Pisces',
    ownSigns: ['Gemini', 'Virgo'],
    moolatrikonaSign: 'Virgo',
    friends: ['Sun', 'Venus'],
    enemies: ['Moon'],
    neutrals: ['Mars', 'Jupiter', 'Saturn'],
    drishtiHouses: [7],
  },
  Jupiter: {
    name: 'Jupiter',
    sanskritName: 'Guru / Brihaspati',
    naturalNature: 'BENEFIC', // Supreme benefic
    karakatwas: ['Wisdom (Jnana)', 'Dharma', 'Children (Putra)', 'Guru / Mentorship', 'Wealth (Dhana)', 'Divine Grace', 'Higher Learning'],
    governs: ['Liver', 'Fat tissue', 'Circulation', 'Judgement', 'Moral compass'],
    exaltationSign: 'Cancer',
    debilitationSign: 'Capricorn',
    ownSigns: ['Sagittarius', 'Pisces'],
    moolatrikonaSign: 'Sagittarius',
    friends: ['Sun', 'Moon', 'Mars'],
    enemies: ['Mercury', 'Venus'],
    neutrals: ['Saturn'],
    drishtiHouses: [5, 7, 9], // Special 5th & 9th trinal aspects
  },
  Venus: {
    name: 'Venus',
    sanskritName: 'Shukra',
    naturalNature: 'BENEFIC',
    karakatwas: ['Love & Romance', 'Spouse (Kalatra)', 'Beauty & Aesthetics', 'Vehicles (Vahana)', 'Luxury', 'Diplomacy', 'Artistic talents'],
    governs: ['Reproductive vitality', 'Kidneys', 'Hormonal balance', 'Sensory pleasure', 'Refinement'],
    exaltationSign: 'Pisces',
    debilitationSign: 'Virgo',
    ownSigns: ['Taurus', 'Libra'],
    moolatrikonaSign: 'Libra',
    friends: ['Mercury', 'Saturn'],
    enemies: ['Sun', 'Moon'],
    neutrals: ['Mars', 'Jupiter'],
    drishtiHouses: [7],
  },
  Saturn: {
    name: 'Saturn',
    sanskritName: 'Shani',
    naturalNature: 'MALEFIC',
    karakatwas: ['Discipline', 'Longevity (Ayus)', 'Karma & Duty', 'Patience & Delays', 'Service & Labor', 'Perseverance', 'Detachment'],
    governs: ['Joints', 'Nerves', 'Teeth', 'Chronic patterns', 'Endurance under pressure'],
    exaltationSign: 'Libra',
    debilitationSign: 'Aries',
    ownSigns: ['Capricorn', 'Aquarius'],
    moolatrikonaSign: 'Aquarius',
    friends: ['Mercury', 'Venus'],
    enemies: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Jupiter'],
    drishtiHouses: [3, 7, 10], // Special 3rd & 10th aspects
  },
  Rahu: {
    name: 'Rahu',
    sanskritName: 'Rahu (North Lunar Node)',
    naturalNature: 'MALEFIC',
    karakatwas: ['Ambition', 'Foreign Lands', 'Unconventional paths', 'Innovation & Technology', 'Desire', 'Sudden events', 'Illusion (Maya)'],
    governs: ['Phobias', 'Mysterious conditions', 'Worldly obsession', 'Breakthrough insights'],
    exaltationSign: 'Taurus', // Parashari view: Taurus/Gemini
    debilitationSign: 'Scorpio',
    ownSigns: ['Aquarius'],
    moolatrikonaSign: 'Gemini',
    friends: ['Mercury', 'Venus', 'Saturn'],
    enemies: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Jupiter'],
    drishtiHouses: [5, 7, 9], // Trinal nodal aspect
  },
  Ketu: {
    name: 'Ketu',
    sanskritName: 'Ketu (South Lunar Node)',
    naturalNature: 'MALEFIC',
    karakatwas: ['Liberation (Moksha)', 'Spiritual detachment', 'Intuition', 'Occult sciences', 'Renunciation', 'Past life mastery', 'Research'],
    governs: ['Subtle perception', 'Detachment', 'Sudden spiritual transformations'],
    exaltationSign: 'Scorpio',
    debilitationSign: 'Taurus',
    ownSigns: ['Scorpio'],
    moolatrikonaSign: 'Sagittarius',
    friends: ['Mercury', 'Venus', 'Saturn'],
    enemies: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Jupiter'],
    drishtiHouses: [5, 7, 9],
  },
};

/**
 * Retrieve planet signification by English or Sanskrit name (case-insensitive)
 */
export function getPlanetSignification(name: string): PlanetSignification | null {
  const normalized = name.trim().toLowerCase();
  for (const p of Object.values(PLANET_SIGNIFICATIONS)) {
    if (
      p.name.toLowerCase() === normalized ||
      p.sanskritName.toLowerCase().includes(normalized)
    ) {
      return p;
    }
  }
  return null;
}

/**
 * Retrieve all 9 Vedic planet significations
 */
export function getAllPlanetSignifications(): PlanetSignification[] {
  return Object.values(PLANET_SIGNIFICATIONS);
}
