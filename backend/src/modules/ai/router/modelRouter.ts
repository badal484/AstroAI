import {
  AICapability,
  type AIErrorCategory,
  type AIProviderName,
  type ModelAlias,
} from '@astroai/shared-types';
import { env } from '../../../config/env';
import { AIGatewayError, AIInvalidRequestError } from '../../../shared/errors';
import type { AIStreamChunk, ProviderAdapter } from '../ai.types';
import { aiConfigService } from '../aiConfig.service';
import { aiUsageService } from '../aiUsage.service';
import { getProviderAdapter } from '../registry';
import { classifyProviderError, type ClassifiedError } from '../providers/classifyError';

// A candidate gets one retry (two attempts total) on a same-provider-
// retryable category before the router moves on to the next fallback
// (CLAUDE.md §40 "retry where appropriate" + §10 "fallback").
const MAX_SAME_PROVIDER_ATTEMPTS = 2;
const RETRY_BACKOFF_BASE_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface UsageMetrics {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

const NO_USAGE: UsageMetrics = { promptTokens: null, completionTokens: null, totalTokens: null };

interface RouteCallParams<TOutput> {
  alias: ModelAlias;
  requiredCapability: AICapability;
  requestId: string;
  operation: string;
  timeoutMs?: number;
  call: (adapter: ProviderAdapter, model: string, signal: AbortSignal) => Promise<TOutput>;
  extractUsage: (output: TOutput) => UsageMetrics;
}

export interface RouteResult<TOutput> {
  output: TOutput;
  provider: AIProviderName;
  model: string;
  usedFallback: boolean;
}

function gatewayFailure(
  alias: ModelAlias,
  attempted: AIProviderName[],
  lastError?: ClassifiedError,
): never {
  if (!lastError) {
    throw new AIInvalidRequestError(
      `No configured provider for alias "${alias}" supports the required capability`,
    );
  }
  throw new AIGatewayError({ alias, category: lastError.category, attemptedProviders: attempted });
}

/**
 * Runs one call (generateText/generateStructured/generateEmbedding — any
 * promise-returning adapter method) across an alias's configured
 * candidates: same-provider retry on transient errors, then fallback to
 * the next candidate, normalizing every failure before it's ever visible
 * outside this module (ARCHITECTURE.md §5).
 */
export async function routeCall<TOutput>(
  params: RouteCallParams<TOutput>,
): Promise<RouteResult<TOutput>> {
  const candidates = await aiConfigService.getRoutingCandidates(params.alias);
  const timeoutMs = params.timeoutMs ?? env.AI_REQUEST_TIMEOUT_MS;
  const attempted: AIProviderName[] = [];
  let lastError: ClassifiedError | undefined;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    const adapter = getProviderAdapter(candidate.provider);
    if (!adapter.capabilities.has(params.requiredCapability)) continue;

    attempted.push(candidate.provider);
    let attemptError: ClassifiedError | undefined;

    for (let attempt = 1; attempt <= MAX_SAME_PROVIDER_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const startedAt = Date.now();
      try {
        const output = await params.call(adapter, candidate.model, controller.signal);
        clearTimeout(timer);
        const usage = params.extractUsage(output);
        aiUsageService.record({
          requestId: params.requestId,
          alias: params.alias,
          provider: candidate.provider,
          model: candidate.model,
          operation: params.operation,
          latencyMs: Date.now() - startedAt,
          success: true,
          usedFallback: i > 0,
          errorCategory: null,
          ...usage,
        });
        return {
          output,
          provider: candidate.provider,
          model: candidate.model,
          usedFallback: i > 0,
        };
      } catch (rawError) {
        clearTimeout(timer);
        const classified = classifyProviderError(rawError);
        attemptError = classified;
        aiUsageService.record({
          requestId: params.requestId,
          alias: params.alias,
          provider: candidate.provider,
          model: candidate.model,
          operation: params.operation,
          latencyMs: Date.now() - startedAt,
          success: false,
          usedFallback: i > 0,
          errorCategory: classified.category,
          ...NO_USAGE,
        });
        if (!classified.retryableSameProvider || attempt === MAX_SAME_PROVIDER_ATTEMPTS) break;
        await delay(RETRY_BACKOFF_BASE_MS * 2 ** (attempt - 1));
      }
    }

    lastError = attemptError;
    if (attemptError && !attemptError.fallbackEligible) {
      gatewayFailure(params.alias, attempted, attemptError);
    }
  }

  gatewayFailure(params.alias, attempted, lastError);
}

