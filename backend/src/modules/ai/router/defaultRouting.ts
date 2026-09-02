import { AIProviderName, ModelAlias, type AIRoutingConfig } from '@astroai/shared-types';

/**
 * Built-in alias -> provider/model routing, used whenever the admin hasn't
 * configured (or hasn't overridden) a given alias yet — CLAUDE.md §34:
 * "Admin must be able to configure ... feature-specific model selection,"
 * which implies the system must already work with sensible defaults
 * before an admin ever touches it, the same way `LOCATION_PROVIDER`/
 * `ASTROLOGY_ENGINE_PROVIDER` default sensibly rather than requiring setup
 * first. Every entry lists a primary plus fallbacks across *different*
 * providers, so a single provider outage never takes an alias down.
 *
 * Model ids will drift as providers release new versions — that's exactly
 * what admin configuration (`aiConfig.service.ts`) is for; this table is
 * only the day-one default, not meant to be hand-edited as models change.
 */
export const DEFAULT_AI_ROUTING: AIRoutingConfig = {
  [ModelAlias.FAST_CHAT]: [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    { provider: AIProviderName.GEMINI, model: 'gemini-2.0-flash' },
    { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
  ],
  [ModelAlias.SMART_CHAT]: [
    { provider: AIProviderName.ANTHROPIC, model: 'claude-sonnet-4-5' },
    { provider: AIProviderName.OPENAI, model: 'gpt-4o' },
    { provider: AIProviderName.GEMINI, model: 'gemini-2.5-pro' },
  ],
  [ModelAlias.REASONING]: [
    { provider: AIProviderName.OPENAI, model: 'o3-mini' },
    { provider: AIProviderName.ANTHROPIC, model: 'claude-sonnet-4-5' },
    { provider: AIProviderName.GEMINI, model: 'gemini-2.5-pro' },
  ],
  [ModelAlias.VOICE_CHAT]: [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    { provider: AIProviderName.GEMINI, model: 'gemini-2.0-flash' },
  ],
  [ModelAlias.REPORT_GENERATION]: [
    { provider: AIProviderName.ANTHROPIC, model: 'claude-sonnet-4-5' },
    { provider: AIProviderName.OPENAI, model: 'gpt-4o' },
  ],
  [ModelAlias.SUMMARIZATION]: [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    { provider: AIProviderName.GEMINI, model: 'gemini-2.0-flash' },
    { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
  ],
  [ModelAlias.CLASSIFICATION]: [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    { provider: AIProviderName.GEMINI, model: 'gemini-2.0-flash' },
  ],
};
