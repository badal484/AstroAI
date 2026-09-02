import { describe, expect, it, vi } from 'vitest';
import type { GoogleGenAI } from '@google/genai';
import { AICapability, AIMessageRole } from '@astroai/shared-types';
import { createGeminiAdapter } from '../../../src/modules/ai/providers/gemini.adapter';

function fakeClient(): GoogleGenAI {
  return {
    models: { generateContent: vi.fn(), generateContentStream: vi.fn(), embedContent: vi.fn() },
  } as unknown as GoogleGenAI;
}

describe('gemini adapter', () => {
  it('generateText normalizes the response and maps assistant -> model role', async () => {
    const client = fakeClient();
    vi.mocked(client.models.generateContent).mockResolvedValue({
      text: 'Hello there',
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
    } as never);

    const adapter = createGeminiAdapter(client);
    const result = await adapter.generateText({
      model: 'gemini-2.0-flash',
      messages: [
        { role: AIMessageRole.SYSTEM, content: 'Be nice.' },
        { role: AIMessageRole.ASSISTANT, content: 'Earlier reply' },
        { role: AIMessageRole.USER, content: 'Hi' },
      ],
      signal: new AbortController().signal,
    });

    expect(result).toEqual({
      text: 'Hello there',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });
    const callArgs = vi.mocked(client.models.generateContent).mock.calls[0]![0];
    expect(callArgs.config?.systemInstruction).toBe('Be nice.');
    expect(callArgs.contents).toEqual([
      { role: 'model', parts: [{ text: 'Earlier reply' }] },
      { role: 'user', parts: [{ text: 'Hi' }] },
    ]);
  });

  it('streamText yields normalized deltas', async () => {
    const client = fakeClient();
    function* fakeStream() {
      yield { text: 'Hel' };
      yield { text: 'lo' };
    }
    vi.mocked(client.models.generateContentStream).mockResolvedValue(fakeStream() as never);

    const adapter = createGeminiAdapter(client);
    const chunks: string[] = [];
    for await (const chunk of adapter.streamText({
      model: 'gemini-2.0-flash',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      signal: new AbortController().signal,
    })) {
      chunks.push(chunk.delta);
    }

    expect(chunks).toEqual(['Hel', 'lo']);
  });

  it('generateStructured requests application/json with the given JSON schema', async () => {
    const client = fakeClient();
    vi.mocked(client.models.generateContent).mockResolvedValue({
      text: '{"intent":"greeting","confidence":0.9}',
      usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 6, totalTokenCount: 10 },
    } as never);

    const adapter = createGeminiAdapter(client);
    const result = await adapter.generateStructured({
      model: 'gemini-2.0-flash',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      schemaName: 'intent',
      jsonSchema: { type: 'object', properties: { intent: { type: 'string' } } },
      signal: new AbortController().signal,
    });

    expect(result.text).toBe('{"intent":"greeting","confidence":0.9}');
    const callArgs = vi.mocked(client.models.generateContent).mock.calls[0]![0];
    expect(callArgs.config?.responseMimeType).toBe('application/json');
    expect(callArgs.config?.responseJsonSchema).toEqual({
      type: 'object',
      properties: { intent: { type: 'string' } },
    });
  });

  it('generateEmbedding normalizes the response', async () => {
    const client = fakeClient();
    vi.mocked(client.models.embedContent).mockResolvedValue({
      embeddings: [{ values: [0.1, 0.2, 0.3] }],
    });

    const adapter = createGeminiAdapter(client);
    const result = await adapter.generateEmbedding({
      model: 'text-embedding-004',
      text: 'hello',
      signal: new AbortController().signal,
    });

    expect(result).toEqual({ embedding: [0.1, 0.2, 0.3], usage: { promptTokens: null } });
  });

  it('declares embedding and structured output as supported capabilities', () => {
    const adapter = createGeminiAdapter(fakeClient());
    expect(adapter.capabilities.has(AICapability.EMBEDDING)).toBe(true);
    expect(adapter.capabilities.has(AICapability.STRUCTURED_OUTPUT)).toBe(true);
  });
});
