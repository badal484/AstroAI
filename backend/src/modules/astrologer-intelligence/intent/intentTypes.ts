export const CoreIntent = {
  // Marriage & Relationships
  MARRIAGE_TIMING: 'MARRIAGE_TIMING',
  MARRIAGE_PROSPECTS: 'MARRIAGE_PROSPECTS',
  PARTNER_CHARACTERISTICS: 'PARTNER_CHARACTERISTICS',
  RELATIONSHIP_CURRENT_SITUATION: 'RELATIONSHIP_CURRENT_SITUATION',
  RELATIONSHIP_CONFLICT: 'RELATIONSHIP_CONFLICT',
  BREAKUP: 'BREAKUP',
  RELATIONSHIP_COMPATIBILITY: 'RELATIONSHIP_COMPATIBILITY',
  LOVE_LIFE: 'LOVE_LIFE',

  // Career & Work
  CAREER_GENERAL: 'CAREER_GENERAL',
  CAREER_TIMING: 'CAREER_TIMING',
  CAREER_DECISION: 'CAREER_DECISION',
  JOB_CHANGE: 'JOB_CHANGE',
  PROMOTION_GROWTH: 'PROMOTION_GROWTH',
  BUSINESS_VENTURE: 'BUSINESS_VENTURE',

  // Finances & Wealth
  FINANCE_GENERAL: 'FINANCE_GENERAL',
  WEALTH_TIMING: 'WEALTH_TIMING',
  DEBT_EXPENSES: 'DEBT_EXPENSES',
  INVESTMENT_GUIDANCE: 'INVESTMENT_GUIDANCE',

  // Compound & Special
  COMPOUND_MARRIAGE_CAREER: 'COMPOUND_MARRIAGE_CAREER',
  EDUCATION_HIGHER_STUDIES: 'EDUCATION_HIGHER_STUDIES',
  FOREIGN_TRAVEL_SETTLEMENT: 'FOREIGN_TRAVEL_SETTLEMENT',
  HEALTH_VITALITY: 'HEALTH_VITALITY',
  PROPERTY_VEHICLE: 'PROPERTY_VEHICLE',
  DAILY_LUCKY_FACT: 'DAILY_LUCKY_FACT',
  TODAY_GUIDANCE: 'TODAY_GUIDANCE',
  MEMORY_RECALL_QUERY: 'MEMORY_RECALL_QUERY',

  // General & Vedic
  GENERAL_LIFE_READING: 'GENERAL_LIFE_READING',
  PERIOD_FORECAST_6M: 'PERIOD_FORECAST_6M',
  PERIOD_FORECAST_1Y: 'PERIOD_FORECAST_1Y',
  DAILY_HOROSCOPE: 'DAILY_HOROSCOPE',
  DASHA_ANALYSIS: 'DASHA_ANALYSIS',
  REMEDIES_UPAY: 'REMEDIES_UPAY',
  GREETING_INTAKE: 'GREETING_INTAKE',
  SHORT_ACKNOWLEDGMENT: 'SHORT_ACKNOWLEDGMENT',
  AMBIGUOUS_EMOTION: 'AMBIGUOUS_EMOTION',
  CASUAL_CHAT: 'CASUAL_CHAT',

  // Safety & Guardrails
  MEDICAL_QUERY: 'MEDICAL_QUERY',
  CRISIS_SELF_HARM: 'CRISIS_SELF_HARM',
  UNSAFE_PREDICTION: 'UNSAFE_PREDICTION',
} as const;

export type CoreIntent = (typeof CoreIntent)[keyof typeof CoreIntent];

export type AstrologyRelevance =
  | 'REQUIRED'      // Direct astrology / timing query needing chart facts
  | 'USEFUL'        // Life situation query where astrology adds supportive perspective
  | 'OPTIONAL'      // Daily fact / general advice
  | 'NOT_RELEVANT'  // Greetings, acknowledgments, casual conversational chat
  | 'AMBIGUOUS';    // Vague or emotional statement needing clarification first

export type BirthProfileState =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'MISSING'
  | 'UNKNOWN_TIME'
  | 'INVALID'
  | 'NEEDS_CONFIRMATION';

export type ConsultationMode =
  | 'CASUAL'
  | 'DISCOVERY'
  | 'QUICK_READING'
  | 'STANDARD_READING'
  | 'DEEP_READING'
  | 'TIMING_READING'
  | 'RELATIONSHIP_CONSULTATION'
  | 'CAREER_CONSULTATION'
  | 'MARRIAGE_CONSULTATION'
  | 'COMPATIBILITY'
  | 'FOLLOW_UP';

export interface DetectedIntents {
  primary: CoreIntent;
  secondary: CoreIntent[];
  isAstrologySpecific: boolean;
  astrologyRelevance: AstrologyRelevance;
  requiresClarification: boolean;
  confidence: number;
  entities?: string[];
  requestedTimeframe?: string;
  emotionalTone?: string;
}

export type AstrologyIntent = CoreIntent;

export interface ConsultationIntent {
  primaryIntent: AstrologyIntent;
  secondaryIntents: AstrologyIntent[];
  confidence: number;
  entities: string[];
  astrologyRelevance: AstrologyRelevance;
  requestedTimeframe?: string;
  emotionalTone?: string;
  requiresChartAnalysis: boolean;
  requiresTimingAnalysis: boolean;
  requiresFollowUp: boolean;
}
