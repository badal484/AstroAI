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
  'h',
  'hn',
  'nahi',
  'nahin',
  'na',
  'kya',
  'kyun',
  'kyu',
  'kaise',
  'kaisi',
  'kaisa',
  'kab',
  'kahan',
  'kaun',
  'ka',
  'ki',
  'ke',
  'ko',
  'se',
  'mein',
  'par',
  'pe',
  'ne',
  'toh',
  'aur',
  'ya',
  'kar',
  'bhi',
  'kuch',
  'kuchh',
  'jab',
  'tab',
  'fir',
  'phir',
  'mera',
  'meri',
  'mere',
  'tera',
  'teri',
  'tere',
  'tum',
  'tumhara',
  'tumhari',
  'tumhare',
  'aap',
  'aapka',
  'aapki',
  'aapke',
  'hum',
  'humara',
  'humari',
  'humare',
  'mujhe',
  'mujhko',
  'usko',
  'unko',
  'unka',
  'unki',
  'unke',
  'isko',
  'inko',
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
  'vivah',
  'rishta',
  'paisa',
  'paise',
  'naukri',
  'karobar',
  'kaam',
  'ghar',
  'zindagi',
  'jeevan',
  'kismat',
  'bhagya',
  'rashi',
  'kundli',
  'graha',
  'grah',
  'shubh',
  'ashubh',
  'batao',
  'bata',
  'karo',
  'karenge',
  'karu',
  'karoon',
  'karna',
  'karta',
  'karti',
  'karte',
  'raha',
  'rahi',
  'rahe',
  'tha',
  'thi',
  'the',
  'gaya',
  'gayi',
  'gaye',
  'hua',
  'hui',
  'hue',
  'hoga',
  'hogi',
  'honge',
  'milega',
  'milegi',
  'milenge',
  'mann',
  'man',
  'mood',
  'daru',
  'daaru',
  'sharab',
  'peena',
  'peene',
  'peeyenge',
  'aaj',
  'kal',
  'ab',
  'abhi',
  'baat',
  'baatein',
  'bol',
  'bolo',
  'suno',
  'dekh',
  'dekho',
  'soch',
  'socho',
  'lag',
  'laga',
  'lagi',
  'lage',
  'chahiye',
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

  return SupportedLanguage.HINGLISH;
}
