import { AICapability, type AIProviderName } from '@astroai/shared-types';
import { AIErrorCategory } from '@astroai/shared-types';
import type { ProviderAdapter } from '../ai.types';

/** Thrown by the unconfigured adapter — classified via the
 * `NOT_CONFIGURED` category so the router skips straight to the next
 * fallback candidate without burning a retry, the same treatment a real
 * provider outage would get. Never surfaces raw provider text because
 * there's no provider to begin with (CLAUDE.md §51). */
export class ProviderNotConfiguredError extends Error {
  readonly category = AIErrorCategory.NOT_CONFIGURED;

  constructor(readonly providerName: AIProviderName) {
    super(`AI provider "${providerName}" has no API key configured`);
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * Stand-in used when a provider has no API key set. Every method rejects
 * immediately — cheap to "try" so the router can treat "not configured"
 * as just another fallback-eligible candidate rather than special-casing
 * it everywhere else. Declares EVERY capability (rather than none) on
 * purpose: the router's capability gate skips a candidate whose adapter
 * doesn't declare a given capability *before* ever calling it, so an
 * empty set here would make the router silently skip this candidate
 * instead of attempting it and getting a proper `NOT_CONFIGURED`
 * classification — which matters when it's the only/last candidate in an
 * alias's chain (the caller should see "AI unavailable", not "no
 * candidate supports this capability").
 */
export function createUnconfiguredAdapter(providerName: AIProviderName): ProviderAdapter {
  return {
    providerName,
    capabilities: new Set(Object.values(AICapability)),
    generateText: () => Promise.reject(new ProviderNotConfiguredError(providerName)),
    streamText: () => ({
      [Symbol.asyncIterator]() {
        return {
          next: () => Promise.reject(new ProviderNotConfiguredError(providerName)),
        };
      },
    }),
    generateStructured: () => Promise.reject(new ProviderNotConfiguredError(providerName)),
    generateEmbedding: () => Promise.reject(new ProviderNotConfiguredError(providerName)),
  };
}
