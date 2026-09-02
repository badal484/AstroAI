import { IntentCategory } from '@astroai/shared-types';

/**
 * Best-effort keyword classifier used only when the AI Gateway itself is
 * unavailable (no provider configured, or every provider failed) — far
 * less accurate than AI classification, but keeps the astrologer
 * functional in a degraded mode rather than failing every message
 * outright. Ordered by specificity; first match wins.
 */
const KEYWORD_RULES: Array<{ intent: IntentCategory; keywords: string[] }> = [
  {
    intent: IntentCategory.MARRIAGE,
    keywords: [
      'marriage',
      'marry',
      'married',
      'wedding',
      'shaadi',
      'shadi',
      'spouse',
      'husband',
      'wife',
    ],
  },
  {
    intent: IntentCategory.LOVE,
    keywords: [
      'love',
      'relationship',
      'boyfriend',
      'girlfriend',
      'partner',
      'pyaar',
      'pyar',
      'crush',
      'breakup',
    ],
  },
  {
    intent: IntentCategory.CAREER,
    keywords: [
      'career',
      'job',
      'promotion',
      'business',
      'naukri',
      'karobar',
      'work',
      'interview',
      'boss',
    ],
  },
  {
    intent: IntentCategory.MONEY,
    keywords: [
      'money',
      'finance',
      'wealth',
      'paisa',
      'paise',
      'loan',
      'debt',
      'investment',
      'salary',
    ],
  },
  {
    intent: IntentCategory.FAMILY,
    keywords: [
      'family',
      'parents',
      'mother',
      'father',
      'children',
      'son',
      'daughter',
      'ghar',
      'parivar',
    ],
  },
  {
    intent: IntentCategory.COMPATIBILITY,
    keywords: ['compatibility', 'compatible', 'match making', 'kundli milan', 'guna milan'],
  },
  {
    intent: IntentCategory.DAILY_HOROSCOPE,
    keywords: ['today', 'daily horoscope', 'this week', "today's", 'aaj ka', 'aaj'],
  },
  {
    intent: IntentCategory.MEDICAL,
    keywords: ['disease', 'illness', 'health', 'diagnosis', 'symptom', 'bimari', 'cancer'],
  },
];

export function classifyIntentByKeywords(text: string): IntentCategory {
  const normalized = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.intent;
    }
  }
  // No confident match — this fallback only runs when AI classification is
  // unavailable, so it's already low-confidence; defaulting to UNCLEAR
  // (prompting a clarifying follow-up) is safer than guessing a specific
  // life-area intent that might steer the response the wrong way.
  return IntentCategory.UNCLEAR;
}
