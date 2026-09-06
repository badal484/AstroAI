import type {
  AshtakootaCategoryDTO,
  AshtakootaScoreDTO,
} from '@astroai/shared-types';

// 27 Nakshatras in standard order
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Rashi Lords (1: Aries, ..., 12: Pisces)
const RASHI_LORDS: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

// Natural Planetary Friendship Table: 1 = Friend, 0 = Neutral, -1 = Enemy
const PLANET_RELATIONS: Record<string, Record<string, number>> = {
  Sun: { Sun: 1, Moon: 1, Mars: 1, Jupiter: 1, Mercury: 0, Venus: -1, Saturn: -1 },
  Moon: { Sun: 1, Moon: 1, Mercury: 1, Mars: 0, Jupiter: 0, Venus: 0, Saturn: 0 },
  Mars: { Sun: 1, Moon: 1, Jupiter: 1, Venus: 0, Saturn: 0, Mercury: -1 },
  Mercury: { Sun: 1, Venus: 1, Mars: 0, Jupiter: 0, Saturn: 0, Moon: -1 },
  Jupiter: { Sun: 1, Moon: 1, Mars: 1, Saturn: 0, Mercury: -1, Venus: -1 },
  Venus: { Mercury: 1, Saturn: 1, Mars: 0, Jupiter: 0, Sun: -1, Moon: -1 },
  Saturn: { Mercury: 1, Venus: 1, Jupiter: 0, Sun: -1, Moon: -1, Mars: -1 },
};

// 1. Varna Mapping (Grade 4 to 1)
const RASHI_VARNA: Record<string, { varna: string; grade: number }> = {
  Cancer: { varna: 'Brahmin', grade: 4 },
  Scorpio: { varna: 'Brahmin', grade: 4 },
  Pisces: { varna: 'Brahmin', grade: 4 },
  Aries: { varna: 'Kshatriya', grade: 3 },
  Leo: { varna: 'Kshatriya', grade: 3 },
  Sagittarius: { varna: 'Kshatriya', grade: 3 },
  Taurus: { varna: 'Vaishya', grade: 2 },
  Virgo: { varna: 'Vaishya', grade: 2 },
  Capricorn: { varna: 'Vaishya', grade: 2 },
  Gemini: { varna: 'Shudra', grade: 1 },
  Libra: { varna: 'Shudra', grade: 1 },
  Aquarius: { varna: 'Shudra', grade: 1 },
};

// 2. Vashya Mapping
const RASHI_VASHYA: Record<string, string> = {
  Aries: 'Chatushpada',
  Taurus: 'Chatushpada',
  Gemini: 'Dwipada',
  Cancer: 'Jalachara',
  Leo: 'Vanachara',
  Virgo: 'Dwipada',
  Libra: 'Dwipada',
  Scorpio: 'Keeta',
  Sagittarius: 'Dwipada',
  Capricorn: 'Jalachara',
  Aquarius: 'Dwipada',
  Pisces: 'Jalachara',
};

// 4. Nakshatra to Yoni Mapping (0-26)
const NAKSHATRA_YONI = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog',
  'Cat', 'Sheep', 'Cat', 'Rat', 'Rat', 'Cow',
  'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer',
  'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse',
  'Lion', 'Cow', 'Elephant',
];

const YONI_ENEMIES: Record<string, string> = {
  Horse: 'Buffalo',
  Buffalo: 'Horse',
  Elephant: 'Lion',
  Lion: 'Elephant',
  Sheep: 'Monkey',
  Monkey: 'Sheep',
  Serpent: 'Mongoose',
  Mongoose: 'Serpent',
  Dog: 'Deer',
  Deer: 'Dog',
  Cat: 'Rat',
  Rat: 'Cat',
  Cow: 'Tiger',
  Tiger: 'Cow',
};

// 6. Nakshatra to Gana Mapping: 0 = Deva, 1 = Manushya, 2 = Rakshasa
const NAKSHATRA_GANA: number[] = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0,
];
const GANA_NAMES = ['Deva', 'Manushya', 'Rakshasa'];

// 8. Nakshatra to Nadi Mapping: 0 = Adi, 1 = Madhya, 2 = Antya
const NAKSHATRA_NADI: number[] = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2,
];
const NADI_NAMES = ['Adi (Vata)', 'Madhya (Pitta)', 'Antya (Kapha)'];

function getNakshatraIndex(name: string): number {
  const found = NAKSHATRAS.findIndex((n) => n.toLowerCase() === name.toLowerCase());
  return found >= 0 ? found : 0;
}

function getRashiIndex(name: string): number {
  const rashis = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  const found = rashis.findIndex((r) => r.toLowerCase() === name.toLowerCase());
  return found >= 0 ? found : 0;
}

function checkMangalDosha(chart: any): boolean {
  const mars = chart.planetPositions?.find(
    (p: any) => p.planet?.toLowerCase() === 'mars' || p.name?.toLowerCase() === 'mars',
  );
  if (!mars) return false;
  // Mars in houses 1, 2, 4, 7, 8, 12 causes Mangal / Kuja Dosha
  const doshaHouses = [1, 2, 4, 7, 8, 12];
  return mars.house !== null && mars.house !== undefined && doshaHouses.includes(mars.house);
}

