import { CoreIntent } from '../intent/intentTypes';

export interface TopicAstrologyMapping {
  primaryHouses: number[];
  secondaryHouses: number[];
  keyPlanets: string[];
  timingIndicators: string[];
  remedyFocus: string[];
  prohibitedDomains?: string[];
}

export const TOPIC_MAPPINGS: Record<string, TopicAstrologyMapping> = {
  MARRIAGE: {
    primaryHouses: [7],
    secondaryHouses: [2, 5, 11],
    keyPlanets: ['Venus', 'Jupiter', 'Mars'],
    timingIndicators: ['Jupiter 7th aspect', 'Venus Dasha/Antardasha', '7th Lord transit'],
    remedyFocus: ['Goddess Lakshmi on Fridays', 'Lord Shiva on Thursdays', 'White sweets donation'],
    prohibitedDomains: ['career', 'job_change', 'business_venture'],
  },
  RELATIONSHIP_CONFLICT: {
    primaryHouses: [7, 5],
    secondaryHouses: [1, 8, 12],
    keyPlanets: ['Venus', 'Moon', 'Mars'],
    timingIndicators: ['Moon transit', 'Mars transit aspect', 'Venus position', 'Active Antardasha'],
    remedyFocus: ['Shiv-Parvati prayer for harmony', 'Om Namah Shivaya meditation', 'Gentle dialogue'],
    prohibitedDomains: ['career', 'business_growth', 'financial_investments'],
  },
  CAREER: {
    primaryHouses: [10],
    secondaryHouses: [2, 6, 11],
    keyPlanets: ['Sun', 'Saturn', 'Jupiter', 'Mercury'],
    timingIndicators: ['10th house transit', 'Sun/Saturn periods', 'Jupiter 10th aspect'],
    remedyFocus: ['Surya Arghya with Gayatri Mantra', 'Saturday oil lamp / service', 'Ganesh Puja'],
    prohibitedDomains: ['marriage_delay', 'breakup'],
  },
  FINANCE: {
    primaryHouses: [2, 11],
    secondaryHouses: [5, 9, 12],
    keyPlanets: ['Jupiter', 'Mercury', 'Venus'],
    timingIndicators: ['2nd/11th lord transit', 'Dhana yoga periods', 'Jupiter aspect on 2nd'],
    remedyFocus: ['Lord Ganesha with Durva', 'Lakshmi Narayan puja', 'North direction decluttering'],
    prohibitedDomains: ['marriage', 'relationship_conflict'],
  },
  RELATIONSHIP: {
    primaryHouses: [5, 7],
    secondaryHouses: [11, 12],
    keyPlanets: ['Venus', 'Moon', 'Mars'],
    timingIndicators: ['5th/7th lord transit', 'Moon transit', 'Venus transit'],
    remedyFocus: ['Shukra Mantra', 'Shiv Parvati Puja', 'Chandan tilak'],
    prohibitedDomains: ['career', 'job_change'],
  },
  COMPOUND_MARRIAGE_CAREER: {
    primaryHouses: [7, 10],
    secondaryHouses: [2, 11],
    keyPlanets: ['Venus', 'Sun', 'Jupiter', 'Saturn'],
    timingIndicators: ['7th/10th house connection', 'Jupiter aspect on 7th and 10th', 'Dasha alignment'],
    remedyFocus: ['Shiv-Parvati Puja', 'Surya Arghya with Gayatri Mantra'],
  },
  EDUCATION: {
    primaryHouses: [9, 4],
    secondaryHouses: [5, 12],
    keyPlanets: ['Jupiter', 'Mercury', 'Rahu'],
    timingIndicators: ['9th lord transit', 'Jupiter aspect on 9th/4th', 'Mercury sub-period'],
    remedyFocus: ['Saraswati Vandana on Wednesdays', 'Morning Gayatri Mantra 108 jaap'],
  },
  FOREIGN_TRAVEL: {
    primaryHouses: [9, 12],
    secondaryHouses: [3, 4],
    keyPlanets: ['Rahu', 'Moon', 'Jupiter', 'Saturn'],
    timingIndicators: ['12th house activation', 'Rahu/Jupiter periods', '9th/12th Lord transit'],
    remedyFocus: ['Hanuman Chalisa recitation', 'Feeding birds on Saturdays'],
  },
  HEALTH_VITALITY: {
    primaryHouses: [1, 6],
    secondaryHouses: [8, 12],
    keyPlanets: ['Sun', 'Moon', 'Saturn', 'Mars'],
    timingIndicators: ['Lagna Lord strength', '6th lord transit', 'Sun transit'],
    remedyFocus: ['Surya Namaskar at sunrise', 'Maha Mrityunjaya Mantra meditation', 'Sattvic lifestyle'],
  },
  PROPERTY_VEHICLE: {
    primaryHouses: [4],
    secondaryHouses: [2, 11, 12],
    keyPlanets: ['Mars', 'Venus', 'Saturn'],
    timingIndicators: ['4th house transit', 'Mars/Venus sub-periods', '4th lord transit'],
    remedyFocus: ['Hanuman Puja on Tuesdays', 'Lakshmi Puja on Fridays'],
  },
  GENERAL: {
    primaryHouses: [1, 5, 9],
    secondaryHouses: [2, 11],
    keyPlanets: ['Sun', 'Moon', 'Jupiter'],
    timingIndicators: ['Lagna Lord transit', 'Mahadasha shift'],
    remedyFocus: ['Om Namah Shivaya meditation', 'Morning Gayatri Mantra', 'Hanuman Chalisa'],
  },
};

