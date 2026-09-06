import type OpenAI from 'openai';
import { AICapability, AIProviderName } from '@astroai/shared-types';
import type {
  AIEmbedInput,
  AIEmbedOutput,
  AIGenerateInput,
  AIGenerateOutput,
  AIStreamChunk,
  AIStructuredInput,
} from '../ai.types';
import type { ProviderAdapter } from '../ai.types';

function toMistralMessages(input: AIGenerateInput): OpenAI.ChatCompletionMessageParam[] {
  return input.messages.map((message) => ({ role: message.role, content: message.content }));
}

/**
 * Real Mistral adapter — uses OpenAI-compatible API interface with Mistral's endpoint.
 */
export function createMistralAdapter(client: OpenAI): ProviderAdapter {
  return {
    providerName: AIProviderName.MISTRAL,
    capabilities: new Set([
      AICapability.TEXT_GENERATION,
      AICapability.STREAMING,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.EMBEDDING,
    ]),

    async generateText(input: AIGenerateInput): Promise<AIGenerateOutput> {
      const response = await client.chat.completions.create(
        {
          model: input.model || 'mistral-small-latest',
          messages: toMistralMessages(input),
          max_completion_tokens: input.maxTokens,
          temperature: input.temperature,
        },
        { signal: input.signal },
      );
      return {
        text: response.choices[0]?.message.content ?? '',
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? null,
          completionTokens: response.usage?.completion_tokens ?? null,
          totalTokens: response.usage?.total_tokens ?? null,
        },
      };
    },

    async *streamText(input: AIGenerateInput): AsyncIterable<AIStreamChunk> {
      const stream = await client.chat.completions.create(
        {
          model: input.model || 'mistral-small-latest',
          messages: toMistralMessages(input),
          max_completion_tokens: input.maxTokens,
          temperature: input.temperature,
          stream: true,
        },
        { signal: input.signal },
      );
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta.content;
        if (delta) yield { delta };
      }
    },

    async generateStructured(input: AIStructuredInput): Promise<AIGenerateOutput> {
      const response = await client.chat.completions.create(
        {
          model: input.model || 'mistral-small-latest',
          messages: toMistralMessages(input),
          max_completion_tokens: input.maxTokens,
          temperature: input.temperature,
          response_format: { type: 'json_object' },
        },
        { signal: input.signal },
      );
      return {
        text: response.choices[0]?.message.content ?? '',
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? null,
          completionTokens: response.usage?.completion_tokens ?? null,
          totalTokens: response.usage?.total_tokens ?? null,
        },
      };
    },

    async generateEmbedding(input: AIEmbedInput): Promise<AIEmbedOutput> {
      const response = await client.embeddings.create(
        { model: input.model || 'mistral-embed', input: input.text },
        { signal: input.signal },
      );
      return {
        embedding: response.data[0]?.embedding ?? [],
        usage: { promptTokens: response.usage?.prompt_tokens ?? null },
      };
    },
  };
}
