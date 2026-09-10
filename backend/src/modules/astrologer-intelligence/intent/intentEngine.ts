import { CoreIntent, type DetectedIntents, type ConsultationIntent, type AstrologyRelevance } from './intentTypes';
import { INTENT_MATCHERS } from './keywordPatterns';
import { messageNormalizer } from '../normalizer/messageNormalizer';

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
  if (/\b(road|gir|gaya|slip|accident|chot|doctor|pain|hospital)\b|सड़क|गिर|चोट/.test(normalized)) entities.push('DOMAIN_INCIDENT');
  if (/\b(college|admission|padhai|study|studies|exam|exams|school|university|degree|education|vidya|shiksha|entrance|neet|jee|upsc|cat|gate)\b|कॉलेज|एडमिशन|पढ़ाई|शिक्षा|परीक्षा/.test(normalized)) entities.push('DOMAIN_EDUCATION');
  if (/\b(abroad|foreign|videsh|visa|settlement)\b|विदेश|वीजा/.test(normalized)) entities.push('DOMAIN_FOREIGN');
  if (/\b(property|ghar|flat|plot|makan|gaadi|car|gadi|vehicle|vahana)\b|घर|मकान|गाड़ी/.test(normalized)) entities.push('DOMAIN_PROPERTY');

  return entities;
}

function resolveAstrologyRelevance(intent: CoreIntent, rawText: string = '', normalized: string = ''): AstrologyRelevance {
  // 1. Check if user explicitly asked for chart-based / Vedic Jyotish analysis
  const hasExplicitRequest =
    /\b(meri kundli ke hisaab|kundli ke hisab|chart ke hisaab|jyotish ke hisaab|kundli dekh ke|chart dekh kar|astrology ke hisaab|meri kundli kya kehti|according to my chart|according to astrology)\b/i.test(
      normalized,
    ) || /(मेरी कुंडली के हिसाब|कुंडली देखकर|ज्योतिष के अनुसार|कुंडली क्या कहती)/.test(rawText);

  if (hasExplicitRequest) {
    return 'EXPLICITLY_REQUESTED';
  }

  switch (intent) {
    case CoreIntent.GREETING_INTAKE:
    case CoreIntent.SHORT_ACKNOWLEDGMENT:
    case CoreIntent.DISMISSAL_OR_END:
    case CoreIntent.CONTINUATION_PROMPT:
    case CoreIntent.FRUSTRATION_OR_ABUSE:
    case CoreIntent.CASUAL_CHAT:
    case CoreIntent.PHYSICAL_INCIDENT:
    case CoreIntent.PRACTICAL_LIFE_EVENT:
    case CoreIntent.CRISIS_SELF_HARM:
    case CoreIntent.UNSAFE_PREDICTION:
    case CoreIntent.MEDICAL_QUERY:
    case CoreIntent.INAPPROPRIATE_OR_SEXUAL:
    case CoreIntent.SKEPTICISM_OR_TEST:
    case CoreIntent.JAILBREAK_OR_SYSTEM_PROMPT:
    case CoreIntent.SPECULATIVE_GAMBLING:
    case CoreIntent.SARCASM_OR_MOCKERY:
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
    case CoreIntent.CERTAINTY_DEMAND:
      return 'REQUIRED';

    case CoreIntent.JOB_CHANGE:
    case CoreIntent.CAREER_DECISION:
    case CoreIntent.BUSINESS_VENTURE:
    case CoreIntent.CAREER_GENERAL:
    case CoreIntent.FINANCE_GENERAL:
    case CoreIntent.DEBT_EXPENSES:
    case CoreIntent.INVESTMENT_GUIDANCE:
    case CoreIntent.COMPOUND_MARRIAGE_CAREER:
    case CoreIntent.MEMORY_RECALL_QUERY:
    case CoreIntent.PREVIOUS_ANSWER_CHALLENGE:
    case CoreIntent.GENERIC_ANSWER_CHALLENGE:
    case CoreIntent.SHORT_ANSWER_DEMAND:
    case CoreIntent.CONTRADICTION_CORRECTION:
      return 'STRONGLY_RELEVANT';

    case CoreIntent.RELATIONSHIP_CONFLICT:
    case CoreIntent.BREAKUP:
    case CoreIntent.LOVE_LIFE:
    case CoreIntent.HEALTH_VITALITY:
    case CoreIntent.SUPERSTITION_FEAR:
    case CoreIntent.FOLLOW_UP_INTERROGATIVE:
      return 'OPTIONAL';

    case CoreIntent.FAMILY_MATTERS:
    case CoreIntent.THIRD_PARTY_QUERY:
      return 'BACKGROUND_ONLY';

    case CoreIntent.DAILY_LUCKY_FACT:
    case CoreIntent.TODAY_GUIDANCE:
    case CoreIntent.REMEDIES_UPAY:
      return 'OPTIONAL';

    default:
      return 'NOT_RELEVANT';
  }
}

