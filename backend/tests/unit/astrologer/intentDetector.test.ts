import { beforeEach, describe, expect, it } from 'vitest';
import { AICapability, AIProviderName, IntentCategory, ModelAlias } from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { aiConfigService } from '../../../src/modules/ai/aiConfig.service';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../../src/modules/ai/registry';
import type { ProviderAdapter } from '../../../src/modules/ai/ai.types';
import { detectIntent } from '../../../src/modules/astrologer/detection/intentDetector';

function fakeClassifierAdapter(response: { intent: string; confidence: number }): ProviderAdapter {
  return {
    providerName: AIProviderName.OPENAI,
    capabilities: new Set([AICapability.STRUCTURED_OUTPUT]),
    generateText: () => Promise.reject(new Error('not used in this test')),
    streamText: () => ({
      [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new Error('not used')) }),
    }),
    generateStructured: () =>
      Promise.resolve({
        text: JSON.stringify(response),
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      }),
    generateEmbedding: () => Promise.reject(new Error('not used in this test')),
  };
}

const unconfiguredAdapter: ProviderAdapter = {
  providerName: AIProviderName.OPENAI,
  capabilities: new Set(),
  generateText: () => Promise.reject(new Error('unconfigured')),
  streamText: () => ({
    [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new Error('unconfigured')) }),
  }),
  generateStructured: () => Promise.reject(new Error('unconfigured')),
  generateEmbedding: () => Promise.reject(new Error('unconfigured')),
};

beforeEach(async () => {
  await redis.flushall();
  __resetProviderRegistryForTests();
});

describe('detectIntent', () => {
  it('detects crisis/self-harm language deterministically, without calling the AI Gateway', async () => {
    const adapter = fakeClassifierAdapter({ intent: IntentCategory.LOVE, confidence: 0.9 });
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: adapter });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await detectIntent('I want to end my life');

    expect(result.intent).toBe(IntentCategory.CRISIS_SELF_HARM);
    expect(result.source).toBe('keyword');
  });

  it('detects clearly unsafe requests deterministically, without calling the AI Gateway', async () => {
    const adapter = fakeClassifierAdapter({
      intent: IntentCategory.GENERAL_ASTROLOGY,
      confidence: 0.9,
    });
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: adapter });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await detectIntent('how to make a bomb');

    expect(result.intent).toBe(IntentCategory.UNSAFE);
    expect(result.source).toBe('keyword');
  });

  it('uses the AI Gateway to classify an ordinary question', async () => {
    const adapter = fakeClassifierAdapter({ intent: IntentCategory.CAREER, confidence: 0.87 });
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: adapter });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await detectIntent('Will I get a promotion this year?');

    expect(result.intent).toBe(IntentCategory.CAREER);
    expect(result.confidence).toBe(0.87);
    expect(result.source).toBe('ai');
  });

  it('falls back to keyword classification when the AI Gateway is unavailable', async () => {
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: unconfiguredAdapter });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await detectIntent('When will I get married?');

    expect(result.intent).toBe(IntentCategory.MARRIAGE);
    expect(result.source).toBe('fallback');
  });

  it('falls back to UNCLEAR when nothing matches and AI is unavailable', async () => {
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: unconfiguredAdapter });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await detectIntent('hmm okay I guess');

    expect(result.intent).toBe(IntentCategory.UNCLEAR);
    expect(result.source).toBe('fallback');
  });
});
