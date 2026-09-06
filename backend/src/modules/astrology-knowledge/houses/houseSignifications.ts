/**
 * Vedic House Significations (Bhava Karakatwas)
 */

export interface HouseSignification {
  houseNumber: number;
  sanskritName: string;
  traditionalLabel: string;
  category: ('KENDRA' | 'TRIKONA' | 'DUSTHANA' | 'UPACHAYA' | 'MARAKA' | 'DHANA' | 'MOKSHA')[];
  primarySignifications: string[];
  naturalKaraka: string;
  bodyParts: string[];
  lifeThemes: string[];
}

export const HOUSE_SIGNIFICATIONS: Record<number, HouseSignification> = {
  1: {
    houseNumber: 1,
    sanskritName: 'Tanu Bhava',
    traditionalLabel: 'Lagna (Self & Physical Constitution)',
    category: ['KENDRA', 'TRIKONA'],
    primarySignifications: ['Self', 'Physical constitution', 'Temperament', 'Vitality', 'Appearance', 'Overall life orientation'],
    naturalKaraka: 'Sun',
    bodyParts: ['Head', 'Brain', 'Overall physique'],
    lifeThemes: ['Personal identity', 'Self-confidence', 'Physical health', 'General destiny trajectory'],
  },
  2: {
    houseNumber: 2,
    sanskritName: 'Dhana Bhava',
    traditionalLabel: 'Wealth, Family & Speech',
    category: ['DHANA', 'MARAKA'],
    primarySignifications: ['Accumulated wealth (Savings)', 'Family lineage (Kula)', 'Speech & Voice', 'Food habits', 'Early childhood values'],
    naturalKaraka: 'Jupiter',
    bodyParts: ['Face', 'Mouth', 'Throat', 'Right eye', 'Teeth'],
    lifeThemes: ['Financial liquidity', 'Family support', 'Communication tone', 'Material security'],
  },
  3: {
    houseNumber: 3,
    sanskritName: 'Bhratri / Sahaja Bhava',
    traditionalLabel: 'Courage, Siblings & Effort',
    category: ['UPACHAYA'],
    primarySignifications: ['Courage & Valor', 'Younger siblings', 'Short travels', 'Manual skills', 'Initiative', 'Self-effort (Parakrama)'],
    naturalKaraka: 'Mars',
    bodyParts: ['Arms', 'Shoulders', 'Hands', 'Ears', 'Nervous energy'],
    lifeThemes: ['Personal initiative', 'Writing & media', 'Skill development', 'Siblings connection'],
  },
  4: {
    houseNumber: 4,
    sanskritName: 'Sukha / Matri Bhava',
    traditionalLabel: 'Home, Mother & Emotional Peace',
    category: ['KENDRA', 'MOKSHA'],
    primarySignifications: ['Mother (Matri)', 'Home & Real Estate', 'Vehicles (Vahana)', 'Internal happiness (Sukha)', 'Formal education foundations'],
    naturalKaraka: 'Moon',
    bodyParts: ['Chest', 'Heart', 'Lungs'],
    lifeThemes: ['Domestic peace', 'Real estate purchases', 'Mother relationship', 'Emotional roots'],
  },
  5: {
    houseNumber: 5,
    sanskritName: 'Putra / Purva Punya Bhava',
    traditionalLabel: 'Children, Intellect & Romance',
    category: ['TRIKONA'],
    primarySignifications: ['Purva Punya (Past-life merits)', 'Children', 'Creative intelligence', 'Romantic affairs', 'Speculative gains', 'Mantras & spiritual practices'],
    naturalKaraka: 'Jupiter',
    bodyParts: ['Stomach', 'Upper abdomen', 'Heart intellect'],
    lifeThemes: ['Creative talent', 'Romantic attachments', 'Higher mental intuition', 'Children upbringing'],
  },
  6: {
    houseNumber: 6,
    sanskritName: 'Ari / Shatru Bhava',
    traditionalLabel: 'Debts, Diseases & Daily Work',
    category: ['DUSTHANA', 'UPACHAYA'],
    primarySignifications: ['Obstacles & Enemies', 'Debts (Rina)', 'Diseases & Immunity', 'Litigation', 'Competitive exams', 'Service & Daily routines'],
    naturalKaraka: 'Mars',
    bodyParts: ['Digestive tract', 'Intestines', 'Kidney region'],
    lifeThemes: ['Workplace service', 'Overcoming competitive hurdles', 'Health discipline', 'Financial liabilities'],
  },
  7: {
    houseNumber: 7,
    sanskritName: 'Kalatra / Yuvati Bhava',
    traditionalLabel: 'Marriage, Spouse & Business Partnerships',
    category: ['KENDRA', 'MARAKA'],
    primarySignifications: ['Marriage & Spouse', 'Long-term commitments', 'Business partners', 'Public relations', 'Legal contracts'],
    naturalKaraka: 'Venus',
    bodyParts: ['Lower abdomen', 'Pelvic area', 'Reproductive organs'],
    lifeThemes: ['Marital harmony', 'Partner traits', 'Business collaboration', 'Public standing'],
  },
  8: {
    houseNumber: 8,
    sanskritName: 'Randhra / Ayur Bhava',
    traditionalLabel: 'Longevity, Transformation & Occult',
    category: ['DUSTHANA', 'MOKSHA'],
    primarySignifications: ['Longevity (Ayus)', 'Sudden transformations', 'Unearned wealth (Inheritance, Insurance)', 'Occult / Deep research', 'Hidden truths'],
    naturalKaraka: 'Saturn',
    bodyParts: ['Excretory organs', 'Chronic vitality reserves'],
    lifeThemes: ['Psychological depth', 'Major life transitions', 'Inheritance / Joint finances', 'Mystic wisdom'],
  },
  9: {
    houseNumber: 9,
    sanskritName: 'Bhagya / Dharma Bhava',
    traditionalLabel: 'Fortune, Higher Dharma & Mentorship',
    category: ['TRIKONA'],
    primarySignifications: ['Fortune (Bhagya)', 'Dharma & Ethics', 'Guru & Father figure', 'Higher philosophical education', 'Long-distance spiritual journeys'],
    naturalKaraka: 'Jupiter',
    bodyParts: ['Thighs', 'Hips', 'Arterial flow'],
    lifeThemes: ['Divine grace', 'Higher university studies', 'Spiritual pilgrimage', 'Mentorship guidance'],
  },
  10: {
    houseNumber: 10,
    sanskritName: 'Karma Bhava',
    traditionalLabel: 'Career, Authority & Public Status',
    category: ['KENDRA', 'UPACHAYA'],
    primarySignifications: ['Profession (Karma)', 'Public status & Authority', 'Leadership', 'Achievements', 'Reputation (Kirti)', 'Father / Executive authority'],
    naturalKaraka: 'Sun',
    bodyParts: ['Knees', 'Spine', 'Structural joints'],
    lifeThemes: ['Career promotions', 'Professional authority', 'Public contributions', 'Vocation mastery'],
  },
  11: {
    houseNumber: 11,
    sanskritName: 'Labha / Aya Bhava',
    traditionalLabel: 'Gains, Income & Aspirations',
    category: ['UPACHAYA', 'DHANA'],
    primarySignifications: ['Financial gains (Labha)', 'Income streams', 'Fulfilment of wishes', 'Elder siblings', 'Social networks & Friends'],
    naturalKaraka: 'Jupiter',
    bodyParts: ['Calves', 'Shins', 'Left ear'],
    lifeThemes: ['Salary increments', 'Long-term aspirations', 'Community influence', 'Multiple income channels'],
  },
  12: {
    houseNumber: 12,
    sanskritName: 'Vyaya / Moksha Bhava',
    traditionalLabel: 'Foreign Lands, Expenses & Spiritual Liberation',
    category: ['DUSTHANA', 'MOKSHA'],
    primarySignifications: ['Expenses (Vyaya)', 'Foreign settlement & Overseas travel', 'Spiritual liberation (Moksha)', 'Subconscious / Sleep', 'Hospitals / Ashrams'],
    naturalKaraka: 'Saturn',
    bodyParts: ['Feet', 'Left eye', 'Subconscious sleep state'],
    lifeThemes: ['Relocation abroad', 'Spiritual introspection', 'Budgeting & outflows', 'Solitude and retreat'],
  },
};

/**
 * Retrieve house signification by house number (1 to 12)
 */
export function getHouseSignification(houseNumber: number): HouseSignification | null {
  return HOUSE_SIGNIFICATIONS[houseNumber] || null;
}

/**
 * Retrieve all 12 house significations
 */
export function getAllHouseSignifications(): HouseSignification[] {
  return Object.values(HOUSE_SIGNIFICATIONS);
}
