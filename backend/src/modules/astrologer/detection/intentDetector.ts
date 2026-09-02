import { IntentCategory, ModelAlias } from '@astroai/shared-types';
import { aiGateway } from '../../ai';
import { containsCrisisLanguage } from './crisisPatterns';
import { containsUnsafeLanguage } from './unsafePatterns';
import { classifyIntentByKeywords } from './keywordIntentFallback';

export interface IntentDetectionResult {
  intent: IntentCategory;
  confidence: number;
  /** `keyword` = matched a deterministic safety pattern (no AI call made
   * at all); `ai` = classified by the AI Gateway; `fallback` = AI
   * classification failed/unavailable, used the keyword heuristic. */
  source: 'keyword' | 'ai' | 'fallback';
}

const ALL_INTENT_LABELS = Object.values(IntentCategory) as [IntentCategory, ...IntentCategory[]];

function isKnownIntent(value: string): value is IntentCategory {
  return (Object.values(IntentCategory) as string[]).includes(value);
}

/**
 * Two-stage detection. Stage one is deterministic and safety-critical
 * (CLAUDE.md §17) — it runs unconditionally, before any AI call, and
 * never depends on a provider being configured. Stage two (AI
 * classification) still includes `crisis_self_harm`/`unsafe` as possible
 * labels as a second-opinion net for phrasings the keyword list misses,
 * but stage one being a match is always sufficient on its own.
 */
export async function detectIntent(
  text: string,
  requestId?: string,
): Promise<IntentDetectionResult> {
  if (containsCrisisLanguage(text)) {
    return { intent: IntentCategory.CRISIS_SELF_HARM, confidence: 1, source: 'keyword' };
  }
  if (containsUnsafeLanguage(text)) {
    return { intent: IntentCategory.UNSAFE, confidence: 1, source: 'keyword' };
  }

  try {
    const result = await aiGateway.classifyIntent({
      text,
      labels: ALL_INTENT_LABELS,
      alias: ModelAlias.CLASSIFICATION,
      requestId,
    });
    const intent = isKnownIntent(result.intent) ? result.intent : IntentCategory.UNCLEAR;
    return { intent, confidence: result.confidence, source: 'ai' };
  } catch {
    return { intent: classifyIntentByKeywords(text), confidence: 0.3, source: 'fallback' };
  }
}
