/**
 * Default per-model USD cost rates, per CLAUDE.md §10/§49 ("estimated
 * cost where available"). Prices are per 1M tokens. Like
 * `router/defaultRouting.ts`, this is a day-one default meant to be
 * superseded by admin-configured rates once that UI exists — provider
 * pricing changes independently of this codebase, so hand-maintaining
 * perfect accuracy here isn't the point; having *an* estimate wired
 * through the whole pipeline is.
 */
const RATES_PER_MILLION_TOKENS_USD: Record<string, { prompt: number; completion: number }> = {
  'openai:gpt-4o': { prompt: 2.5, completion: 10 },
  'openai:gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
  'openai:o3-mini': { prompt: 1.1, completion: 4.4 },
  'anthropic:claude-sonnet-4-5': { prompt: 3, completion: 15 },
  'anthropic:claude-3-5-haiku-latest': { prompt: 0.8, completion: 4 },
  'gemini:gemini-2.5-pro': { prompt: 1.25, completion: 10 },
  'gemini:gemini-2.0-flash': { prompt: 0.1, completion: 0.4 },
};

export function estimateCostUsd(
  provider: string,
  model: string,
  promptTokens: number | null,
  completionTokens: number | null,
): number | null {
  if (promptTokens === null && completionTokens === null) return null;

  const rate = RATES_PER_MILLION_TOKENS_USD[`${provider}:${model}`];
  if (!rate) return null;

  const promptCost = ((promptTokens ?? 0) / 1_000_000) * rate.prompt;
  const completionCost = ((completionTokens ?? 0) / 1_000_000) * rate.completion;
  return promptCost + completionCost;
}
