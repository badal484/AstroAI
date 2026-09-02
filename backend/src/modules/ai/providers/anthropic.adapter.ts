import type Anthropic from '@anthropic-ai/sdk';
import { AICapability, AIMessageRole, AIProviderName } from '@astroai/shared-types';
import type {
  AIGenerateInput,
  AIGenerateOutput,
  AIEmbedInput,
  AIEmbedOutput,
  AIStreamChunk,
  AIStructuredInput,
  ProviderAdapter,
} from '../ai.types';

/** Anthropic keeps system prompts out of `messages` entirely, as a
 * separate top-level param — everything else must alternate user/
 * assistant. */
function splitMessages(input: AIGenerateInput): {
  system: string | undefined;
  messages: Anthropic.MessageParam[];
} {
  const system = input.messages
    .filter((message) => message.role === AIMessageRole.SYSTEM)
    .map((message) => message.content)
    .join('\n\n');

  const messages: Anthropic.MessageParam[] = input.messages
    .filter((message) => message.role !== AIMessageRole.SYSTEM)
    .map((message) => ({
      role: message.role === AIMessageRole.ASSISTANT ? 'assistant' : 'user',
      content: message.content,
    }));

  return { system: system.length > 0 ? system : undefined, messages };
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

const DEFAULT_MAX_TOKENS = 1024;

/**
 * Real Anthropic adapter. Structured output has no dedicated API on
 * Claude the way OpenAI/Gemini have a JSON-schema response mode — the
 * idiomatic equivalent is forcing exactly one tool call whose input
 * schema IS the desired output shape, which is what this does.
 */
export function createAnthropicAdapter(client: Anthropic): ProviderAdapter {
  return {
    providerName: AIProviderName.ANTHROPIC,
    capabilities: new Set([
      AICapability.TEXT_GENERATION,
      AICapability.STREAMING,
      AICapability.STRUCTURED_OUTPUT,
    ]),

    async generateText(input: AIGenerateInput): Promise<AIGenerateOutput> {
      const { system, messages } = splitMessages(input);
      const response = await client.messages.create(
        {
          model: input.model,
          max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: input.temperature,
          system,
          messages,
        },
        { signal: input.signal },
      );
      return {
        text: extractText(response.content),
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    },

    async *streamText(input: AIGenerateInput): AsyncIterable<AIStreamChunk> {
      const { system, messages } = splitMessages(input);
      const stream = await client.messages.create(
        {
          model: input.model,
          max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: input.temperature,
          system,
          messages,
          stream: true,
        },
        { signal: input.signal },
      );
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { delta: event.delta.text };
        }
      }
    },

    async generateStructured(input: AIStructuredInput): Promise<AIGenerateOutput> {
      const { system, messages } = splitMessages(input);
      const response = await client.messages.create(
        {
          model: input.model,
          max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: input.temperature,
          system,
          messages,
          tools: [
            {
              name: input.schemaName,
              input_schema: input.jsonSchema as Anthropic.Tool['input_schema'],
            },
          ],
          tool_choice: { type: 'tool', name: input.schemaName },
        },
        { signal: input.signal },
      );
      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );
      return {
        text: toolUse ? JSON.stringify(toolUse.input) : '',
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    },

    // Anthropic has no first-party embeddings API — this capability is
    // deliberately absent from `capabilities` above, so the router never
    // routes an embedding call here in the first place; this method exists
    // only to satisfy the interface shape and should be unreachable.
    generateEmbedding(_input: AIEmbedInput): Promise<AIEmbedOutput> {
      return Promise.reject(new Error('Anthropic does not support embeddings'));
    },
  };
}
