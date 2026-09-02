/**
 * Coarse first-pass filter for requests clearly outside an astrology
 * conversation's scope in a harmful direction (violence, self-evidently
 * illegal requests). Not exhaustive — nuanced cases fall through to the
 * AI classifier's own `unsafe` label (see `intentDetector.ts`); this only
 * catches the unambiguous cases fast and without an AI call.
 */
const UNSAFE_PATTERNS: string[] = [
  'how to make a bomb',
  'how to make a weapon',
  'how to kill someone',
  'how to hurt someone',
  'how to poison',
  'buy drugs',
  'make meth',
  'hack into',
  'child porn',
];

export function containsUnsafeLanguage(text: string): boolean {
  const normalized = text.toLowerCase();
  return UNSAFE_PATTERNS.some((pattern) => normalized.includes(pattern));
}
