/**
 * Vedic Astrology Knowledge Layer: Zodiac Signs (Rashis)
 * Classical Parashari attributes, elements, modalities, ruling grahas, and exaltation/debilitation points.
 */

export type ElementType = 'Agni' | 'Prithvi' | 'Vayu' | 'Jala'; // Fire, Earth, Air, Water
export type ModalityType = 'Chara' | 'Sthira' | 'Dwisvabhava'; // Movable, Fixed, Dual
export type GunaType = 'Sattva' | 'Rajas' | 'Tamas';

export interface ZodiacSignInfo {
  signNumber: number; // 1 to 12
  sanskritName: string;
  englishName: string;
  rulingPlanet: string;
  element: ElementType;
  elementEnglish: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: ModalityType;
  modalityEnglish: 'Movable' | 'Fixed' | 'Dual';
  guna: GunaType;
  gender: 'Male' | 'Female';
  bodyParts: string[];
  keySignifications: string[];
  careerTendencies: string[];
  exaltedPlanet?: { planet: string; peakDegree: number };
  debilitatedPlanet?: { planet: string; peakDegree: number };
  moolatrikonaPlanet?: { planet: string; degrees: [number, number] };
}

export const ZODIAC_SIGNS: Record<number, ZodiacSignInfo> = {
  1: {
    signNumber: 1,
    sanskritName: 'Mesha',
    englishName: 'Aries',
    rulingPlanet: 'Mars',
    element: 'Agni',
    elementEnglish: 'Fire',
    modality: 'Chara',
    modalityEnglish: 'Movable',
    guna: 'Rajas',
    gender: 'Male',
    bodyParts: ['Head', 'Brain', 'Forehead', 'Skull'],
    keySignifications: ['Initiative', 'Courage', 'Independence', 'Leadership', 'Pioneering spirit', 'Impulsiveness'],
    careerTendencies: ['Military', 'Police', 'Surgery', 'Engineering', 'Sports', 'Entrepreneurship'],
    exaltedPlanet: { planet: 'Sun', peakDegree: 10 },
    debilitatedPlanet: { planet: 'Saturn', peakDegree: 20 },
    moolatrikonaPlanet: { planet: 'Mars', degrees: [0, 12] }
  },
  2: {
    signNumber: 2,
    sanskritName: 'Vrishabha',
    englishName: 'Taurus',
    rulingPlanet: 'Venus',
    element: 'Prithvi',
    elementEnglish: 'Earth',
    modality: 'Sthira',
    modalityEnglish: 'Fixed',
    guna: 'Rajas',
    gender: 'Female',
    bodyParts: ['Face', 'Throat', 'Neck', 'Vocal cords', 'Teeth'],
    keySignifications: ['Stability', 'Wealth accumulation', 'Material comfort', 'Aesthetics', 'Determination', 'Sensory pleasures'],
    careerTendencies: ['Banking', 'Finance', 'Agriculture', 'Hospitality', 'Arts', 'Luxury goods', 'Music'],
    exaltedPlanet: { planet: 'Moon', peakDegree: 3 },
    debilitatedPlanet: { planet: 'Ketu', peakDegree: 3 },
    moolatrikonaPlanet: { planet: 'Moon', degrees: [3, 30] }
  },
  3: {
    signNumber: 3,
    sanskritName: 'Mithuna',
    englishName: 'Gemini',
    rulingPlanet: 'Mercury',
    element: 'Vayu',
    elementEnglish: 'Air',
    modality: 'Dwisvabhava',
    modalityEnglish: 'Dual',
    guna: 'Sattva',
    gender: 'Male',
    bodyParts: ['Shoulders', 'Arms', 'Hands', 'Respiratory tract', 'Nervous system'],
    keySignifications: ['Communication', 'Intellect', 'Curiosity', 'Versatility', 'Networking', 'Commerce'],
    careerTendencies: ['Media', 'Journalism', 'Writing', 'IT & Software', 'Trading', 'Teaching', 'Public Relations'],
    exaltedPlanet: { planet: 'Rahu', peakDegree: 15 },
    debilitatedPlanet: { planet: 'Ketu', peakDegree: 15 }
  },
  4: {
    signNumber: 4,
    sanskritName: 'Karka',
    englishName: 'Cancer',
    rulingPlanet: 'Moon',
    element: 'Jala',
    elementEnglish: 'Water',
    modality: 'Chara',
    modalityEnglish: 'Movable',
    guna: 'Sattva',
    gender: 'Female',
    bodyParts: ['Chest', 'Breasts', 'Lungs', 'Stomach', 'Heart'],
    keySignifications: ['Nurturing', 'Emotional depth', 'Home & Family', 'Intuition', 'Psychological sensitivity', 'Maternal care'],
    careerTendencies: ['Healthcare', 'Nursing', 'Real Estate', 'Hospitality', 'Psychology', 'Social Work', 'Catering'],
    exaltedPlanet: { planet: 'Jupiter', peakDegree: 5 },
    debilitatedPlanet: { planet: 'Mars', peakDegree: 28 },
    moolatrikonaPlanet: { planet: 'Moon', degrees: [0, 3] }
  },
  5: {
    signNumber: 5,
    sanskritName: 'Simha',
    englishName: 'Leo',
    rulingPlanet: 'Sun',
    element: 'Agni',
    elementEnglish: 'Fire',
    modality: 'Sthira',
    modalityEnglish: 'Fixed',
    guna: 'Sattva',
    gender: 'Male',
    bodyParts: ['Heart', 'Spine', 'Upper back', 'Vital energy'],
    keySignifications: ['Authority', 'Royalty', 'Creativity', 'Self-expression', 'Generosity', 'Dignity', 'Administration'],
    careerTendencies: ['Government administration', 'Politics', 'Executive Leadership', 'Entertainment', 'Fine Arts', 'Management'],
    moolatrikonaPlanet: { planet: 'Sun', degrees: [0, 20] }
  },
  6: {
    signNumber: 6,
    sanskritName: 'Kanya',
    englishName: 'Virgo',
    rulingPlanet: 'Mercury',
    element: 'Prithvi',
    elementEnglish: 'Earth',
    modality: 'Dwisvabhava',
    modalityEnglish: 'Dual',
    guna: 'Tamas',
    gender: 'Female',
    bodyParts: ['Digestive system', 'Intestines', 'Abdomen', 'Nerves'],
    keySignifications: ['Analytical precision', 'Discernment', 'Service & Healing', 'Problem solving', 'Attention to detail', 'Practicality'],
    careerTendencies: ['Accounting', 'Auditing', 'Medicine & Pharmacy', 'Data Analytics', 'Editing', 'Quality Assurance'],
    exaltedPlanet: { planet: 'Mercury', peakDegree: 15 },
    debilitatedPlanet: { planet: 'Venus', peakDegree: 27 },
    moolatrikonaPlanet: { planet: 'Mercury', degrees: [15, 20] }
  },
  7: {
    signNumber: 7,
    sanskritName: 'Tula',
    englishName: 'Libra',
    rulingPlanet: 'Venus',
    element: 'Vayu',
    elementEnglish: 'Air',
    modality: 'Chara',
    modalityEnglish: 'Movable',
    guna: 'Rajas',
    gender: 'Male',
    bodyParts: ['Kidneys', 'Lower back', 'Lumbar region', 'Pelvic area'],
    keySignifications: ['Balance', 'Harmony', 'Partnership', 'Justice', 'Diplomacy', 'Trade & Business', 'Aesthetic judgment'],
    careerTendencies: ['Law & Judiciary', 'Diplomacy', 'Consulting', 'Design', 'Commerce', 'Fashion', 'Conflict Resolution'],
    exaltedPlanet: { planet: 'Saturn', peakDegree: 20 },
    debilitatedPlanet: { planet: 'Sun', peakDegree: 10 },
    moolatrikonaPlanet: { planet: 'Venus', degrees: [0, 15] }
  },
  8: {
    signNumber: 8,
    sanskritName: 'Vrischika',
    englishName: 'Scorpio',
    rulingPlanet: 'Mars',
    element: 'Jala',
    elementEnglish: 'Water',
    modality: 'Sthira',
    modalityEnglish: 'Fixed',
    guna: 'Tamas',
    gender: 'Female',
    bodyParts: ['Reproductive organs', 'Excretory system', 'Pelvic organs'],
    keySignifications: ['Transformation', 'Deep research', 'Occult & Mysticism', 'Intensity', 'Regeneration', 'Confidential matters'],
    careerTendencies: ['Research & Investigation', 'Surgeon', 'Occult/Astrology', 'Cybersecurity', 'Mining', 'Crisis Management'],
    exaltedPlanet: { planet: 'Ketu', peakDegree: 3 },
    debilitatedPlanet: { planet: 'Moon', peakDegree: 3 }
  },
  9: {
    signNumber: 9,
    sanskritName: 'Dhanu',
    englishName: 'Sagittarius',
    rulingPlanet: 'Jupiter',
    element: 'Agni',
    elementEnglish: 'Fire',
    modality: 'Dwisvabhava',
    modalityEnglish: 'Dual',
    guna: 'Sattva',
    gender: 'Male',
    bodyParts: ['Thighs', 'Hips', 'Arterial system', 'Liver'],
    keySignifications: ['Dharma', 'Higher wisdom', 'Philosophy', 'Long journeys', 'Optimism', 'Spiritual ethics', 'Teaching'],
    careerTendencies: ['Higher Education', 'Legal practice', 'Religious/Spiritual guidance', 'Publishing', 'International affairs', 'Philosophy'],
    exaltedPlanet: { planet: 'Rahu', peakDegree: 15 },
    debilitatedPlanet: { planet: 'Ketu', peakDegree: 15 },
    moolatrikonaPlanet: { planet: 'Jupiter', degrees: [0, 10] }
  },
  10: {
    signNumber: 10,
    sanskritName: 'Makara',
    englishName: 'Capricorn',
    rulingPlanet: 'Saturn',
    element: 'Prithvi',
    elementEnglish: 'Earth',
    modality: 'Chara',
    modalityEnglish: 'Movable',
    guna: 'Tamas',
    gender: 'Female',
    bodyParts: ['Knees', 'Joints', 'Bones', 'Skeletal structure'],
    keySignifications: ['Perseverance', 'Discipline', 'Professional ambition', 'Structural organization', 'Pragmatism', 'Long-term endurance'],
    careerTendencies: ['Corporate Leadership', 'Civil Engineering', 'Public Administration', 'Mining', 'Industrial Management'],
    exaltedPlanet: { planet: 'Mars', peakDegree: 28 },
    debilitatedPlanet: { planet: 'Jupiter', peakDegree: 5 }
  },
  11: {
    signNumber: 11,
    sanskritName: 'Kumbha',
    englishName: 'Aquarius',
    rulingPlanet: 'Saturn',
    element: 'Vayu',
    elementEnglish: 'Air',
    modality: 'Sthira',
    modalityEnglish: 'Fixed',
    guna: 'Tamas',
    gender: 'Male',
    bodyParts: ['Calves', 'Shins', 'Ankles', 'Circulatory system'],
    keySignifications: ['Humanitarian vision', 'Innovation', 'Large networks', 'Gains & Labha', 'Collective progress', 'Original thinking'],
    careerTendencies: ['Technology & Research', 'Social Enterprises', 'Non-profits', 'Aviation', 'Scientific Innovation', 'Network Engineering'],
    moolatrikonaPlanet: { planet: 'Saturn', degrees: [0, 20] }
  },
  12: {
    signNumber: 12,
    sanskritName: 'Meena',
    englishName: 'Pisces',
    rulingPlanet: 'Jupiter',
    element: 'Jala',
    elementEnglish: 'Water',
    modality: 'Dwisvabhava',
    modalityEnglish: 'Dual',
    guna: 'Sattva',
    gender: 'Female',
    bodyParts: ['Feet', 'Toes', 'Lymphatic system', 'Subconscious mind'],
    keySignifications: ['Moksha', 'Spiritual surrender', 'Compassion', 'Transcendence', 'Creativity & Imagination', 'Foreign connections'],
    careerTendencies: ['Spiritual Teaching', 'Arts & Cinema', 'Foreign Services', 'Sanatorium/Hospitality', 'Psychology', 'Philanthropy'],
    exaltedPlanet: { planet: 'Venus', peakDegree: 27 },
    debilitatedPlanet: { planet: 'Mercury', peakDegree: 15 },
    moolatrikonaPlanet: { planet: 'Jupiter', degrees: [0, 10] }
  }
};

/**
 * Get Zodiac Sign information by sign number (1-12)
 */
export function getZodiacSignByNumber(signNumber: number): ZodiacSignInfo | null {
  return ZODIAC_SIGNS[signNumber] || null;
}

/**
 * Get Zodiac Sign by English or Sanskrit name (case-insensitive)
 */
export function getZodiacSignByName(name: string): ZodiacSignInfo | null {
  const normalized = name.trim().toLowerCase();
  for (const sign of Object.values(ZODIAC_SIGNS)) {
    if (
      sign.englishName.toLowerCase() === normalized ||
      sign.sanskritName.toLowerCase() === normalized
    ) {
      return sign;
    }
  }
  return null;
}
