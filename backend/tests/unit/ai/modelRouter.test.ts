import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AICapability, AIProviderName, ModelAlias } from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { AIGatewayError, AIInvalidRequestError } from '../../../src/shared/errors';
import { aiConfigService } from '../../../src/modules/ai/aiConfig.service';
import type { ProviderAdapter, AIGenerateOutput } from '../../../src/modules/ai/ai.types';
import { routeCall, routeStream } from '../../../src/modules/ai/router/modelRouter';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../../src/modules/ai/registry';

function withStatus(status: number): unknown {
  return Object.assign(new Error('provider error'), { status });
}

function fakeAdapter(
  providerName: AIProviderName,
  capabilities: AICapability[] = [AICapability.TEXT_GENERATION],
) {
  return {
    providerName,
    capabilities: new Set(capabilities),
    generateText: vi.fn(),
    streamText: vi.fn(),
    generateStructured: vi.fn(),
    generateEmbedding: vi.fn(),
  } satisfies ProviderAdapter;
}

function textOutput(text: string): AIGenerateOutput {
  return { text, usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } };
}

async function call(alias: ModelAlias, requestId = 'req-1') {
  return routeCall({
    alias,
    requiredCapability: AICapability.TEXT_GENERATION,
    requestId,
    operation: 'generateText',
    call: (adapter, model, signal) => adapter.generateText({ model, messages: [], signal }),
    extractUsage: (output) => output.usage,
  });
}

beforeEach(async () => {
  await redis.flushall();
  __resetProviderRegistryForTests();
});

describe('routeCall', () => {
  it('uses the primary candidate on success, with usedFallback false', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText.mockResolvedValue(textOutput('hi from openai'));
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: openai });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await call(ModelAlias.FAST_CHAT);

    expect(result.output.text).toBe('hi from openai');
    expect(result.provider).toBe(AIProviderName.OPENAI);
    expect(result.usedFallback).toBe(false);
    expect(openai.generateText).toHaveBeenCalledTimes(1);
  });

  it('retries the same provider once on a SERVER_ERROR before giving up on it', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText
      .mockRejectedValueOnce(withStatus(503))
      .mockResolvedValueOnce(textOutput('recovered'));
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: openai });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await call(ModelAlias.FAST_CHAT);

    expect(result.output.text).toBe('recovered');
    expect(result.usedFallback).toBe(false);
    expect(openai.generateText).toHaveBeenCalledTimes(2);
  });

  it('falls back to the next candidate once the primary exhausts its retries', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText.mockRejectedValue(withStatus(503));
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC);
    anthropic.generateText.mockResolvedValue(textOutput('hi from anthropic'));
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: openai,
      [AIProviderName.ANTHROPIC]: anthropic,
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    const result = await call(ModelAlias.FAST_CHAT);

    expect(result.output.text).toBe('hi from anthropic');
    expect(result.provider).toBe(AIProviderName.ANTHROPIC);
    expect(result.usedFallback).toBe(true);
    expect(openai.generateText).toHaveBeenCalledTimes(2); // one retry, then gave up
    expect(anthropic.generateText).toHaveBeenCalledTimes(1);
  });

  it('skips same-provider retry on RATE_LIMITED and falls back immediately', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText.mockRejectedValue(withStatus(429));
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC);
    anthropic.generateText.mockResolvedValue(textOutput('hi from anthropic'));
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: openai,
      [AIProviderName.ANTHROPIC]: anthropic,
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    const result = await call(ModelAlias.FAST_CHAT);

    expect(result.provider).toBe(AIProviderName.ANTHROPIC);
    expect(openai.generateText).toHaveBeenCalledTimes(1); // no same-provider retry for 429
  });

  it('does not fall back on AUTHENTICATION — aborts immediately', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText.mockRejectedValue(withStatus(401));
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC);
    anthropic.generateText.mockResolvedValue(textOutput('should not be reached'));
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: openai,
      [AIProviderName.ANTHROPIC]: anthropic,
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    await expect(call(ModelAlias.FAST_CHAT)).rejects.toBeInstanceOf(AIGatewayError);
    expect(anthropic.generateText).not.toHaveBeenCalled();
  });

  it('throws AIGatewayError when every candidate fails', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI);
    openai.generateText.mockRejectedValue(withStatus(503));
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC);
    anthropic.generateText.mockRejectedValue(withStatus(503));
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: openai,
      [AIProviderName.ANTHROPIC]: anthropic,
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    await expect(call(ModelAlias.FAST_CHAT)).rejects.toBeInstanceOf(AIGatewayError);
  });

  it('skips a candidate whose provider lacks the required capability', async () => {
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC, [AICapability.TEXT_GENERATION]); // no EMBEDDING
    const openai = fakeAdapter(AIProviderName.OPENAI, [
      AICapability.TEXT_GENERATION,
      AICapability.EMBEDDING,
    ]);
    openai.generateEmbedding.mockResolvedValue({
      embedding: [1, 2, 3],
      usage: { promptTokens: 1 },
    });
    __setProviderRegistryForTests({
      [AIProviderName.ANTHROPIC]: anthropic,
      [AIProviderName.OPENAI]: openai,
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
      { provider: AIProviderName.OPENAI, model: 'text-embedding-3-small' },
    ]);

    const result = await routeCall({
      alias: ModelAlias.CLASSIFICATION,
      requiredCapability: AICapability.EMBEDDING,
      requestId: 'req-1',
      operation: 'generateEmbedding',
      call: (adapter, model, signal) => adapter.generateEmbedding({ model, text: 'hi', signal }),
      extractUsage: () => ({ promptTokens: null, completionTokens: null, totalTokens: null }),
    });

    expect(result.provider).toBe(AIProviderName.OPENAI);
    expect(anthropic.generateEmbedding).not.toHaveBeenCalled();
  });

  it('throws AIInvalidRequestError when no configured candidate supports the required capability', async () => {
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC, [AICapability.TEXT_GENERATION]);
    __setProviderRegistryForTests({ [AIProviderName.ANTHROPIC]: anthropic });
    await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    await expect(
      routeCall({
        alias: ModelAlias.CLASSIFICATION,
        requiredCapability: AICapability.EMBEDDING,
        requestId: 'req-1',
        operation: 'generateEmbedding',
        call: (adapter, model, signal) => adapter.generateEmbedding({ model, text: 'hi', signal }),
        extractUsage: () => ({ promptTokens: null, completionTokens: null, totalTokens: null }),
      }),
    ).rejects.toBeInstanceOf(AIInvalidRequestError);
  });

  it('treats an unconfigured provider as fallback-eligible without an extra retry', async () => {
    // OPENAI never registered as an override -> registry falls back to the
    // real unconfigured-provider default from buildRegistry().
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC);
    anthropic.generateText.mockResolvedValue(textOutput('hi from anthropic'));
    __setProviderRegistryForTests({ [AIProviderName.ANTHROPIC]: anthropic });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    const result = await call(ModelAlias.FAST_CHAT);

    expect(result.provider).toBe(AIProviderName.ANTHROPIC);
    expect(result.usedFallback).toBe(true);
  });
});

