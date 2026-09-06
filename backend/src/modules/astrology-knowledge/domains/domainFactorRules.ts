/**
 * Vedic Astrology Knowledge Layer: Domain Factor Mapping Rules
 * Precise mapping from user life questions/domains to primary & secondary houses, karakas, and timing parameters.
 */

export interface LifeDomainFactorRule {
  domainKey: string;
  domainName: string;
  description: string;
  primaryHouses: number[];
  secondaryHouses: number[];
  primaryKarakas: string[]; // Grahas (e.g. Venus, Jupiter)
  secondaryKarakas: string[];
  divisionalCharts: string[]; // e.g. D1, D9 (Navamsa), D10 (Dasamsa), D7 (Saptamsa)
  keyTimingFactors: {
    primaryDashaLords: string[]; // Lords of primary houses or natural karakas
    criticalTransits: string[]; // e.g. "Jupiter transiting 7th or aspecting 7th lord"
  };
  inquiryClarificationQuestions: {
    en: string;
    hi: string;
    hinglish: string;
  }[];
}

export const DOMAIN_FACTOR_RULES: Record<string, LifeDomainFactorRule> = {
  marriage_timing: {
    domainKey: 'marriage_timing',
    domainName: 'Marriage Timing & Prospects',
    description: 'Timing of marriage, nature of marital alliance, spouse characteristics, and conjugal harmony.',
    primaryHouses: [7],
    secondaryHouses: [2, 11, 4, 8, 12],
    primaryKarakas: ['Venus', 'Jupiter'], // Venus for men, Jupiter/Venus for women
    secondaryKarakas: ['Moon', 'Mars'],
    divisionalCharts: ['D1', 'D9_Navamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['7th Lord', 'Venus', 'Jupiter', 'Lagna Lord', '2nd Lord'],
      criticalTransits: [
        'Jupiter transiting or aspecting the 7th house / 7th lord',
        'Saturn transiting 7th house or aspecting 7th lord (establishing commitment)',
        'Rahu transiting 1-7 axis triggering relationship focus'
      ]
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you currently in a relationship or exploring matchmaking as a single individual?',
        hi: 'क्या आप अभी किसी रिश्ते में हैं या वैवाहिक प्रस्तावों पर विचार कर रहे हैं?',
        hinglish: 'Ek cheez batao—kya aap abhi kisi relationship mein hain ya matchmaking/rishte dekh rahe hain?'
      }
    ]
  },

  love_relationship: {
    domainKey: 'love_relationship',
    domainName: 'Love & Romantic Dynamics',
    description: 'Romantic attraction, emotional compatibility, courtship dynamics, and understanding relationship friction.',
    primaryHouses: [5, 7],
    secondaryHouses: [11, 2, 8],
    primaryKarakas: ['Venus', 'Moon'],
    secondaryKarakas: ['Mars', 'Rahu'],
    divisionalCharts: ['D1', 'D9_Navamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['5th Lord', '7th Lord', 'Venus', 'Moon'],
      criticalTransits: [
        'Jupiter aspecting 5th or 7th house',
        'Venus Gochar through trikonas or kendras'
      ]
    },
    inquiryClarificationQuestions: [
      {
        en: 'How long have you been experiencing this communication gap or emotional distance?',
        hi: 'यह संवाद में दूरी या तनाव कितने समय से महसूस हो रहा है?',
        hinglish: 'Yeh communication gap ya misunderstanding kitne time se chal rahi hai?'
      }
    ]
  },

  career_job_change: {
    domainKey: 'career_job_change',
    domainName: 'Career Growth & Job Transition',
    description: 'Professional status, promotions, job changes, workplace dynamics, and corporate achievement.',
    primaryHouses: [10],
    secondaryHouses: [6, 11, 2, 1],
    primaryKarakas: ['Sun', 'Saturn'],
    secondaryKarakas: ['Mercury', 'Jupiter', 'Mars'],
    divisionalCharts: ['D1', 'D10_Dasamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['10th Lord', '6th Lord', '11th Lord', 'Sun', 'Saturn'],
      criticalTransits: [
        'Jupiter transiting or aspecting the 10th house or 10th lord',
        'Saturn Gochar across 10th or 11th house establishing lasting career structure'
      ]
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you actively seeking a role switch now, or exploring future promotion opportunities?',
        hi: 'क्या आप अभी तुरंत नौकरी बदलने का प्रयास कर रहे हैं या पदोन्नति की संभावना तलाश रहे हैं?',
        hinglish: 'Aap abhi active job switch dekh rahe hain ya current company mein growth/promotion expect kar rahe hain?'
      }
    ]
  },

  business_entrepreneurship: {
    domainKey: 'business_entrepreneurship',
    domainName: 'Business, Trade & Entrepreneurship',
    description: 'Independent enterprise, partnerships, commercial ventures, scaling, and market trade.',
    primaryHouses: [7, 10, 11],
    secondaryHouses: [3, 2, 9],
    primaryKarakas: ['Mercury', 'Sun'],
    secondaryKarakas: ['Mars', 'Jupiter', 'Rahu'],
    divisionalCharts: ['D1', 'D10_Dasamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['7th Lord', '10th Lord', '11th Lord', '3rd Lord', 'Mercury'],
      criticalTransits: [
        'Jupiter aspecting 7th or 11th house',
        'Mercury in strong dignity in Gochar'
      ]
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you planning a solo venture or entering a joint business partnership?',
        hi: 'क्या आप एकल व्यापार की योजना बना रहे हैं या किसी साझेदारी (partnership) में?',
        hinglish: 'Aap solo venture shuru karne ki soch rahe hain ya partnership business?'
      }
    ]
  },

  finance_wealth: {
    domainKey: 'finance_wealth',
    domainName: 'Wealth, Savings & Financial Gains',
    description: 'Accumulation of capital (Dhana), income flow (Labha), investments, and resolving debt.',
    primaryHouses: [2, 11],
    secondaryHouses: [5, 9, 8, 12],
    primaryKarakas: ['Jupiter'],
    secondaryKarakas: ['Venus', 'Mercury', 'Moon'],
    divisionalCharts: ['D1', 'D2_Hora'],
    keyTimingFactors: {
      primaryDashaLords: ['2nd Lord', '11th Lord', '5th Lord', '9th Lord', 'Jupiter'],
      criticalTransits: [
        'Jupiter aspecting 2nd or 11th house',
        'Saturn transiting 11th house (disciplined financial gains)'
      ]
    },
    inquiryClarificationQuestions: [
      {
        en: 'Is your primary focus on increasing regular income, clearing liabilities, or long-term investments?',
        hi: 'क्या आपका मुख्य ध्यान नियमित आय बढ़ाने पर है या निवेश और बचत पर?',
        hinglish: 'Aapka main focus regular income badhane par hai, loan/liabilities clear karne par, ya long-term investments par?'
      }
    ]
  },

  education_higher_studies: {
    domainKey: 'education_higher_studies',
    domainName: 'Education, Higher Learning & Competitive Exams',
    description: 'Foundational learning, academic intellect, university degrees, competitive examinations, and overseas study.',
    primaryHouses: [4, 5, 9],
    secondaryHouses: [6, 12, 1],
    primaryKarakas: ['Mercury', 'Jupiter'],
    secondaryKarakas: ['Sun', 'Rahu'],
    divisionalCharts: ['D1', 'D24_Siddhamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['5th Lord', '9th Lord', '4th Lord', 'Mercury', 'Jupiter'],
      criticalTransits: [
        'Jupiter aspecting 5th or 9th house',
        'Mercury favorable Gochar during exam periods'
      ]
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you preparing for a competitive entrance examination, or planning advanced degrees abroad?',
        hi: 'क्या आप किसी प्रतियोगी परीक्षा की तैयारी कर रहे हैं या उच्च शिक्षा के लिए योजना बना रहे हैं?',
        hinglish: 'Aap kisi competitive exam ki preparation kar rahe hain ya higher studies/abroad admission ke liye?'
      }
    ]
  },

  property_vehicles: {
    domainKey: 'property_vehicles',
    domainName: 'Real Estate, Land & Vehicles',
    description: 'Purchasing real estate, ancestral land, constructing a home, and acquiring vehicles.',
    primaryHouses: [4],
    secondaryHouses: [2, 11, 12],
    primaryKarakas: ['Mars', 'Venus'], // Mars for land, Venus for vehicles/comfort
    secondaryKarakas: ['Moon', 'Saturn'],
    divisionalCharts: ['D1', 'D4_Chaturthamsa', 'D16_Shodashamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['4th Lord', 'Mars', 'Venus'],
      criticalTransits: ['Jupiter or Mars aspecting 4th house']
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you looking to buy a residential home for living, or land as an investment asset?',
        hi: 'क्या आप स्वयं रहने के लिए घर तलाश रहे हैं या निवेश के उद्देश्य से संपत्ति?',
        hinglish: 'Aap khud ke rehne ke liye home purchase dekh rahe hain ya investment purpose se land/property?'
      }
    ]
  },

  relocation_foreign: {
    domainKey: 'relocation_foreign',
    domainName: 'Foreign Travel, Relocation & Settlement',
    description: 'Long-distance travel, overseas job opportunities, citizenship/settlement, and cultural relocation.',
    primaryHouses: [12, 9],
    secondaryHouses: [3, 7, 4],
    primaryKarakas: ['Rahu', 'Moon'],
    secondaryKarakas: ['Jupiter', 'Saturn'],
    divisionalCharts: ['D1', 'D9_Navamsa', 'D12_Dwadasamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['12th Lord', '9th Lord', 'Rahu', '3rd Lord'],
      criticalTransits: ['Rahu or Jupiter activating 9th/12th house']
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you looking for short-term work travel abroad, or long-term permanent settlement?',
        hi: 'क्या आप विदेश में अल्पकालिक कार्य के लिए जा रहे हैं या स्थायी निवास की योजना है?',
        hinglish: 'Aap short-term overseas assignment dekh rahe hain ya permanent PR/settlement?'
      }
    ]
  },

  family_harmony: {
    domainKey: 'family_harmony',
    domainName: 'Family Dynamics & Domestic Harmony',
    description: 'Ancestral lineage, relationships with parents and siblings, home atmosphere, and resolving family friction.',
    primaryHouses: [2, 4],
    secondaryHouses: [3, 9, 11],
    primaryKarakas: ['Moon', 'Jupiter'],
    secondaryKarakas: ['Sun', 'Mars', 'Venus'],
    divisionalCharts: ['D1', 'D12_Dwadasamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['2nd Lord', '4th Lord', 'Moon', 'Jupiter'],
      criticalTransits: ['Jupiter aspecting 2nd or 4th house']
    },
    inquiryClarificationQuestions: [
      {
        en: 'Is this concern related to immediate family relationships, or ancestral/property discussions?',
        hi: 'क्या यह चिंता परिवार के आपसी संबंधों से जुड़ी है या पैतृक मामलों से?',
        hinglish: 'Yeh concern parivaar ke aapsi relations se judi hai ya ancestral/domestic issues se?'
      }
    ]
  },

  health_vitality: {
    domainKey: 'health_vitality',
    domainName: 'Vitality, Constitution & Wellness Guidance',
    description: 'General stamina, mental peace, seasonal routines, and supportive lifestyle alignment (Strictly non-diagnostic).',
    primaryHouses: [1, 6],
    secondaryHouses: [8, 12],
    primaryKarakas: ['Sun', 'Moon'],
    secondaryKarakas: ['Saturn', 'Mars'],
    divisionalCharts: ['D1', 'D3_Drekkana'],
    keyTimingFactors: {
      primaryDashaLords: ['Lagna Lord', '6th Lord', 'Sun', 'Moon'],
      criticalTransits: ['Saturn or Rahu transits over Lagna or Moon']
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you feeling low physical energy and stress, or seeking guidance on mental wellness and routine?',
        hi: 'क्या आप मानसिक तनाव और थकान महसूस कर रहे हैं, या दिनचर्या में सुधार चाहते हैं?',
        hinglish: 'Aap physical stamina aur stress ke baare mein pooch rahe hain ya daily routine aur peace of mind ke liye?'
      }
    ]
  },

  personal_growth_spirituality: {
    domainKey: 'personal_growth_spirituality',
    domainName: 'Self-Realization, Dharma & Spiritual Awakening',
    description: 'Inner life purpose, meditation practices, dharmic path, and overcoming existential confusion.',
    primaryHouses: [1, 9, 12, 5],
    secondaryHouses: [8, 4],
    primaryKarakas: ['Jupiter', 'Ketu', 'Sun'],
    secondaryKarakas: ['Saturn', 'Moon'],
    divisionalCharts: ['D1', 'D20_Vimsamsa'],
    keyTimingFactors: {
      primaryDashaLords: ['9th Lord', '12th Lord', 'Jupiter', 'Ketu'],
      criticalTransits: ['Jupiter transiting 9th or 12th house', 'Ketu transiting Moksha trikonas']
    },
    inquiryClarificationQuestions: [
      {
        en: 'Are you feeling drawn toward meditation and spiritual depth, or seeking clarity on your core life direction?',
        hi: 'क्या आप जीवन के वास्तविक उद्देश्य को समझना चाहते हैं या ध्यान और आत्म-चिंतन में रुचि ले रहे हैं?',
        hinglish: 'Aap apne life purpose aur direction ke baare mein clarity chahte hain ya spiritual practices/meditation ke liye?'
      }
    ]
  }
};

