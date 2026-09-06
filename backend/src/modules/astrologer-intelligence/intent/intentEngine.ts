import { CoreIntent, type DetectedIntents, type ConsultationIntent, type AstrologyRelevance } from './intentTypes';
import { INTENT_MATCHERS } from './keywordPatterns';

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[?!.,;:'"()_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEntities(normalized: string): string[] {
  const entities: string[] = [];

  if (/\b(aaj|today|current)\b|आज/.test(normalized)) entities.push('TIMEFRAME_TODAY');
  if (/\b(saal|year|months|mahine)\b|साल|महीने/.test(normalized)) entities.push('TIMEFRAME_PERIOD');
  if (/\b(girlfriend|gf|wife|patni|partner)\b|गर्लफ्रेंड|पत्नी|पार्टनर/.test(normalized)) entities.push('ENTITY_FEMALE_PARTNER');
  if (/\b(boyfriend|bf|husband|pati)\b|बॉयफ्रेंड|पति/.test(normalized)) entities.push('ENTITY_MALE_PARTNER');
  if (/\b(shadi|shaadi|vivah|marriage|marry|married|wedding|rishta)\b|शादी|विवाह|ब्याह/.test(normalized)) entities.push('DOMAIN_MARRIAGE');
  if (/\b(job|naukri|career|business|vyapar|kaam|profession)\b|नौकरी|करियर|बिजनेस|व्यापार/.test(normalized)) entities.push('DOMAIN_CAREER');
  if (/\b(paisa|paise|dhan|money|wealth|finance|income)\b|पैसा|पैसे|धन|कमाई/.test(normalized)) entities.push('DOMAIN_FINANCE');
  if (/\b(ladai|ladayi|jhagda|fight|conflict|breakup|naraz|kalesh|distance)\b|लड़ाई|झगड़ा|अनबन|नाराज/.test(normalized)) entities.push('DOMAIN_CONFLICT');

  return entities;
}

function resolveAstrologyRelevance(intent: CoreIntent): AstrologyRelevance {
  switch (intent) {
    case CoreIntent.GREETING_INTAKE:
    case CoreIntent.SHORT_ACKNOWLEDGMENT:
    case CoreIntent.CASUAL_CHAT:
    case CoreIntent.CRISIS_SELF_HARM:
    case CoreIntent.UNSAFE_PREDICTION:
    case CoreIntent.MEDICAL_QUERY:
      return 'NOT_RELEVANT';

    case CoreIntent.AMBIGUOUS_EMOTION:
      return 'AMBIGUOUS';

    case CoreIntent.MARRIAGE_TIMING:
    case CoreIntent.CAREER_TIMING:
    case CoreIntent.WEALTH_TIMING:
    case CoreIntent.DASHA_ANALYSIS:
    case CoreIntent.PERIOD_FORECAST_6M:
    case CoreIntent.PERIOD_FORECAST_1Y:
    case CoreIntent.DAILY_HOROSCOPE:
    case CoreIntent.MARRIAGE_PROSPECTS:
    case CoreIntent.PARTNER_CHARACTERISTICS:
    case CoreIntent.RELATIONSHIP_COMPATIBILITY:
    case CoreIntent.EDUCATION_HIGHER_STUDIES:
    case CoreIntent.FOREIGN_TRAVEL_SETTLEMENT:
    case CoreIntent.PROPERTY_VEHICLE:
    case CoreIntent.GENERAL_LIFE_READING:
      return 'REQUIRED';

    case CoreIntent.RELATIONSHIP_CONFLICT:
    case CoreIntent.BREAKUP:
    case CoreIntent.JOB_CHANGE:
    case CoreIntent.CAREER_DECISION:
    case CoreIntent.LOVE_LIFE:
    case CoreIntent.BUSINESS_VENTURE:
    case CoreIntent.CAREER_GENERAL:
    case CoreIntent.FINANCE_GENERAL:
    case CoreIntent.DEBT_EXPENSES:
    case CoreIntent.INVESTMENT_GUIDANCE:
    case CoreIntent.HEALTH_VITALITY:
    case CoreIntent.COMPOUND_MARRIAGE_CAREER:
    case CoreIntent.MEMORY_RECALL_QUERY:
      return 'USEFUL';

    case CoreIntent.DAILY_LUCKY_FACT:
    case CoreIntent.TODAY_GUIDANCE:
    case CoreIntent.REMEDIES_UPAY:
      return 'OPTIONAL';

    default:
      return 'USEFUL';
  }
}

