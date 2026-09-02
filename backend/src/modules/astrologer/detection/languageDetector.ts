import { SupportedLanguage } from '@astroai/shared-types';

// Common romanized Hindi words seen in everyday chat — deliberately a
// small, high-precision list (common function words/greetings/astrology-
// adjacent vocabulary) rather than an exhaustive dictionary. False
// negatives (missing Hinglish, falling back to English) are far less
// harmful than false positives here, since the user can always steer the
// conversation language explicitly (CLAUDE.md §19).
const ROMANIZED_HINDI_WORDS = new Set([
  'hai',
  'hain',
  'ho',
  'nahi',
  'nahin',
  'kya',
  'kyun',
  'kyu',
  'kaise',
  'kaisi',
  'kaisa',
  'kab',
  'kahan',
  'kaun',
  'mera',
  'meri',
  'mere',
  'tera',
  'teri',
  'tere',
  'tum',
  'tumhara',
  'aap',
  'aapka',
  'aapki',
  'hum',
  'humara',
  'mujhe',
  'mujhko',
  'usko',
  'unko',
  'acha',
  'accha',
  'theek',
  'thik',
  'bahut',
  'bohot',
  'bhai',
  'yaar',
  'matlab',
  'samajh',
  'pyaar',
  'pyar',
  'shaadi',
  'shadi',
  'paisa',
  'paise',
  'naukri',
  'karobar',
  'ghar',
  'zindagi',
  'jeevan',
  'kismat',
  'bhagya',
  'rashi',
  'kundli',
  'graha',
  'shubh',
  'ashubh',
  'batao',
  'bata',
  'karo',
  'karenge',
  'hoga',
  'hogi',
  'milega',
  'milegi',
]);

// Devanagari Unicode block — anything in this range is written Hindi, not
// romanized/transliterated.
const DEVANAGARI_PATTERN = /[ऀ-ॿ]/;

function countRomanizedHindiWords(words: string[]): number {
  let count = 0;
  for (const word of words) {
    if (ROMANIZED_HINDI_WORDS.has(word)) count++;
  }
  return count;
}

/**
 * Coarse, dependency-free per-message language detection (CLAUDE.md §19:
 * language can change message to message, so this runs on every message
 * rather than trusting a stored preference). Deliberately a cheap
 * heuristic, not an AI call — language ID doesn't need a model, and
 * keeping it synchronous means it works even with no AI provider
 * configured.
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (DEVANAGARI_PATTERN.test(text)) {
    return SupportedLanguage.HINDI;
  }

  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return SupportedLanguage.ENGLISH;

  const hindiWordCount = countRomanizedHindiWords(words);
  if (hindiWordCount === 0) return SupportedLanguage.ENGLISH;

  // All (or nearly all) romanized-Hindi words with no other content reads
  // as "Hindi typed in Roman script" rather than a mixed Hinglish
  // sentence — still routed to HINDI so the reply matches script
  // expectations naturally rather than switching to English mid-thought.
  const hindiRatio = hindiWordCount / words.length;
  if (hindiRatio >= 0.8 && words.length <= 3) return SupportedLanguage.HINDI;

  return SupportedLanguage.HINGLISH;
}
