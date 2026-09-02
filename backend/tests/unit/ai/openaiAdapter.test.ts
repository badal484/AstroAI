import { describe, expect, it, vi } from 'vitest';
import type OpenAI from 'openai';
import { AICapability, AIMessageRole } from '@astroai/shared-types';
import { createOpenAIAdapter } from '../../../src/modules/ai/providers/openai.adapter';

function fakeClient(overrides: Partial<OpenAI> = {}): OpenAI {
  return {
    chat: { completions: { create: vi.fn() } },
    embeddings: { create: vi.fn() },
    ...overrides,
  } as unknown as OpenAI;
}

describe('openai adapter', () => {
  it('generateText normalizes the response and usage', async () => {
    const client = fakeClient();
    vi.mocked(client.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: 'Hello there' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    } as never);

    const adapter = createOpenAIAdapter(client);
    const result = await adapter.generateText({
      model: 'gpt-4o-mini',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      signal: new AbortController().signal,
    });

    expect(result).toEqual({
      text: 'Hello there',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });
  });

  it('generateText tolerates missing usage data', async () => {
    const client = fakeClient();
    vi.mocked(client.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: 'Hi' } }],
      usage: undefined,
    } as never);

    const adapter = createOpenAIAdapter(client);
    const result = await adapter.generateText({
      model: 'gpt-4o-mini',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      signal: new AbortController().signal,
    });

    expect(result.usage).toEqual({ promptTokens: null, completionTokens: null, totalTokens: null });
  });

  it('streamText yields normalized deltas', async () => {
    const client = fakeClient();
    function* fakeStream() {
      yield { choices: [{ delta: { content: 'Hel' } }] };
      yield { choices: [{ delta: { content: 'lo' } }] };
      yield { choices: [{ delta: {} }] };
    }
    vi.mocked(client.chat.completions.create).mockResolvedValue(fakeStream() as never);

    const adapter = createOpenAIAdapter(client);
    const chunks: string[] = [];
    for await (const chunk of adapter.streamText({
      model: 'gpt-4o-mini',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      signal: new AbortController().signal,
    })) {
      chunks.push(chunk.delta);
    }

    expect(chunks).toEqual(['Hel', 'lo']);
  });

  it('generateStructured sends a json_schema response_format and returns raw JSON text', async () => {
    const client = fakeClient();
    vi.mocked(client.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: '{"intent":"greeting","confidence":0.9}' } }],
      usage: { prompt_tokens: 4, completion_tokens: 6, total_tokens: 10 },
    } as never);

    const adapter = createOpenAIAdapter(client);
    const result = await adapter.generateStructured({
      model: 'gpt-4o-mini',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      schemaName: 'intent',
      jsonSchema: { type: 'object', properties: { intent: { type: 'string' } } },
      signal: new AbortController().signal,
    });

    expect(result.text).toBe('{"intent":"greeting","confidence":0.9}');
    const callArgs = vi.mocked(client.chat.completions.create).mock
      .calls[0]![0] as unknown as Record<string, unknown>;
    expect(callArgs.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: { name: 'intent' },
    });
  });

  it('generateEmbedding normalizes the response', async () => {
    const client = fakeClient();
    vi.mocked(client.embeddings.create).mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      usage: { prompt_tokens: 3 },
    } as never);

    const adapter = createOpenAIAdapter(client);
    const result = await adapter.generateEmbedding({
      model: 'text-embedding-3-small',
      text: 'hello',
      signal: new AbortController().signal,
    });

    expect(result).toEqual({ embedding: [0.1, 0.2, 0.3], usage: { promptTokens: 3 } });
  });

  it('declares the capabilities it actually supports', () => {
    const adapter = createOpenAIAdapter(fakeClient());
    expect(adapter.capabilities.has(AICapability.TEXT_GENERATION)).toBe(true);
    expect(adapter.capabilities.has(AICapability.EMBEDDING)).toBe(true);
  });
});