/**
 * Computes deterministic Vedic Ashtakoota Guna Milan score out of 36 points.
 */
export function calculateAshtakoota(
  chartA: any,
  chartB: any,
): AshtakootaScoreDTO {
  const moonA = chartA.planetPositions?.find(
    (p: any) => p.planet?.toLowerCase() === 'moon' || p.name?.toLowerCase() === 'moon',
  );
  const moonB = chartB.planetPositions?.find(
    (p: any) => p.planet?.toLowerCase() === 'moon' || p.name?.toLowerCase() === 'moon',
  );

  const formatRashi = (s?: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Aries';

  const rashiA = formatRashi(moonA?.sign);
  const rashiB = formatRashi(moonB?.sign);

  const nakA = chartA.moonNakshatra?.name || chartA.moonNakshatra || 'Ashwini';
  const nakB = chartB.moonNakshatra?.name || chartB.moonNakshatra || 'Ashwini';

  const idxNakA = getNakshatraIndex(nakA);
  const idxNakB = getNakshatraIndex(nakB);

  const idxRashiA = getRashiIndex(rashiA);
  const idxRashiB = getRashiIndex(rashiB);

  const categories: AshtakootaCategoryDTO[] = [];

  // 1. VARNA (1 pt) - Spiritual Harmony
  const varnaA = RASHI_VARNA[rashiA] || { varna: 'Kshatriya', grade: 3 };
  const varnaB = RASHI_VARNA[rashiB] || { varna: 'Kshatriya', grade: 3 };
  let varnaScore = 0;
  if (varnaA.grade >= varnaB.grade) {
    varnaScore = 1;
  }
  categories.push({
    name: 'Varna',
    score: varnaScore,
    maxScore: 1,
    area: 'Spiritual Compatibility & Mutual Respect',
    description: `Person A (${varnaA.varna}) and Person B (${varnaB.varna}) work inclination and spiritual harmony.`,
  });

  // 2. VASHYA (2 pts) - Mutual Attraction & Dominance
  const vashyaA = RASHI_VASHYA[rashiA] || 'Dwipada';
  const vashyaB = RASHI_VASHYA[rashiB] || 'Dwipada';
  let vashyaScore = 0;
  if (vashyaA === vashyaB) {
    vashyaScore = 2;
  } else if (
    (vashyaA === 'Dwipada' && vashyaB === 'Chatushpada') ||
    (vashyaA === 'Chatushpada' && vashyaB === 'Dwipada') ||
    (vashyaA === 'Jalachara' && vashyaB === 'Dwipada')
  ) {
    vashyaScore = 1;
  }
  categories.push({
    name: 'Vashya',
    score: vashyaScore,
    maxScore: 2,
    area: 'Magnetic Attraction & Mutual Dominance',
    description: `Person A (${vashyaA}) and Person B (${vashyaB}) balance of power and natural magnetism.`,
  });

  // 3. TARA (DINA) (3 pts) - Destiny & Health
  const countAtoB = ((idxNakB - idxNakA + 27) % 27) + 1;
  const countBtoA = ((idxNakA - idxNakB + 27) % 27) + 1;
  const taraRemA = countAtoB % 9;
  const taraRemB = countBtoA % 9;
  const auspiciousTaras = [2, 4, 6, 8, 9, 0];
  const isAuspiciousA = auspiciousTaras.includes(taraRemA);
  const isAuspiciousB = auspiciousTaras.includes(taraRemB);

  let taraScore = 0;
  if (isAuspiciousA && isAuspiciousB) {
    taraScore = 3;
  } else if (isAuspiciousA || isAuspiciousB) {
    taraScore = 1.5;
  }
  categories.push({
    name: 'Tara',
    score: taraScore,
    maxScore: 3,
    area: 'Birth Star Harmony & Longevity',
    description: 'Calculates planetary energy flow and auspicious destiny alignment between birth stars.',
  });

  // 4. YONI (4 pts) - Biological & Physical Compatibility
  const yoniA = NAKSHATRA_YONI[idxNakA] || 'Deer';
  const yoniB = NAKSHATRA_YONI[idxNakB] || 'Deer';
  let yoniScore = 2;
  if (yoniA === yoniB) {
    yoniScore = 4;
  } else if (YONI_ENEMIES[yoniA] === yoniB) {
    yoniScore = 0;
  } else {
    yoniScore = 2;
  }
  categories.push({
    name: 'Yoni',
    score: yoniScore,
    maxScore: 4,
    area: 'Biological, Physical & Instinctual Harmony',
    description: `Animal symbolism of birth stars (${yoniA} & ${yoniB}) reflecting mutual empathy.`,
  });

  // 5. GRAHA MAITRI (5 pts) - Mental Friendship & Psychological Bonding
  const lordA = RASHI_LORDS[rashiA] || 'Mars';
  const lordB = RASHI_LORDS[rashiB] || 'Mars';
  const relAtoB = PLANET_RELATIONS[lordA]?.[lordB] ?? 0;
  const relBtoA = PLANET_RELATIONS[lordB]?.[lordA] ?? 0;

  let grahaScore = 3;
  if (lordA === lordB) {
    grahaScore = 5;
  } else if (relAtoB === 1 && relBtoA === 1) {
    grahaScore = 5;
  } else if ((relAtoB === 1 && relBtoA === 0) || (relAtoB === 0 && relBtoA === 1)) {
    grahaScore = 4;
  } else if (relAtoB === 0 && relBtoA === 0) {
    grahaScore = 3;
  } else if ((relAtoB === 1 && relBtoA === -1) || (relAtoB === -1 && relBtoA === 1)) {
    grahaScore = 1;
  } else if (relAtoB === -1 && relBtoA === -1) {
    grahaScore = 0;
  }
  categories.push({
    name: 'Graha Maitri',
    score: grahaScore,
    maxScore: 5,
    area: 'Intellectual Friendship & Psychological Rapport',
    description: `Planetary friendship between Moon sign rulers (${lordA} & ${lordB}).`,
  });

  // 6. GANA (6 pts) - Temperament & Lifestyle Alignment
  const ganaA = NAKSHATRA_GANA[idxNakA] ?? 0;
  const ganaB = NAKSHATRA_GANA[idxNakB] ?? 0;
  let ganaScore = 0;
  if (ganaA === ganaB) {
    ganaScore = 6;
  } else if ((ganaA === 0 && ganaB === 1) || (ganaA === 1 && ganaB === 0)) {
    ganaScore = 5;
  } else if ((ganaA === 0 && ganaB === 2) || (ganaA === 2 && ganaB === 0)) {
    ganaScore = 1;
  } else {
    ganaScore = 0;
  }
  categories.push({
    name: 'Gana',
    score: ganaScore,
    maxScore: 6,
    area: 'Temperament & Cultural Concord',
    description: `Behavioral types (${GANA_NAMES[ganaA]} & ${GANA_NAMES[ganaB]}) predicting lifestyle harmony.`,
  });

  // 7. BHAKOOT (7 pts) - Emotional Bonding & Family Welfare
  const rashiDist = ((idxRashiB - idxRashiA + 12) % 12) + 1;
  let bhakootScore = 7;
  let bhakootDosha = false;
  let bhakootDoshaCancelled = false;

  // 2/12, 6/8, 9/5 positions create Bhakoot Dosha
  if ([2, 12, 6, 8, 5, 9].includes(rashiDist)) {
    bhakootDosha = true;
    // Cancellation if lords are same or mutual friends
    if (lordA === lordB || (relAtoB === 1 && relBtoA === 1)) {
      bhakootDoshaCancelled = true;
      bhakootScore = 7;
    } else {
      bhakootScore = 0;
    }
  }
  categories.push({
    name: 'Bhakoot',
    score: bhakootScore,
    maxScore: 7,
    area: 'Emotional Connectivity & Financial Growth',
    description: bhakootDoshaCancelled
      ? 'Bhakoot Dosha is present but cancelled due to planetary friendship.'
      : bhakootDosha
      ? 'Inauspicious relative Moon sign placement (Bhakoot Dosha).'
      : 'Harmonious relative Moon sign placements (1/7, 3/11, 4/10).',
  });

  // 8. NADI (8 pts) - Genetic, Health & Physiological Harmony
  const nadiA = NAKSHATRA_NADI[idxNakA] ?? 0;
  const nadiB = NAKSHATRA_NADI[idxNakB] ?? 0;
  let nadiScore = 8;
  let nadiDosha = false;
  let nadiDoshaCancelled = false;

  if (nadiA === nadiB) {
    nadiDosha = true;
    // Cancellation: Different Rashis despite same Nadi, or same Rashi with different Nakshatras
    if (rashiA !== rashiB || idxNakA !== idxNakB) {
      nadiDoshaCancelled = true;
      nadiScore = 8;
    } else {
      nadiScore = 0;
    }
  }
  categories.push({
    name: 'Nadi',
    score: nadiScore,
    maxScore: 8,
    area: 'Genetic & Physiological Health Compatibility',
    description: nadiDoshaCancelled
      ? `Same Nadi (${NADI_NAMES[nadiA]}) with classical astrological cancellation.`
      : nadiDosha
      ? `Same Nadi (${NADI_NAMES[nadiA]}) creating Nadi Dosha.`
      : `Different Nadis (${NADI_NAMES[nadiA]} & ${NADI_NAMES[nadiB]}) - highly auspicious.`,
  });

  // Total Score out of 36
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const percentage = Math.round((totalScore / 36) * 100);
  const isAuspicious = totalScore >= 18 && (!nadiDosha || nadiDoshaCancelled);

  const mangalA = checkMangalDosha(chartA);
  const mangalB = checkMangalDosha(chartB);

  return {
    totalScore,
    maxScore: 36,
    percentage,
    isAuspicious,
    categories,
    nadiDosha,
    nadiDoshaCancelled,
    bhakootDosha,
    bhakootDoshaCancelled,
    mangalDoshaA: mangalA,
    mangalDoshaB: mangalB,
  };
}
