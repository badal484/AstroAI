import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { AIProviderName } from '@astroai/shared-types';
import { env } from '../../config/env';
import type { ProviderAdapter } from './ai.types';
import { createAnthropicAdapter } from './providers/anthropic.adapter';
import { createGeminiAdapter } from './providers/gemini.adapter';
import { createOpenAIAdapter } from './providers/openai.adapter';
import { createUnconfiguredAdapter } from './providers/unconfigured.adapter';

/**
 * One adapter instance per provider, built once at module load and reused
 * for the process lifetime (matches how `lib/redis.ts`'s client is a
 * singleton). A provider with no API key configured gets the unconfigured
 * stand-in rather than the process failing to boot — CLAUDE.md's "no fake
 * provider responses" rule, not "no provider may ever be absent."
 */
function buildRegistry(): Record<AIProviderName, ProviderAdapter> {
  return {
    [AIProviderName.OPENAI]: env.OPENAI_API_KEY
      ? createOpenAIAdapter(new OpenAI({ apiKey: env.OPENAI_API_KEY }))
      : createUnconfiguredAdapter(AIProviderName.OPENAI),
    [AIProviderName.ANTHROPIC]: env.ANTHROPIC_API_KEY
      ? createAnthropicAdapter(new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }))
      : createUnconfiguredAdapter(AIProviderName.ANTHROPIC),
    [AIProviderName.GEMINI]: env.GEMINI_API_KEY
      ? createGeminiAdapter(new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }))
      : createUnconfiguredAdapter(AIProviderName.GEMINI),
  };
}

let registry: Record<AIProviderName, ProviderAdapter> | undefined;

export function getProviderAdapter(providerName: AIProviderName): ProviderAdapter {
  registry ??= buildRegistry();
  return registry[providerName];
}

/** Test-only escape hatch — lets router/gateway tests inject fake adapters
 * without touching real provider SDKs or environment variables. */
export function __setProviderRegistryForTests(
  overrides: Partial<Record<AIProviderName, ProviderAdapter>>,
): void {
  registry = { ...buildRegistry(), ...overrides };
}

export function __resetProviderRegistryForTests(): void {
  registry = undefined;
}
