/**
 * Vedic Astrology Knowledge Layer: Classical Yogas (Planetary Combinations)
 * Classical Parashari and Jaimini combinations, forming rules, cancellations, and domain impacts.
 */

export type YogaCategory = 'Raja' | 'Dhana' | 'Mahapurusha' | 'Auspicious' | 'Viparita' | 'Dosha_Challenge';

export interface VedicYogaDefinition {
  id: string;
  sanskritName: string;
  englishName: string;
  category: YogaCategory;
  classicalSource: string; // e.g. "Brihat Parashara Hora Shastra, Ch. 34"
  formingConditionDescription: string;
  cancellationConditions: string[];
  lifeDomainsAffected: ('Career' | 'Wealth' | 'Marriage' | 'Intellect' | 'Spirituality' | 'Status' | 'Health')[];
  primaryEffects: string[];
  activationTiming: string; // When the yoga primarily manifests (e.g. Mahadasha/Antardasha of participating grahas)
  cautionNotes?: string[];
}

export const VEDIC_YOGAS: Record<string, VedicYogaDefinition> = {
  gajakesari: {
    id: 'gajakesari',
    sanskritName: 'Gajakesari Yoga',
    englishName: 'Elephant-Lion Combination (Royal Wisdom & Respect)',
    category: 'Auspicious',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'Jupiter occupies a Kendra (1st, 4th, 7th, or 10th house) from the Moon, free from deep combustion and severe malefic afflictions.',
    cancellationConditions: [
      'Jupiter or Moon is debilitated without Neechabhanga',
      'Jupiter is closely combust by the Sun within 3 degrees',
      'Moon is severely afflicted by Rahu/Ketu in the 6th/8th/12th from Lagna'
    ],
    lifeDomainsAffected: ['Status', 'Intellect', 'Spirituality', 'Career'],
    primaryEffects: [
      'Lasting reputation, noble character, scholarly or administrative respect',
      'Natural mentorship qualities and moral authority in one’s community',
      'Emotional resilience through dharmic wisdom and philosophical optimism'
    ],
    activationTiming: 'Mahadasha or Antardasha of Jupiter or Moon, especially when transiting benefic kendras.'
  },

  budhaditya: {
    id: 'budhaditya',
    sanskritName: 'Budhaditya Yoga',
    englishName: 'Sun-Mercury Conjunction of Supreme Intellect',
    category: 'Auspicious',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'Sun and Mercury conjunct in the same house, particularly potent in the 1st, 5th, 9th, 10th, or 11th houses.',
    cancellationConditions: [
      'Mercury is at exact zero degrees or deep combustion within 3 degrees of Sun without dignity',
      'Conjunction occurs in 6th, 8th, or 12th house under heavy malefic affliction'
    ],
    lifeDomainsAffected: ['Intellect', 'Career', 'Status'],
    primaryEffects: [
      'Sharp analytical intellect, executive communication skills, administrative acumen',
      'Capacity to analyze complex data, mathematical and commercial talent',
      'Honor in government, academia, or intellectual leadership'
    ],
    activationTiming: 'Mahadasha/Antardasha of Sun or Mercury.'
  },

  ruchaka: {
    id: 'ruchaka',
    sanskritName: 'Ruchaka Yoga',
    englishName: 'Pancha Mahapurusha Yoga of Mars',
    category: 'Mahapurusha',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'Mars occupies a Kendra house (1, 4, 7, 10) in its own sign (Aries, Scorpio) or exaltation sign (Capricorn).',
    cancellationConditions: ['Mars is afflicted by Saturn/Rahu without benefic aspect, or conjunct the Sun in exact combustion.'],
    lifeDomainsAffected: ['Career', 'Status', 'Health'],
    primaryEffects: [
      'Exceptional courage, leadership, physical vitality, command over land/machinery',
      'Pioneering executive authority, prowess in engineering, surgery, defense, or entrepreneurship'
    ],
    activationTiming: 'Mars Mahadasha/Antardasha.'
  },

  bhadra: {
    id: 'bhadra',
    sanskritName: 'Bhadra Yoga',
    englishName: 'Pancha Mahapurusha Yoga of Mercury',
    category: 'Mahapurusha',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'Mercury occupies a Kendra house (1, 4, 7, 10) in its own sign (Gemini) or exaltation sign (Virgo).',
    cancellationConditions: ['Mercury is heavily afflicted by functional malefics or combust.'],
    lifeDomainsAffected: ['Intellect', 'Career', 'Wealth'],
    primaryEffects: [
      'Profound intellectual eloquence, commercial genius, mathematical brilliance',
      'Longevity, youthful charisma, success in writing, diplomacy, and trade'
    ],
    activationTiming: 'Mercury Mahadasha/Antardasha.'
  },

  hamsa: {
    id: 'hamsa',
    sanskritName: 'Hamsa Yoga',
    englishName: 'Pancha Mahapurusha Yoga of Jupiter (Swan of Divine Wisdom)',
    category: 'Mahapurusha',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'Jupiter occupies a Kendra house (1, 4, 7, 10) in its own sign (Sagittarius, Pisces) or exaltation sign (Cancer).',
    cancellationConditions: ['Jupiter is severely afflicted or combust.'],
    lifeDomainsAffected: ['Spirituality', 'Status', 'Intellect', 'Wealth'],
    primaryEffects: [
      'Revered spiritual and ethical standing, profound philosophical discernment',
      'Natural benevolence, success as a mentor, counselor, judge, or dharmic scholar'
    ],
    activationTiming: 'Jupiter Mahadasha/Antardasha.'
  },

  malavya: {
    id: 'malavya',
    sanskritName: 'Malavya Yoga',
    englishName: 'Pancha Mahapurusha Yoga of Venus',
    category: 'Mahapurusha',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'Venus occupies a Kendra house (1, 4, 7, 10) in its own sign (Taurus, Libra) or exaltation sign (Pisces).',
    cancellationConditions: ['Venus is afflicted or combust.'],
    lifeDomainsAffected: ['Wealth', 'Marriage', 'Career', 'Status'],
    primaryEffects: [
      'Refined aesthetic mastery, wealth, marital fulfillment, gracious magnetism',
      'Success in creative industries, luxury enterprises, arts, and diplomacy'
    ],
    activationTiming: 'Venus Mahadasha/Antardasha.'
  },

  sasa: {
    id: 'sasa',
    sanskritName: 'Sasa Yoga',
    englishName: 'Pancha Mahapurusha Yoga of Saturn',
    category: 'Mahapurusha',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'Saturn occupies a Kendra house (1, 4, 7, 10) in its own sign (Capricorn, Aquarius) or exaltation sign (Libra).',
    cancellationConditions: ['Saturn is afflicted by Mars/Sun without benefic support.'],
    lifeDomainsAffected: ['Career', 'Status', 'Wealth'],
    primaryEffects: [
      'Command over masses, enduring strategic patience, monumental institution-building',
      'Success in large-scale industries, governance, judiciary, and grassroots leadership'
    ],
    activationTiming: 'Saturn Mahadasha/Antardasha, often maturing after age 36.'
  },

  viparita_harsha: {
    id: 'viparita_harsha',
    sanskritName: 'Harsha Viparita Raja Yoga',
    englishName: 'Harsha Yoga of Victory over Adversity',
    category: 'Viparita',
    classicalSource: 'Phaladeepika, Ch. 6',
    formingConditionDescription: 'The 6th lord is situated in the 6th, 8th, or 12th house, without being associated with or aspected by Kendra/Trikona lords.',
    cancellationConditions: ['The 6th lord is conjunct the Lagna lord or 9th/10th lords.'],
    lifeDomainsAffected: ['Career', 'Health', 'Status'],
    primaryEffects: [
      'Complete victory over adversaries, capacity to overcome legal/financial hurdles',
      'Immunity against hidden obstacles and sudden rise during challenging circumstances'
    ],
    activationTiming: 'Dasha/Antardasha of the 6th lord.'
  },

  viparita_sarala: {
    id: 'viparita_sarala',
    sanskritName: 'Sarala Viparita Raja Yoga',
    englishName: 'Sarala Yoga of Fearlessness and Hidden Wealth',
    category: 'Viparita',
    classicalSource: 'Phaladeepika, Ch. 6',
    formingConditionDescription: 'The 8th lord is placed in the 6th, 8th, or 12th house, unafflicted by Kendra/Trikona lords.',
    cancellationConditions: ['8th lord is conjunct benefic Kendra lords.'],
    lifeDomainsAffected: ['Wealth', 'Health', 'Spirituality'],
    primaryEffects: [
      'Longevity, resolute fearlessness, sudden unexpected inheritance or financial turnaround',
      'Scholarly interest in deep research and occult sciences'
    ],
    activationTiming: 'Dasha/Antardasha of the 8th lord.'
  },

  viparita_vimala: {
    id: 'viparita_vimala',
    sanskritName: 'Vimala Viparita Raja Yoga',
    englishName: 'Vimala Yoga of Clean Conduct and Independence',
    category: 'Viparita',
    classicalSource: 'Phaladeepika, Ch. 6',
    formingConditionDescription: 'The 12th lord is placed in the 6th, 8th, or 12th house.',
    cancellationConditions: ['12th lord is conjunct Lagna or Kendra lords.'],
    lifeDomainsAffected: ['Wealth', 'Spirituality', 'Career'],
    primaryEffects: [
      'Financial thriftiness, accumulation of wealth through foreign connections or solitary pursuits',
      'Noble, unpretentious conduct and spiritual independence'
    ],
    activationTiming: 'Dasha/Antardasha of the 12th lord.'
  },

  neechabhanga_raja: {
    id: 'neechabhanga_raja',
    sanskritName: 'Neechabhanga Raja Yoga',
    englishName: 'Cancellation of Debilitation to Royal Elevation',
    category: 'Raja',
    classicalSource: 'Brihat Parashara Hora Shastra',
    formingConditionDescription: 'A debilitated planet has its dispositor (or the exaltation lord of that sign) in a Kendra from Lagna or Moon, or the debilitated planet is aspected by its dispositor.',
    cancellationConditions: ['Both the planet and its dispositor are severely combust without strength.'],
    lifeDomainsAffected: ['Career', 'Status', 'Wealth'],
    primaryEffects: [
      'Initial struggle, humility, or adversity followed by monumental elevation and high achievement',
      'Deep empathetic understanding of hardship which becomes the foundation of mature success'
    ],
    activationTiming: 'Dasha/Antardasha of the debilitated planet or its dispositor (typically flourishes in mature years).'
  },

  manglik_kuja: {
    id: 'manglik_kuja',
    sanskritName: 'Kuja Dosha / Manglik Consideration',
    englishName: 'Mars Placement in Relationship Bhavas',
    category: 'Dosha_Challenge',
    classicalSource: 'Brihat Parashara Hora Shastra & Muhurta Chintamani',
    formingConditionDescription: 'Mars is situated in the 1st, 2nd, 4th, 7th, 8th, or 12th house from Lagna, Moon, or Venus.',
    cancellationConditions: [
      'Mars is in its own sign (Aries, Scorpio) or exalted (Capricorn)',
      'Mars is in the 1st house in Aries, 4th in Scorpio, 7th in Capricorn/Cancer, 8th in Sagittarius/Pisces, or 12th in Taurus/Libra',
      'Jupiter aspects Mars or is conjunct with Mars',
      'Partner also has equivalent Mars placement (Dosha Samyam)',
      'Native is past age 28-30 where Mars energy naturally matures'
    ],
    lifeDomainsAffected: ['Marriage'],
    primaryEffects: [
      'High passion, direct assertiveness, intolerance of passivity in partnerships',
      'Requires conscious communication and emotional maturity before commitment'
    ],
    activationTiming: 'Mars Mahadasha/Antardasha or transits over 7th/8th house.',
    cautionNotes: [
      'Must never be treated as a fatalistic curse or guarantee of divorce',
      'Over 60% of charts have Kuja Dosha with classical cancellations'
    ]
  }
};

/**
 * Get Vedic Yoga definition by ID
 */
export function getVedicYogaById(id: string): VedicYogaDefinition | null {
  return VEDIC_YOGAS[id.toLowerCase()] || null;
}

/**
 * Get all Yogas matching a specific life domain
 */
export function getYogasByDomain(domain: 'Career' | 'Wealth' | 'Marriage' | 'Intellect' | 'Spirituality' | 'Status' | 'Health'): VedicYogaDefinition[] {
  return Object.values(VEDIC_YOGAS).filter(yoga => yoga.lifeDomainsAffected.includes(domain));
}
