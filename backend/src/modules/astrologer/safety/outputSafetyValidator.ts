export interface SafetyValidationResult {
  safe: boolean;
  violations: string[];
}

interface SafetyPattern {
  label: string;
  pattern: RegExp;
}

/**
 * Defense-in-depth for CLAUDE.md §13/§15/§16 — the prompt already
 * instructs the model never to produce this language, but a post-
 * generation scan catches it anyway rather than trusting the prompt
 * alone. Patterns are intentionally narrow/high-precision (guarantee
 * language, death predictions, "I am human" claims, explicit disease
 * assertions) to avoid flagging normal interpretive hedging language.
 */
const UNSAFE_OUTPUT_PATTERNS: SafetyPattern[] = [
  {
    label: 'guaranteed prediction',
    pattern: /\b(guaranteed?|will (definitely|certainly)|100% (sure|certain))\b/i,
  },
  { label: 'death prediction', pattern: /\b(you will die|date of death|will die (on|in|by))\b/i },
  { label: 'claims to be human', pattern: /\bi(?:'m| am) (a real |actually )?human\b/i },
  {
    label: 'claims to not be AI',
    pattern: /\bi(?:'m| am) not an? (ai|artificial intelligence|bot)\b/i,
  },
  {
    label: 'medical diagnosis',
    pattern: /\byou (have|are suffering from|will develop) (cancer|diabetes|hiv|aids|a tumou?r)\b/i,
  },
];

/** Scans a generated response for language the persona is explicitly
 * forbidden from producing. Returns every violation found (not just the
 * first) so callers/logs can see the full picture. */
export function validateResponseSafety(responseText: string): SafetyValidationResult {
  const violations = UNSAFE_OUTPUT_PATTERNS.filter(({ pattern }) => pattern.test(responseText)).map(
    ({ label }) => label,
  );
  return { safe: violations.length === 0, violations };
}
