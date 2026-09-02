import { beforeEach, describe, expect, it } from 'vitest';
import { AICapability, AIMessageRole, AIProviderName, ModelAlias } from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { aiConfigService } from '../../../src/modules/ai/aiConfig.service';
import { aiGateway } from '../../../src/modules/ai/gateway/aiGateway';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../../src/modules/ai/registry';
import type { ProviderAdapter } from '../../../src/modules/ai/ai.types';

/**
 * Stands in for a real business module (chat/reports/horoscope/...) that
 * would live in its own module and call the gateway. It is written ONCE,
 * imports nothing provider-specific, and is never touched again in this
 * file — the whole point of the test below is that admin-level routing
 * config, not this function, is what changes when a provider is switched
 * (CLAUDE.md §8: "no module ever imports a provider SDK directly").
 */
async function summarizeArticle(articleText: string) {
  const result = await aiGateway.generateText({
    alias: ModelAlias.SUMMARIZATION,
    messages: [
      { role: AIMessageRole.SYSTEM, content: 'Summarize the following article in one sentence.' },
      { role: AIMessageRole.USER, content: articleText },
    ],
  });
  return result;
}

function adapterThatReturns(providerName: AIProviderName, text: string): ProviderAdapter {
  return {
    providerName,
    capabilities: new Set([AICapability.TEXT_GENERATION]),
    generateText: () =>
      Promise.resolve({ text, usage: { promptTokens: 20, completionTokens: 8, totalTokens: 28 } }),
    streamText: () => ({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.reject(new Error('not used in this test')),
      }),
    }),
    generateStructured: () => Promise.reject(new Error('not used in this test')),
    generateEmbedding: () => Promise.reject(new Error('not used in this test')),
  };
}

beforeEach(async () => {
  await redis.flushall();
  __resetProviderRegistryForTests();
});

describe('switching providers behind an alias', () => {
  it('lets the same business function work unchanged when admin config moves an alias from OpenAI to Anthropic to Gemini', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: adapterThatReturns(AIProviderName.OPENAI, 'OpenAI summary.'),
      [AIProviderName.ANTHROPIC]: adapterThatReturns(
        AIProviderName.ANTHROPIC,
        'Anthropic summary.',
      ),
      [AIProviderName.GEMINI]: adapterThatReturns(AIProviderName.GEMINI, 'Gemini summary.'),
    });

    // --- Round 1: admin has SUMMARIZATION routed to OpenAI ---
    await aiConfigService.setRoutingCandidates(ModelAlias.SUMMARIZATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);
    const openaiResult = await summarizeArticle('Long article text...');
    expect(openaiResult.text).toBe('OpenAI summary.');
    expect(openaiResult.meta.provider).toBe(AIProviderName.OPENAI);

    // --- Round 2: admin repoints the SAME alias at Anthropic ---
    // (this is the only thing that changes between rounds — no import, no
    // conditional, no code path in `summarizeArticle` or anywhere else
    // differs between this call and the one above)
    await aiConfigService.setRoutingCandidates(ModelAlias.SUMMARIZATION, [
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);
    const anthropicResult = await summarizeArticle('Long article text...');
    expect(anthropicResult.text).toBe('Anthropic summary.');
    expect(anthropicResult.meta.provider).toBe(AIProviderName.ANTHROPIC);

    // --- Round 3: admin repoints it again, at Gemini ---
    await aiConfigService.setRoutingCandidates(ModelAlias.SUMMARIZATION, [
      { provider: AIProviderName.GEMINI, model: 'gemini-2.0-flash' },
    ]);
    const geminiResult = await summarizeArticle('Long article text...');
    expect(geminiResult.text).toBe('Gemini summary.');
    expect(geminiResult.meta.provider).toBe(AIProviderName.GEMINI);

    // Every call went through the identical business-facing shape —
    // `summarizeArticle` never knew which provider actually served it.
    for (const result of [openaiResult, anthropicResult, geminiResult]) {
      expect(Object.keys(result).sort()).toEqual(['meta', 'text']);
      expect(Object.keys(result.meta).sort()).toEqual(
        ['alias', 'latencyMs', 'model', 'provider', 'requestId', 'usage', 'usedFallback'].sort(),
      );
    }
  });

  it('fails over to a fallback provider transparently — the caller only sees a successful result', async () => {
    const failingOpenAI: ProviderAdapter = {
      providerName: AIProviderName.OPENAI,
      capabilities: new Set([AICapability.TEXT_GENERATION]),
      generateText: () => Promise.reject(Object.assign(new Error('down'), { status: 503 })),
      streamText: () => ({
        [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new Error('not used')) }),
      }),
      generateStructured: () => Promise.reject(new Error('not used')),
      generateEmbedding: () => Promise.reject(new Error('not used')),
    };
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: failingOpenAI,
      [AIProviderName.ANTHROPIC]: adapterThatReturns(
        AIProviderName.ANTHROPIC,
        'Anthropic summary.',
      ),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.SUMMARIZATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    const result = await summarizeArticle('Long article text...');

    expect(result.text).toBe('Anthropic summary.');
    expect(result.meta.provider).toBe(AIProviderName.ANTHROPIC);
    expect(result.meta.usedFallback).toBe(true);
  });
});