interface RouteStreamParams {
  alias: ModelAlias;
  requestId: string;
  operation: string;
  timeoutMs?: number;
  call: (
    adapter: ProviderAdapter,
    model: string,
    signal: AbortSignal,
  ) => AsyncIterable<AIStreamChunk>;
}

export interface RouteStreamResult {
  stream: AsyncIterable<AIStreamChunk>;
  provider: AIProviderName;
  model: string;
  usedFallback: boolean;
}

/**
 * Streaming's fallback window is necessarily narrower than `routeCall`'s:
 * once the caller has started receiving chunks, silently swapping
 * providers mid-stream isn't possible (a client may already be relaying
 * partial output over Socket.IO — ARCHITECTURE.md §5's "streaming"
 * section). So fallback/retry only covers establishing the stream and
 * pulling its first chunk; failures after that point propagate directly
 * (still normalized) rather than being retried.
 */
export async function routeStream(params: RouteStreamParams): Promise<RouteStreamResult> {
  const candidates = await aiConfigService.getRoutingCandidates(params.alias);
  const timeoutMs = params.timeoutMs ?? env.AI_REQUEST_TIMEOUT_MS;
  const attempted: AIProviderName[] = [];
  let lastError: ClassifiedError | undefined;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    const adapter = getProviderAdapter(candidate.provider);
    if (!adapter.capabilities.has(AICapability.STREAMING)) continue;

    attempted.push(candidate.provider);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const iterable = params.call(adapter, candidate.model, controller.signal);
      const iterator = iterable[Symbol.asyncIterator]();
      const first = await iterator.next();
      clearTimeout(timer);

      const provider = candidate.provider;
      const model = candidate.model;
      const usedFallback = i > 0;
      const operation = params.operation;
      const requestId = params.requestId;
      const alias = params.alias;

      async function* wrapped(): AsyncIterable<AIStreamChunk> {
        try {
          if (!first.done) yield first.value;
          for (;;) {
            const next = await iterator.next();
            if (next.done) break;
            yield next.value;
          }
          aiUsageService.record({
            requestId,
            alias,
            provider,
            model,
            operation,
            latencyMs: Date.now() - startedAt,
            success: true,
            usedFallback,
            errorCategory: null,
            ...NO_USAGE,
          });
        } catch (streamError) {
          const classified = classifyProviderError(streamError);
          aiUsageService.record({
            requestId,
            alias,
            provider,
            model,
            operation,
            latencyMs: Date.now() - startedAt,
            success: false,
            usedFallback,
            errorCategory: classified.category,
            ...NO_USAGE,
          });
          throw new AIGatewayError({
            alias,
            category: classified.category,
            attemptedProviders: [provider],
          });
        }
      }

      return { stream: wrapped(), provider, model, usedFallback };
    } catch (rawError) {
      clearTimeout(timer);
      const classified = classifyProviderError(rawError);
      lastError = classified;
      aiUsageService.record({
        requestId: params.requestId,
        alias: params.alias,
        provider: candidate.provider,
        model: candidate.model,
        operation: params.operation,
        latencyMs: Date.now() - startedAt,
        success: false,
        usedFallback: i > 0,
        errorCategory: classified.category,
        ...NO_USAGE,
      });
      if (!classified.fallbackEligible) {
        gatewayFailure(params.alias, attempted, classified);
      }
    }
  }

  gatewayFailure(params.alias, attempted, lastError);
}

export type { ClassifiedError, AIErrorCategory };
