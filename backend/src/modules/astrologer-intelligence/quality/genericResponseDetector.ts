/**
 * Generic Response Detector
 * Flags repetitive, boilerplate responses such as:
 * - "Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?"
 * - "What life area would you like to explore?"
 * - "Please provide your birth details..."
 */

const FORBIDDEN_GENERIC_PATTERNS = [
  /aaj kis vishay par baat karna chahte/i,
  /personal life,\s*career ya kuch aur/i,
  /what life area would you like to explore/i,
  /tell me which area concerns you/i,
  /feel free to share your birth details/i,
  /to calculate your janam kundli and dasha accurately, please share/i,
];

export interface GenericityCheckResult {
  isGeneric: boolean;
  matchedPattern?: string;
  recommendation: 'PASS' | 'REPLACE_WITH_CONTEXTUAL';
}

export const genericResponseDetector = {
  detect(response: string, userMessage: string): GenericityCheckResult {
    const norm = response.toLowerCase();
    const userNorm = userMessage.toLowerCase();

    // If user message is broad greeting or "kuch baat karni hai", broad menu is acceptable
    const isBroadStarter = /^(hello|hi|namaste|pranam|kuch baat karni hai|kuch puchna hai)\b/i.test(userNorm.trim());

    for (const pattern of FORBIDDEN_GENERIC_PATTERNS) {
      if (pattern.test(norm)) {
        if (isBroadStarter && /aaj kis vishay|personal life|career/i.test(norm)) {
          // Acceptable for initial broad starter
          return { isGeneric: false, recommendation: 'PASS' };
        }
        return {
          isGeneric: true,
          matchedPattern: pattern.source,
          recommendation: 'REPLACE_WITH_CONTEXTUAL',
        };
      }
    }

    return { isGeneric: false, recommendation: 'PASS' };
  },
};
