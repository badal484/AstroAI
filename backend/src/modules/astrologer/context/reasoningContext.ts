import { IntentCategory } from '@astroai/shared-types';
import type { AstrologyContext } from './astrologyContext';

/**
 * Guidance on HOW to reason over the astrology context for the current
 * intent — distinct from `astrologyContext.ts`, which only supplies WHAT
 * the verified facts are. This tells the model which traditional chart
 * factors are relevant to the topic at hand, and — critically — reminds
 * it that this is guidance about what to LOOK FOR in the facts already
 * given, never license to invent a factor that isn't present
 * (CLAUDE.md §11).
 */
const RELEVANT_FACTORS_BY_INTENT: Partial<Record<IntentCategory, string>> = {
  [IntentCategory.LOVE]: 'the 5th and 7th houses, Venus, and the Venus dasha/antardasha period',
  [IntentCategory.MARRIAGE]:
    'the 7th house and its lord, Venus, Jupiter, and the current dasha period',
  [IntentCategory.CAREER]:
    'the 10th house and its lord, Saturn, the Sun, and the current dasha period',
  [IntentCategory.MONEY]: 'the 2nd and 11th houses, Jupiter, and the current dasha period',
  [IntentCategory.FAMILY]: 'the 2nd and 4th houses, the Moon, and Jupiter',
  [IntentCategory.COMPATIBILITY]:
    "both charts' Moon signs/nakshatras, Venus and Mars placements, and 7th houses",
  [IntentCategory.DAILY_HOROSCOPE]:
    'current transits relative to the natal Moon sign and ascendant',
};

export function buildReasoningContext(intent: IntentCategory, astrology: AstrologyContext): string {
  const relevantFactors = RELEVANT_FACTORS_BY_INTENT[intent];

  const lines: string[] = [
    'Reasoning discipline: interpret only the astrology facts explicitly listed above. Never state a planetary position, house, dasha, nakshatra, or yoga that was not given to you. Express appropriate uncertainty — use probabilistic, interpretive language ("this suggests", "this often points to", "you may find"), never absolute guarantees.',
  ];

  if (relevantFactors && astrology.available) {
    lines.push(
      `For this kind of question, Vedic astrology traditionally emphasizes ${relevantFactors} — reference these only if they appear in the astrology facts above; if they weren't provided, say you'd need more chart detail rather than guessing.`,
    );
  }

  if (!astrology.available) {
    lines.push(
      'No verified chart data is available right now, so do not produce a chart-based interpretation at all — acknowledge that plainly and, if relevant, invite the user to add their birth details.',
    );
  } else if (astrology.timeConfidence && astrology.timeConfidence !== 'exact') {
    lines.push(
      `The birth time on file is "${astrology.timeConfidence}" — treat ascendant and house-based facts with appropriate caution and say so if the question depends heavily on them.`,
    );
  }

  return lines.join('\n');
}