describe('routeStream', () => {
  it('streams from the primary provider when it connects successfully', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI, [AICapability.STREAMING]);
    async function* stream() {
      await Promise.resolve();
      yield { delta: 'Hel' };
      yield { delta: 'lo' };
    }
    openai.streamText.mockReturnValue(stream());
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: openai });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
    ]);

    const result = await routeStream({
      alias: ModelAlias.FAST_CHAT,
      requestId: 'req-1',
      operation: 'streamText',
      call: (adapter, model, signal) => adapter.streamText({ model, messages: [], signal }),
    });

    const chunks: string[] = [];
    for await (const chunk of result.stream) chunks.push(chunk.delta);

    expect(chunks).toEqual(['Hel', 'lo']);
    expect(result.provider).toBe(AIProviderName.OPENAI);
    expect(result.usedFallback).toBe(false);
  });

  it('falls back to the next candidate if the primary fails to even connect', async () => {
    const openai = fakeAdapter(AIProviderName.OPENAI, [AICapability.STREAMING]);
    openai.streamText.mockImplementation(() => {
      throw withStatus(503);
    });
    const anthropic = fakeAdapter(AIProviderName.ANTHROPIC, [AICapability.STREAMING]);
    async function* stream() {
      await Promise.resolve();
      yield { delta: 'hi' };
    }
    anthropic.streamText.mockReturnValue(stream());
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: openai,
      [AIProviderName.ANTHROPIC]: anthropic,
    });
    await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
      { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
      { provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-haiku-latest' },
    ]);

    const result = await routeStream({
      alias: ModelAlias.FAST_CHAT,
      requestId: 'req-1',
      operation: 'streamText',
      call: (adapter, model, signal) => adapter.streamText({ model, messages: [], signal }),
    });

    expect(result.provider).toBe(AIProviderName.ANTHROPIC);
    expect(result.usedFallback).toBe(true);
  });
});