export const intentEngine = {
  detectIntents(userMessage: string): DetectedIntents {
    const rawText = userMessage.trim();
    const normalized = normalizeText(rawText);
    const matchedIntents: CoreIntent[] = [];
    let requiresClarification = false;

    // 1. Evaluate pattern matchers
    for (const matcher of INTENT_MATCHERS) {
      for (const pattern of matcher.patterns) {
        if (pattern.test(rawText) || pattern.test(normalized)) {
          if (!matchedIntents.includes(matcher.intent)) {
            matchedIntents.push(matcher.intent);
            if (matcher.requiresClarification) {
              requiresClarification = true;
            }
          }
          break;
        }
      }
    }

    const entities = extractEntities(normalized);

    // 2. High-priority safety gates take immediate precedence
    if (matchedIntents.includes(CoreIntent.CRISIS_SELF_HARM)) {
      return {
        primary: CoreIntent.CRISIS_SELF_HARM,
        secondary: [],
        isAstrologySpecific: false,
        astrologyRelevance: 'NOT_RELEVANT',
        requiresClarification: false,
        confidence: 1.0,
        entities,
      };
    }

    if (matchedIntents.includes(CoreIntent.UNSAFE_PREDICTION)) {
      return {
        primary: CoreIntent.UNSAFE_PREDICTION,
        secondary: [],
        isAstrologySpecific: false,
        astrologyRelevance: 'NOT_RELEVANT',
        requiresClarification: false,
        confidence: 1.0,
        entities,
      };
    }

    if (matchedIntents.includes(CoreIntent.MEDICAL_QUERY)) {
      return {
        primary: CoreIntent.MEDICAL_QUERY,
        secondary: [],
        isAstrologySpecific: false,
        astrologyRelevance: 'NOT_RELEVANT',
        requiresClarification: false,
        confidence: 0.95,
        entities,
      };
    }

    // 3. Fallback resolution if no direct pattern matched
    if (matchedIntents.length === 0) {
      const hasAstrologyKeywords =
        /\b(kundli|kundali|chart|grah|graha|dasha|future|bhavishya|transit|gochar|rashifal|rashi|horoscope|nakshatra|jyotish|astrology)\b/i.test(
          normalized,
        ) || /(कुंडली|ग्रह|दशा|भविष्य|गोचर|राशि|नक्षत्र|ज्योतिष)/.test(rawText);

      if (
        /\b(dil|dhadkan|heart|racing|anxiety|bechain|confused|confusion|daru|daaru|beer|alcohol|sharab|mood|bore|thak|peene)\b/i.test(
          normalized,
        )
      ) {
        matchedIntents.push(CoreIntent.AMBIGUOUS_EMOTION);
        requiresClarification = true;
      } else if (entities.includes('DOMAIN_MARRIAGE')) {
        matchedIntents.push(CoreIntent.MARRIAGE_TIMING);
      } else if (entities.includes('DOMAIN_CONFLICT')) {
        matchedIntents.push(CoreIntent.RELATIONSHIP_CONFLICT);
      } else if (entities.includes('DOMAIN_CAREER')) {
        matchedIntents.push(CoreIntent.CAREER_GENERAL);
      } else if (entities.includes('DOMAIN_FINANCE')) {
        matchedIntents.push(CoreIntent.FINANCE_GENERAL);
      } else if (hasAstrologyKeywords) {
        matchedIntents.push(CoreIntent.GENERAL_LIFE_READING);
      } else {
        matchedIntents.push(CoreIntent.CASUAL_CHAT);
      }
    }

    const primary = matchedIntents[0]!;
    const secondary = matchedIntents.slice(1);
    const astrologyRelevance = resolveAstrologyRelevance(primary);
    const isAstrologySpecific = astrologyRelevance === 'REQUIRED' || astrologyRelevance === 'USEFUL';

    return {
      primary,
      secondary,
      isAstrologySpecific,
      astrologyRelevance,
      requiresClarification: requiresClarification || astrologyRelevance === 'AMBIGUOUS',
      confidence: matchedIntents.length > 0 ? 0.95 : 0.6,
      entities,
      requestedTimeframe: entities.includes('TIMEFRAME_TODAY') ? 'TODAY' : undefined,
    };
  },

  toConsultationIntent(detected: DetectedIntents): ConsultationIntent {
    const isTiming =
      detected.primary === CoreIntent.MARRIAGE_TIMING ||
      detected.primary === CoreIntent.CAREER_TIMING ||
      detected.primary === CoreIntent.WEALTH_TIMING;

    return {
      primaryIntent: detected.primary,
      secondaryIntents: detected.secondary,
      confidence: detected.confidence,
      entities: detected.entities ?? [],
      astrologyRelevance: detected.astrologyRelevance,
      requestedTimeframe: detected.requestedTimeframe,
      requiresChartAnalysis: detected.astrologyRelevance === 'REQUIRED',
      requiresTimingAnalysis: isTiming,
      requiresFollowUp: true,
    };
  },
};
