import type { AIProviderName } from '@astroai/shared-types';
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
 * it everywhere else.
 */
export function createUnconfiguredAdapter(providerName: AIProviderName): ProviderAdapter {
  return {
    providerName,
    capabilities: new Set(),
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
