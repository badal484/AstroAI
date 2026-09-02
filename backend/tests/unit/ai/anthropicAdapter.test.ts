import { describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { AICapability, AIMessageRole } from '@astroai/shared-types';
import { createAnthropicAdapter } from '../../../src/modules/ai/providers/anthropic.adapter';

function fakeClient(): Anthropic {
  return { messages: { create: vi.fn() } } as unknown as Anthropic;
}

describe('anthropic adapter', () => {
  it('generateText extracts text-block content and splits system messages out of `messages`', async () => {
    const client = fakeClient();
    vi.mocked(client.messages.create).mockResolvedValue({
      content: [{ type: 'text', text: 'Hello there' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    } as never);

    const adapter = createAnthropicAdapter(client);
    const result = await adapter.generateText({
      model: 'claude-sonnet-4-5',
      messages: [
        { role: AIMessageRole.SYSTEM, content: 'Be nice.' },
        { role: AIMessageRole.USER, content: 'Hi' },
      ],
      signal: new AbortController().signal,
    });

    expect(result).toEqual({
      text: 'Hello there',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });
    const callArgs = vi.mocked(client.messages.create).mock.calls[0]![0] as unknown as Record<
      string,
      unknown
    >;
    expect(callArgs.system).toBe('Be nice.');
    expect(callArgs.messages).toEqual([{ role: 'user', content: 'Hi' }]);
  });

  it('streamText yields normalized text deltas from content_block_delta events', async () => {
    const client = fakeClient();
    function* fakeStream() {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hel' } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'lo' } };
      yield { type: 'message_stop' };
    }
    vi.mocked(client.messages.create).mockResolvedValue(fakeStream() as never);

    const adapter = createAnthropicAdapter(client);
    const chunks: string[] = [];
    for await (const chunk of adapter.streamText({
      model: 'claude-sonnet-4-5',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      signal: new AbortController().signal,
    })) {
      chunks.push(chunk.delta);
    }

    expect(chunks).toEqual(['Hel', 'lo']);
  });

  it('generateStructured forces exactly one tool call shaped by the schema', async () => {
    const client = fakeClient();
    vi.mocked(client.messages.create).mockResolvedValue({
      content: [
        { type: 'tool_use', name: 'intent', input: { intent: 'greeting', confidence: 0.9 } },
      ],
      usage: { input_tokens: 4, output_tokens: 6 },
    } as never);

    const adapter = createAnthropicAdapter(client);
    const result = await adapter.generateStructured({
      model: 'claude-sonnet-4-5',
      messages: [{ role: AIMessageRole.USER, content: 'Hi' }],
      schemaName: 'intent',
      jsonSchema: { type: 'object', properties: { intent: { type: 'string' } } },
      signal: new AbortController().signal,
    });

    expect(JSON.parse(result.text)).toEqual({ intent: 'greeting', confidence: 0.9 });
    const callArgs = vi.mocked(client.messages.create).mock.calls[0]![0] as unknown as Record<
      string,
      unknown
    >;
    expect(callArgs.tool_choice).toEqual({ type: 'tool', name: 'intent' });
  });

  it('does not declare embedding as a supported capability', () => {
    const adapter = createAnthropicAdapter(fakeClient());
    expect(adapter.capabilities.has(AICapability.EMBEDDING)).toBe(false);
    expect(adapter.capabilities.has(AICapability.TEXT_GENERATION)).toBe(true);
  });
});
