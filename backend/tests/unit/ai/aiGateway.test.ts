import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AICapability, AIMessageRole, AIProviderName, ModelAlias } from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { AIInvalidRequestError } from '../../../src/shared/errors';
import { aiConfigService } from '../../../src/modules/ai/aiConfig.service';
import { aiGateway } from '../../../src/modules/ai/gateway/aiGateway';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../../src/modules/ai/registry';
import type { ProviderAdapter } from '../../../src/modules/ai/ai.types';

function fakeAdapter(
  providerName: AIProviderName,
  overrides: Partial<ProviderAdapter> = {},
): ProviderAdapter {
  return {
    providerName,
    capabilities: new Set([
      AICapability.TEXT_GENERATION,
      AICapability.STREAMING,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.EMBEDDING,
    ]),
    generateText: () => Promise.reject(new Error('not implemented')),
    streamText: () => ({
      [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new Error('not implemented')) }),
    }),
    generateStructured: () => Promise.reject(new Error('not implemented')),
    generateEmbedding: () => Promise.reject(new Error('not implemented')),
    ...overrides,
  };
}

beforeEach(async () => {
  await redis.flushall();
  __resetProviderRegistryForTests();
});

describe('aiGateway.generateText', () => {
  it('returns text plus full meta (provider, model, usage, requestId)', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        generateText: () =>
          Promise.resolve({
            text: 'Hello!',
            usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5 },
          }),
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await aiGateway.generateText({
      alias: ModelAlias.FAST_CHAT,
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      requestId: 'req-abc',
    });

    expect(result.text).toBe('Hello!');
    expect(result.meta).toMatchObject({
      requestId: 'req-abc',
      alias: ModelAlias.FAST_CHAT,
      provider: AIProviderName.OPENAI,
      model: 'gpt-4o-mini',
      usedFallback: false,
      usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5 },
    });
  });

  it('rejects an empty messages array before ever calling a provider', async () => {
    await expect(
      aiGateway.generateText({ alias: ModelAlias.FAST_CHAT, messages: [] }),
    ).rejects.toBeInstanceOf(AIInvalidRequestError);
  });

  it('generates a requestId automatically when the caller does not supply one', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        generateText: () =>
          Promise.resolve({
            text: 'Hi',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          }),
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await aiGateway.generateText({
      alias: ModelAlias.FAST_CHAT,
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
    });

    expect(typeof result.meta.requestId).toBe('string');
    expect(result.meta.requestId.length).toBeGreaterThan(0);
  });
});

describe('aiGateway.streamText', () => {
  it('yields normalized chunks followed by a final done sentinel', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        streamText: async function* streamText() {
          await Promise.resolve();
          yield { delta: 'Hel' };
          yield { delta: 'lo' };
        },
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const chunks = [];
    for await (const chunk of aiGateway.streamText({
      alias: ModelAlias.FAST_CHAT,
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      { delta: 'Hel', done: false },
      { delta: 'lo', done: false },
      { delta: '', done: true },
    ]);
  });
});

describe('aiGateway.generateStructured', () => {
  const schema = z.object({ mood: z.enum(['happy', 'sad']), score: z.number() });

  it('parses and validates the provider response against the given Zod schema', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        generateStructured: () =>
          Promise.resolve({
            text: '{"mood":"happy","score":0.8}',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          }),
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await aiGateway.generateStructured({
      alias: ModelAlias.CLASSIFICATION,
      messages: [{ role: AIMessageRole.USER, content: 'I feel great' }],
      schema,
      schemaName: 'mood_result',
    });

    expect(result.data).toEqual({ mood: 'happy', score: 0.8 });
  });

  it('throws AIInvalidRequestError when the provider response is not valid JSON', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        generateStructured: () =>
          Promise.resolve({
            text: 'not json',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          }),
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    await expect(
      aiGateway.generateStructured({
        alias: ModelAlias.CLASSIFICATION,
        messages: [{ role: AIMessageRole.USER, content: 'hi' }],
        schema,
        schemaName: 'mood_result',
      }),
    ).rejects.toBeInstanceOf(AIInvalidRequestError);
  });

  it('throws AIInvalidRequestError when the provider response does not match the schema', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        generateStructured: () =>
          Promise.resolve({
            text: '{"mood":"furious","score":"not-a-number"}',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          }),
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    await expect(
      aiGateway.generateStructured({
        alias: ModelAlias.CLASSIFICATION,
        messages: [{ role: AIMessageRole.USER, content: 'hi' }],
        schema,
        schemaName: 'mood_result',
      }),
    ).rejects.toBeInstanceOf(AIInvalidRequestError);
  });
});

describe('aiGateway.classifyIntent', () => {
  it('builds a fixed intent/confidence schema on top of generateStructured', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        generateStructured: () =>
          Promise.resolve({
            text: '{"intent":"career","confidence":0.75}',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          }),
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await aiGateway.classifyIntent({
      text: 'Will I get a promotion this year?',
      labels: ['career', 'love', 'health'],
    });

    expect(result.intent).toBe('career');
    expect(result.confidence).toBe(0.75);
  });
});

describe('aiGateway.generateEmbedding', () => {
  it('returns the embedding vector and token usage', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter(AIProviderName.OPENAI, {
        generateEmbedding: () =>
          Promise.resolve({ embedding: [0.1, 0.2], usage: { promptTokens: 4 } }),
      }),
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.SUMMARIZATION, [
      { provider: AIProviderName.OPENAI, model: 'text-embedding-3-small' },
    ]);

    const result = await aiGateway.generateEmbedding({
      alias: ModelAlias.SUMMARIZATION,
      text: 'hi',
    });

    expect(result.embedding).toEqual([0.1, 0.2]);
    expect(result.meta.usage.promptTokens).toBe(4);
  });

  it('rejects empty text before calling a provider', async () => {
    await expect(
      aiGateway.generateEmbedding({ alias: ModelAlias.SUMMARIZATION, text: '' }),
    ).rejects.toBeInstanceOf(AIInvalidRequestError);
  });
});
