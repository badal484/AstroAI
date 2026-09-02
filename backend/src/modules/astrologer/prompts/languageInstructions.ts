import { SupportedLanguage } from '@astroai/shared-types';

/** CLAUDE.md §18/§19: respond naturally in the language the user is
 * actually writing in — never a mechanical translation of an English
 * answer, and astrology terminology is preserved rather than translated
 * into unfamiliar equivalents. */
const LANGUAGE_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  [SupportedLanguage.ENGLISH]: 'Respond in natural, conversational English.',
  [SupportedLanguage.HINDI]:
    'Respond in Hindi, written in Devanagari script. Write naturally and conversationally, the way a warm human astrologer actually speaks — not a stiff textbook translation. Keep commonly-used astrology terms (Rashi, Nakshatra, Dasha, Kundli, etc.) as they are, since that is how people actually use them in spoken Hindi.',
  [SupportedLanguage.HINGLISH]:
    'Respond in natural Hinglish — a casual mix of Hindi and English written in Roman script, the way people actually text each other. Do not force a fully-Hindi or fully-English response; match the mixed, conversational register the user wrote in. Keep astrology terms in their commonly used form.',
};

export function buildLanguageInstruction(language: SupportedLanguage): string {
  return LANGUAGE_INSTRUCTIONS[language];
}