export const intentEngine = {
  detectIntents(userMessage: string): DetectedIntents {
    const rawText = userMessage ? userMessage.trim() : '';
    const normResult = messageNormalizer.normalize(rawText);
    const normalized = normResult.normalized;

    const matchedIntents: CoreIntent[] = [];
    let requiresClarification = false;

    // 1. Evaluate pattern matchers across both raw and normalized forms
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

    if (
      matchedIntents.includes(CoreIntent.INAPPROPRIATE_OR_SEXUAL) ||
      /\b(sex|sax|sax sux|nude|nudes|porn|porno|chudai|sambhog|intercourse|masturbat|masturbation|send pics|boobs|penis|vagina|horny|lust|kamvasna|kaam vasna)\b/i.test(
        normalized,
      ) ||
      /\b(sex|sax|sax sux|nude|nudes|porn|porno|chudai|sambhog|intercourse|masturbat|masturbation|send pics|boobs|penis|vagina|horny|lust|kamvasna|kaam vasna)\b/i.test(
        rawText,
      ) ||
      /(सेक्स|संभोग|हस्तमैथुन|अश्लील|नग्न|कामवासना)/.test(rawText)
    ) {
      return {
        primary: CoreIntent.INAPPROPRIATE_OR_SEXUAL,
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

    if (matchedIntents.includes(CoreIntent.FRUSTRATION_OR_ABUSE)) {
      return {
        primary: CoreIntent.FRUSTRATION_OR_ABUSE,
        secondary: [],
        isAstrologySpecific: false,
        astrologyRelevance: 'NOT_RELEVANT',
        requiresClarification: false,
        confidence: 0.98,
        entities,
      };
    }

    if (matchedIntents.includes(CoreIntent.DISMISSAL_OR_END)) {
      return {
        primary: CoreIntent.DISMISSAL_OR_END,
        secondary: [],
        isAstrologySpecific: false,
        astrologyRelevance: 'NOT_RELEVANT',
        requiresClarification: false,
        confidence: 0.98,
        entities,
      };
    }

    if (matchedIntents.includes(CoreIntent.CONTINUATION_PROMPT)) {
      return {
        primary: CoreIntent.CONTINUATION_PROMPT,
        secondary: [],
        isAstrologySpecific: false,
        astrologyRelevance: 'NOT_RELEVANT',
        requiresClarification: false,
        confidence: 0.98,
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
      } else if (/\b(gir gaya|gir gya|gira|road|sadak|slip|chot|accident)\b/i.test(normalized)) {
        matchedIntents.push(CoreIntent.PHYSICAL_INCIDENT);
      } else if (entities.includes('DOMAIN_MARRIAGE')) {
        matchedIntents.push(CoreIntent.MARRIAGE_TIMING);
      } else if (entities.includes('DOMAIN_CONFLICT')) {
        matchedIntents.push(CoreIntent.RELATIONSHIP_CONFLICT);
      } else if (entities.includes('DOMAIN_CAREER')) {
        matchedIntents.push(CoreIntent.CAREER_GENERAL);
      } else if (entities.includes('DOMAIN_EDUCATION')) {
        matchedIntents.push(CoreIntent.EDUCATION_HIGHER_STUDIES);
      } else if (entities.includes('DOMAIN_FOREIGN')) {
        matchedIntents.push(CoreIntent.FOREIGN_TRAVEL_SETTLEMENT);
      } else if (entities.includes('DOMAIN_PROPERTY')) {
        matchedIntents.push(CoreIntent.PROPERTY_VEHICLE);
      } else if (entities.includes('DOMAIN_FINANCE')) {
        matchedIntents.push(CoreIntent.FINANCE_GENERAL);
      } else if (hasAstrologyKeywords) {
        matchedIntents.push(CoreIntent.GENERAL_LIFE_READING);
      } else {
        matchedIntents.push(CoreIntent.CASUAL_CHAT);
      }
    }

    // Prioritize specific domain intents over generic ambiguous emotion
    if (matchedIntents.includes(CoreIntent.AMBIGUOUS_EMOTION) && matchedIntents.length > 1) {
      const domainIntent = matchedIntents.find((i) => i !== CoreIntent.AMBIGUOUS_EMOTION && i !== CoreIntent.CASUAL_CHAT);
      if (domainIntent) {
        const idx = matchedIntents.indexOf(domainIntent);
        matchedIntents.splice(idx, 1);
        matchedIntents.unshift(domainIntent);
      }
    }

    const primary = matchedIntents[0]!;
    const secondary = matchedIntents.slice(1);
    const astrologyRelevance = resolveAstrologyRelevance(primary, rawText, normalized);
    const isAstrologySpecific =
      astrologyRelevance === 'REQUIRED' ||
      astrologyRelevance === 'EXPLICITLY_REQUESTED' ||
      astrologyRelevance === 'STRONGLY_RELEVANT' ||
      astrologyRelevance === 'USEFUL';

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