/**
 * Get domain factor rule by domain key
 */
export function getDomainFactorRule(domainKey: string): LifeDomainFactorRule | null {
  return DOMAIN_FACTOR_RULES[domainKey.toLowerCase()] || null;
}

/**
 * Match a raw query / intent to the most relevant LifeDomainFactorRule
 */
export function matchDomainFromQuery(query: string): LifeDomainFactorRule {
  const q = query.toLowerCase();

  if (/shadi|shaadi|marriage|marry|spouse|patni|pati|biwi|husband|wife|rishta|vivah|7th/i.test(q)) {
    return DOMAIN_FACTOR_RULES.marriage_timing!;
  }
  if (/girlfriend|boyfriend|love|breakup|patchup|pyaar|prem|crush|relationship|partner/i.test(q)) {
    return DOMAIN_FACTOR_RULES.love_relationship!;
  }
  if (/business|startup|dukan|vyapar|trade|partnership|freelance|entrepreneur/i.test(q)) {
    return DOMAIN_FACTOR_RULES.business_entrepreneurship!;
  }
  if (/job|career|naukri|promotion|boss|office|salary|interview|resign|10th/i.test(q)) {
    return DOMAIN_FACTOR_RULES.career_job_change!;
  }
  if (/paisa|paise|money|wealth|finance|dhan|investment|debt|karza|saving|rich/i.test(q)) {
    return DOMAIN_FACTOR_RULES.finance_wealth!;
  }
  if (/study|exam|padhai|college|university|degree|education|upsc|gate|result/i.test(q)) {
    return DOMAIN_FACTOR_RULES.education_higher_studies!;
  }
  if (/abroad|foreign|videsh|visa|relocat|settle|canada|us|uk|pr/i.test(q)) {
    return DOMAIN_FACTOR_RULES.relocation_foreign!;
  }
  if (/ghar|makan|flat|property|land|zameen|car|gadi|vehicle/i.test(q)) {
    return DOMAIN_FACTOR_RULES.property_vehicles!;
  }
  if (/family|mummy|papa|bhai|behan|parivar|parents|mother|father|sister|brother/i.test(q)) {
    return DOMAIN_FACTOR_RULES.family_harmony!;
  }
  if (/health|tabiyat|sehat|bimari|illness|vitality|energy|depression|stress/i.test(q)) {
    return DOMAIN_FACTOR_RULES.health_vitality!;
  }

  // Default to career or personal growth
  return DOMAIN_FACTOR_RULES.career_job_change!;
}
