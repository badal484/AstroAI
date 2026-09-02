import type { GoogleGenAI, Content } from '@google/genai';
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

/** Gemini keeps system prompts out of `contents` too (a separate
 * `systemInstruction` config field), and uses `model` rather than
 * `assistant` for the model's own turns. */
function splitMessages(input: AIGenerateInput): {
  systemInstruction: string | undefined;
  contents: Content[];
} {
  const systemInstruction = input.messages
    .filter((message) => message.role === AIMessageRole.SYSTEM)
    .map((message) => message.content)
    .join('\n\n');

  const contents: Content[] = input.messages
    .filter((message) => message.role !== AIMessageRole.SYSTEM)
    .map((message) => ({
      role: message.role === AIMessageRole.ASSISTANT ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  return {
    systemInstruction: systemInstruction.length > 0 ? systemInstruction : undefined,
    contents,
  };
}

/**
 * Real Gemini adapter, on top of Google's unified `@google/genai` SDK.
 * Structured output uses Gemini's native `responseMimeType` +
 * `responseJsonSchema` config, the closest equivalent to OpenAI's
 * `response_format`.
 */
export function createGeminiAdapter(client: GoogleGenAI): ProviderAdapter {
  return {
    providerName: AIProviderName.GEMINI,
    capabilities: new Set([
      AICapability.TEXT_GENERATION,
      AICapability.STREAMING,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.EMBEDDING,
    ]),

    async generateText(input: AIGenerateInput): Promise<AIGenerateOutput> {
      const { systemInstruction, contents } = splitMessages(input);
      const response = await client.models.generateContent({
        model: input.model,
        contents,
        config: {
          systemInstruction,
          temperature: input.temperature,
          maxOutputTokens: input.maxTokens,
          abortSignal: input.signal,
        },
      });
      return {
        text: response.text ?? '',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount ?? null,
          completionTokens: response.usageMetadata?.candidatesTokenCount ?? null,
          totalTokens: response.usageMetadata?.totalTokenCount ?? null,
        },
      };
    },

    async *streamText(input: AIGenerateInput): AsyncIterable<AIStreamChunk> {
      const { systemInstruction, contents } = splitMessages(input);
      const stream = await client.models.generateContentStream({
        model: input.model,
        contents,
        config: {
          systemInstruction,
          temperature: input.temperature,
          maxOutputTokens: input.maxTokens,
          abortSignal: input.signal,
        },
      });
      for await (const chunk of stream) {
        const delta = chunk.text;
        if (delta) yield { delta };
      }
    },

    async generateStructured(input: AIStructuredInput): Promise<AIGenerateOutput> {
      const { systemInstruction, contents } = splitMessages(input);
      const response = await client.models.generateContent({
        model: input.model,
        contents,
        config: {
          systemInstruction,
          temperature: input.temperature,
          maxOutputTokens: input.maxTokens,
          responseMimeType: 'application/json',
          responseJsonSchema: input.jsonSchema,
          abortSignal: input.signal,
        },
      });
      return {
        text: response.text ?? '',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount ?? null,
          completionTokens: response.usageMetadata?.candidatesTokenCount ?? null,
          totalTokens: response.usageMetadata?.totalTokenCount ?? null,
        },
      };
    },

    async generateEmbedding(input: AIEmbedInput): Promise<AIEmbedOutput> {
      const response = await client.models.embedContent({
        model: input.model,
        contents: input.text,
        config: { abortSignal: input.signal },
      });
      return {
        embedding: response.embeddings?.[0]?.values ?? [],
        usage: { promptTokens: null },
      };
    },
  };
}
