/**
 * Deterministic, dependency-free self-harm/suicide detection (CLAUDE.md
 * §17). This runs BEFORE anything else in the pipeline and BEFORE any AI
 * call — it must work even if every AI provider is unconfigured, and it
 * must never depend on a model correctly classifying a high-stakes
 * message. Deliberately broad/over-inclusive: a false positive here costs
 * a user an unnecessary (but harmless and still supportive) safety
 * message; a false negative could miss a genuine crisis. Substring
 * matching, not word-boundary regex, is intentional for the same reason.
 */
const CRISIS_PATTERNS: string[] = [
  // English
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'end it all',
  'ending it all',
  "don't want to live",
  'dont want to live',
  'do not want to live',
  'want to die',
  'wish i was dead',
  'wish i were dead',
  'better off dead',
  'no reason to live',
  'not worth living',
  'suicidal',
  'suicide',
  'self harm',
  'self-harm',
  'selfharm',
  'hurt myself',
  'hurting myself',
  'cut myself',
  'cutting myself',
  "can't go on",
  'cant go on',
  'cannot go on',
  "can't take it anymore",
  'cant take it anymore',
  // Romanized Hindi/Hinglish
  'khud ko khatam',
  'khudko khatam',
  'khatam kar dunga',
  'khatam karna chahta',
  'khatam karna chahti',
  'marna chahta',
  'marna chahti',
  'mar jaana chahta',
  'mar jana chahta',
  'jeena nahi chahta',
  'jeena nahin chahta',
  'jeene ka mann nahi',
  'jeene ka man nahi',
  'aatmahatya',
  'atmahatya',
  'khudkushi',
  'khudkhushi',
  'zindagi khatam karna',
  // Devanagari
  'आत्महत्या',
  'खुदकुशी',
  'खुद को खत्म',
  'मरना चाहता',
  'मरना चाहती',
  'जीना नहीं चाहता',
  'जीने का मन नहीं',
];

export function containsCrisisLanguage(text: string): boolean {
  const normalized = text.toLowerCase();
  return CRISIS_PATTERNS.some((pattern) => normalized.includes(pattern));
}
