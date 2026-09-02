import type { AICapability, AIMessage, AIProviderName } from '@astroai/shared-types';

/** Input a `ProviderAdapter` method receives — already resolved to a
 * concrete provider/model by the router; adapters never see an alias. */
export interface AIGenerateInput {
  model: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Aborts the underlying SDK call — how the router enforces
   * `AI_REQUEST_TIMEOUT_MS` (CLAUDE.md §40) without leaking a hanging
   * request past the point the caller has given up on it. */
  signal: AbortSignal;
}

export interface AIGenerateOutput {
  text: string;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
}

export interface AIStreamChunk {
  delta: string;
}

export interface AIStructuredInput extends AIGenerateInput {
  /** JSON Schema describing the desired output shape, derived from the
   * caller's Zod schema (see gateway/aiGateway.ts) — adapters map this
   * onto whatever native structured-output mechanism the provider offers
   * (OpenAI's `response_format`, Anthropic's forced tool use, Gemini's
   * `responseJsonSchema`). */
  schemaName: string;
  jsonSchema: Record<string, unknown>;
}

export interface AIEmbedInput {
  model: string;
  text: string;
  signal: AbortSignal;
}

export interface AIEmbedOutput {
  embedding: number[];
  usage: { promptTokens: number | null };
}

/**
 * THE provider adapter abstraction (CLAUDE.md §8's hard requirement: no
 * module outside this one ever imports a provider SDK). Every adapter
 * implements this same interface regardless of what's behind it — a real
 * OpenAI/Anthropic/Gemini client, or the unconfigured stand-in used when a
 * provider has no API key set. `capabilities` lets the router know what a
 * given adapter can actually do without trying and failing.
 */
export interface ProviderAdapter {
  readonly providerName: AIProviderName;
  readonly capabilities: ReadonlySet<AICapability>;
  generateText(input: AIGenerateInput): Promise<AIGenerateOutput>;
  streamText(input: AIGenerateInput): AsyncIterable<AIStreamChunk>;
  generateStructured(input: AIStructuredInput): Promise<AIGenerateOutput>;
  generateEmbedding(input: AIEmbedInput): Promise<AIEmbedOutput>;
}