export const DEFAULT_TOPIC_MAPPING: TopicAstrologyMapping = {
  primaryHouses: [1, 5, 9],
  secondaryHouses: [2, 11],
  keyPlanets: ['Sun', 'Moon', 'Jupiter'],
  timingIndicators: ['Lagna Lord transit', 'Mahadasha shift'],
  remedyFocus: ['Om Namah Shivaya meditation', 'Morning Gayatri Mantra', 'Hanuman Chalisa'],
};

export function getTopicMapping(topic: string): TopicAstrologyMapping {
  return TOPIC_MAPPINGS[topic] ?? DEFAULT_TOPIC_MAPPING;
}

export function resolveTopicFromIntent(intent: CoreIntent): string {
  if (intent === CoreIntent.COMPOUND_MARRIAGE_CAREER) {
    return 'COMPOUND_MARRIAGE_CAREER';
  }
  if (
    intent === CoreIntent.MARRIAGE_TIMING ||
    intent === CoreIntent.MARRIAGE_PROSPECTS ||
    intent === CoreIntent.PARTNER_CHARACTERISTICS
  ) {
    return 'MARRIAGE';
  }
  if (
    intent === CoreIntent.RELATIONSHIP_CONFLICT ||
    intent === CoreIntent.BREAKUP
  ) {
    return 'RELATIONSHIP_CONFLICT';
  }
  if (
    intent === CoreIntent.CAREER_GENERAL ||
    intent === CoreIntent.CAREER_TIMING ||
    intent === CoreIntent.CAREER_DECISION ||
    intent === CoreIntent.JOB_CHANGE ||
    intent === CoreIntent.PROMOTION_GROWTH ||
    intent === CoreIntent.BUSINESS_VENTURE
  ) {
    return 'CAREER';
  }
  if (
    intent === CoreIntent.FINANCE_GENERAL ||
    intent === CoreIntent.WEALTH_TIMING ||
    intent === CoreIntent.DEBT_EXPENSES ||
    intent === CoreIntent.INVESTMENT_GUIDANCE
  ) {
    return 'FINANCE';
  }
  if (
    intent === CoreIntent.RELATIONSHIP_CURRENT_SITUATION ||
    intent === CoreIntent.RELATIONSHIP_COMPATIBILITY ||
    intent === CoreIntent.LOVE_LIFE
  ) {
    return 'RELATIONSHIP';
  }
  if (intent === CoreIntent.EDUCATION_HIGHER_STUDIES) {
    return 'EDUCATION';
  }
  if (intent === CoreIntent.FOREIGN_TRAVEL_SETTLEMENT) {
    return 'FOREIGN_TRAVEL';
  }
  if (intent === CoreIntent.HEALTH_VITALITY) {
    return 'HEALTH_VITALITY';
  }
  if (intent === CoreIntent.PROPERTY_VEHICLE) {
    return 'PROPERTY_VEHICLE';
  }
  return 'GENERAL';
}
