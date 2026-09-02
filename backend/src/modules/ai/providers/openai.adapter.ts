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

function toOpenAIMessages(input: AIGenerateInput): OpenAI.ChatCompletionMessageParam[] {
  return input.messages.map((message) => ({ role: message.role, content: message.content }));
}

/**
 * Real OpenAI adapter — implements the same `ProviderAdapter` interface as
 * every other provider. Nothing outside `modules/ai` ever imports the
 * `openai` package directly (CLAUDE.md §8).
 */
export function createOpenAIAdapter(client: OpenAI): ProviderAdapter {
  return {
    providerName: AIProviderName.OPENAI,
    capabilities: new Set([
      AICapability.TEXT_GENERATION,
      AICapability.STREAMING,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.EMBEDDING,
    ]),

    async generateText(input: AIGenerateInput): Promise<AIGenerateOutput> {
      const response = await client.chat.completions.create(
        {
          model: input.model,
          messages: toOpenAIMessages(input),
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
          model: input.model,
          messages: toOpenAIMessages(input),
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
          model: input.model,
          messages: toOpenAIMessages(input),
          max_completion_tokens: input.maxTokens,
          temperature: input.temperature,
          response_format: {
            type: 'json_schema',
            json_schema: { name: input.schemaName, schema: input.jsonSchema, strict: true },
          },
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
        { model: input.model, input: input.text },
        { signal: input.signal },
      );
      return {
        embedding: response.data[0]?.embedding ?? [],
        usage: { promptTokens: response.usage?.prompt_tokens ?? null },
      };
    },
  };
}
