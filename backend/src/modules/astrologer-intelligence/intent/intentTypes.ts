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

  // Family & Wellbeing
  FAMILY_MATTERS: 'FAMILY_MATTERS',

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
  PHYSICAL_INCIDENT: 'PHYSICAL_INCIDENT',
  PRACTICAL_LIFE_EVENT: 'PRACTICAL_LIFE_EVENT',

  // Conversational Intelligence & Flow
  FRUSTRATION_OR_ABUSE: 'FRUSTRATION_OR_ABUSE',
  DISMISSAL_OR_END: 'DISMISSAL_OR_END',
  CONTINUATION_PROMPT: 'CONTINUATION_PROMPT',
  FOLLOW_UP_INTERROGATIVE: 'FOLLOW_UP_INTERROGATIVE',

  // Edge Cases & Behavioral Guardrails
  SKEPTICISM_OR_TEST: 'SKEPTICISM_OR_TEST',
  JAILBREAK_OR_SYSTEM_PROMPT: 'JAILBREAK_OR_SYSTEM_PROMPT',
  SUPERSTITION_FEAR: 'SUPERSTITION_FEAR',
  SPECULATIVE_GAMBLING: 'SPECULATIVE_GAMBLING',
  THIRD_PARTY_QUERY: 'THIRD_PARTY_QUERY',

  // Round 4 Adversarial & Challenging Conversational Intents
  PREVIOUS_ANSWER_CHALLENGE: 'PREVIOUS_ANSWER_CHALLENGE', // "Tumne last time kuch aur bola tha", "Pichli baar 2027 bola tha"
  GENERIC_ANSWER_CHALLENGE: 'GENERIC_ANSWER_CHALLENGE',   // "Ye generic lag raha hai", "Sabko yahi bolte ho"
  SARCASM_OR_MOCKERY: 'SARCASM_OR_MOCKERY',               // "Wah kya answer diya", "Ye toh google pe bhi mil jayega"
  SHORT_ANSWER_DEMAND: 'SHORT_ANSWER_DEMAND',             // "Seedha answer de", "Bas yes ya no", "Short mein bata"
  CERTAINTY_DEMAND: 'CERTAINTY_DEMAND',                   // "Pakka bata", "100% guarantee hai kya", "Exact date bata"
  CONTRADICTION_CORRECTION: 'CONTRADICTION_CORRECTION',   // "Actually birth time 10:30 nahi 11:15 tha", "Girlfriend nahi ex hai"

  // Safety & Guardrails
  MEDICAL_QUERY: 'MEDICAL_QUERY',
  CRISIS_SELF_HARM: 'CRISIS_SELF_HARM',
  UNSAFE_PREDICTION: 'UNSAFE_PREDICTION',
  INAPPROPRIATE_OR_SEXUAL: 'INAPPROPRIATE_OR_SEXUAL',
} as const;

export type CoreIntent = (typeof CoreIntent)[keyof typeof CoreIntent];

export interface ConsultationIntent {
  primaryIntent: CoreIntent;
  secondaryIntents: CoreIntent[];
  confidence: number;
  entities: string[];
  astrologyRelevance: AstrologyRelevance;
  requestedTimeframe?: string;
  requiresChartAnalysis: boolean;
  requiresTimingAnalysis: boolean;
  requiresFollowUp: boolean;
}

export type AstrologyRelevance =
  | 'REQUIRED'            // Direct astrology / timing / horoscope / chart reading query
  | 'STRONGLY_RELEVANT'   // Deep life transition where chart factors are primary
  | 'OPTIONAL'            // Life situation where human observation comes first; astrology offered gently
  | 'BACKGROUND_ONLY'     // Family / life context where chart provides broad background only
  | 'NOT_RELEVANT'        // Greetings, acknowledgments, casual chat, physical incidents, jokes, closures
  | 'EXPLICITLY_REQUESTED' // User explicitly asked "meri kundli ke hisaab se...", "chart dekh ke batao"
  | 'USEFUL'              // Backwards-compatible alias for STRONGLY_RELEVANT
  | 'AMBIGUOUS';          // Backwards-compatible alias for ambiguous emotion

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

export type ConversationTopic =
  | 'GENERAL'
  | 'EMOTIONAL'
  | 'RELATIONSHIP'
  | 'LOVE'
  | 'MARRIAGE'
  | 'CAREER'
  | 'JOB'
  | 'MONEY'
  | 'FAMILY'
  | 'HEALTH'
  | 'SPIRITUAL'
  | 'INCIDENT'
  | 'CASUAL'
  | 'ASTROLOGY'
  | 'OTHER';

export type ResponseMode =
  | 'CASUAL_CONVERSATION'
  | 'EMOTIONAL_SUPPORT'
  | 'PRACTICAL_GUIDANCE'
  | 'CONTEXTUAL_CLARIFICATION'
  | 'ASTROLOGY_CONSULTATION'
  | 'ASTROLOGY_FOLLOW_UP'
  | 'DEEP_READING'
  | 'SAFETY_RESPONSE';

export interface PendingConversationQuestion {
  questionId?: string;
  questionText: string;
  expectedAnswerType:
    | 'yes_no'
    | 'person'
    | 'reason'
    | 'event'
    | 'emotion'
    | 'choice'
    | 'free_text'
    | 'birth_detail'
    | 'unknown';
  topic: string;
  createdAt?: Date;
}

export interface ConversationDecision {
  language: 'en' | 'hi' | 'hinglish';
  relation:
    | 'NEW_TOPIC'
    | 'CONTINUATION'
    | 'ANSWER_TO_ASSISTANT'
    | 'ANSWER_TO_PREVIOUS_QUESTION'
    | 'CLARIFICATION'
    | 'CORRECTION'
    | 'REACTION'
    | 'FOLLOW_UP'
    | 'TOPIC_CHANGE'
    | 'CASUAL'
    | 'UNKNOWN';
  topic: ConversationTopic | string;
  intent: string;
  intentConfidence: number;
  emotion?: string;
  astrologyRelevance: AstrologyRelevance;
  responseMode: ResponseMode;
  requiresClarification: boolean;
  clarificationReason?: string;
  activeTopic?: string;
  confidence: number;
}

