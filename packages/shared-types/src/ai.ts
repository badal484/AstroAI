/**
 * Provider-independent AI Gateway domain types (CLAUDE.md §8/§9/§10,
 * ARCHITECTURE.md §5). Nothing here is provider-specific — that's the
 * entire point: business modules import only these shapes plus the
 * gateway's functions, never a provider SDK.
 */

/** Logical, business-meaning model selectors (CLAUDE.md §9). Application
 * code never references a concrete provider/model id directly — only
 * these. Admin configuration maps each alias to an ordered list of
 * provider/model candidates (primary + fallbacks). */
export const ModelAlias = {
  FAST_CHAT: 'fast-chat',
  SMART_CHAT: 'smart-chat',
  REASONING: 'reasoning',
  VOICE_CHAT: 'voice-chat',
  REPORT_GENERATION: 'report-generation',
  SUMMARIZATION: 'summarization',
  CLASSIFICATION: 'classification',
} as const;
export type ModelAlias = (typeof ModelAlias)[keyof typeof ModelAlias];

export const AIProviderName = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
} as const;
export type AIProviderName = (typeof AIProviderName)[keyof typeof AIProviderName];

/** What a given provider adapter can actually do — the router only ever
 * routes an alias to a candidate whose adapter declares the capability
 * the call needs (e.g. never routes an embedding call to Anthropic, which
 * has no embeddings API). */
export const AICapability = {
  TEXT_GENERATION: 'text_generation',
  STREAMING: 'streaming',
  STRUCTURED_OUTPUT: 'structured_output',
  EMBEDDING: 'embedding',
} as const;
export type AICapability = (typeof AICapability)[keyof typeof AICapability];

/** Normalized failure category — every provider-specific error (OpenAI's
 * `APIError`, Anthropic's `APIError`, Gemini's `ApiError`, network errors,
 * timeouts, ...) is classified into one of these before any retry/fallback
 * decision is made or anything is logged. Callers/users never see a raw
 * provider error (CLAUDE.md §10). */
export const AIErrorCategory = {
  TIMEOUT: 'timeout',
  RATE_LIMITED: 'rate_limited',
  AUTHENTICATION: 'authentication',
  INVALID_REQUEST: 'invalid_request',
  SERVER_ERROR: 'server_error',
  CONTENT_FILTERED: 'content_filtered',
  NOT_CONFIGURED: 'not_configured',
  UNKNOWN: 'unknown',
} as const;
export type AIErrorCategory = (typeof AIErrorCategory)[keyof typeof AIErrorCategory];

export const AIMessageRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;
export type AIMessageRole = (typeof AIMessageRole)[keyof typeof AIMessageRole];

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

/** Metadata every gateway call returns alongside its result — which
 * provider/model actually served the request (never guaranteed to be the
 * alias's primary, since fallback may have kicked in), latency, whether a
 * fallback was used, and token usage where the provider reports it. */
export interface AIResultMeta {
  requestId: string;
  alias: ModelAlias;
  provider: AIProviderName;
  model: string;
  latencyMs: number;
  usedFallback: boolean;
  usage: AIUsage;
}

export interface GenerateTextResult {
  text: string;
  meta: AIResultMeta;
}

export interface StreamTextChunk {
  delta: string;
  done: boolean;
}

export interface GenerateStructuredResult<T> {
  data: T;
  meta: AIResultMeta;
}

export interface ClassifyIntentResult {
  intent: string;
  confidence: number;
  meta: AIResultMeta;
}

export interface EmbedResult {
  embedding: number[];
  meta: AIResultMeta;
}

/** One provider/model candidate in an alias's routing chain. */
export interface AIRoutingCandidate {
  provider: AIProviderName;
  model: string;
}

/** Admin-configurable alias -> ordered candidate list (primary first, then
 * fallbacks), per ARCHITECTURE.md §5. */
export type AIRoutingConfig = Record<ModelAlias, AIRoutingCandidate[]>;
