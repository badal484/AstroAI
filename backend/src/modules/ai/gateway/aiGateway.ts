import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  AICapability,
  ModelAlias,
  type AIMessage,
  type ClassifyIntentResult,
  type EmbedResult,
  type GenerateStructuredResult,
  type GenerateTextResult,
  type StreamTextChunk,
} from '@astroai/shared-types';
import { AIInvalidRequestError } from '../../../shared/errors';
import type { ProviderAdapter } from '../ai.types';
import { routeCall, routeStream } from '../router/modelRouter';

interface BaseCallOptions {
  requestId?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateTextOptions extends BaseCallOptions {
  alias: ModelAlias;
  messages: AIMessage[];
}

export interface StreamTextOptions extends BaseCallOptions {
  alias: ModelAlias;
  messages: AIMessage[];
}

export interface GenerateStructuredOptions<T> extends BaseCallOptions {
  alias: ModelAlias;
  messages: AIMessage[];
  schema: z.ZodType<T>;
  /** a-z, A-Z, 0-9, underscores/dashes only — forwarded to providers that
   * require a schema name (OpenAI's `json_schema.name`, Anthropic's tool
   * `name`). */
  schemaName: string;
}

export interface ClassifyIntentOptions extends BaseCallOptions {
  text: string;
  labels: [string, ...string[]];
  /** Defaults to the `classification` alias — override only if a caller
   * has a specific reason to classify with a different tier of model. */
  alias?: ModelAlias;
}

export interface EmbedOptions extends BaseCallOptions {
  alias: ModelAlias;
  text: string;
}

function messagesValidation(messages: AIMessage[]): void {
  if (messages.length === 0) {
    throw new AIInvalidRequestError('At least one message is required');
  }
}

/**
 * THE AI Gateway — the only door into AI capability for the rest of the
 * application (CLAUDE.md §8). Every function here resolves a logical
 * `ModelAlias` to a concrete provider/model via the model router, which
 * owns retry/fallback/timeout/normalization/usage-tracking; nothing in
 * this file (or anywhere calling it) ever references a provider SDK.
 */
export const aiGateway = {
  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    messagesValidation(options.messages);
    const requestId = options.requestId ?? randomUUID();
    const startedAt = Date.now();

    const result = await routeCall({
      alias: options.alias,
      requiredCapability: AICapability.TEXT_GENERATION,
      requestId,
      operation: 'generateText',
      call: (adapter: ProviderAdapter, model, signal) =>
        adapter.generateText({
          model,
          messages: options.messages,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          signal,
        }),
      extractUsage: (output) => output.usage,
    });

    return {
      text: result.output.text,
      meta: {
        requestId,
        alias: options.alias,
        provider: result.provider,
        model: result.model,
        usedFallback: result.usedFallback,
        latencyMs: Date.now() - startedAt,
        usage: result.output.usage,
      },
    };
  },

  async *streamText(options: StreamTextOptions): AsyncIterable<StreamTextChunk> {
    messagesValidation(options.messages);
    const requestId = options.requestId ?? randomUUID();

    const result = await routeStream({
      alias: options.alias,
      requestId,
      operation: 'streamText',
      call: (adapter: ProviderAdapter, model, signal) =>
        adapter.streamText({
          model,
          messages: options.messages,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          signal,
        }),
    });

    for await (const chunk of result.stream) {
      yield { delta: chunk.delta, done: false };
    }
    yield { delta: '', done: true };
  },

  async generateStructured<T>(
    options: GenerateStructuredOptions<T>,
  ): Promise<GenerateStructuredResult<T>> {
    messagesValidation(options.messages);
    const requestId = options.requestId ?? randomUUID();
    const startedAt = Date.now();
    // No name/`$ref` indirection: a flat inlined schema is directly usable
    // by all three providers' structured-output mechanisms, whereas the
    // named-shorthand form wraps the schema behind a `$ref`, which
    // Anthropic's tool `input_schema` in particular doesn't expect.
    //
    // The double cast works around zod-to-json-schema typing its param
    // against `zod/v3`'s own copy of `ZodSchema` rather than this
    // project's top-level `zod` import — two structurally-identical but
    // nominally-distinct types (a byproduct of Zod 3.25+ shipping a v3/v4
    // compatibility layer) that TS's structural comparison otherwise spins
    // out on ("Type instantiation is excessively deep").
    const jsonSchema = zodToJsonSchema(
      options.schema as unknown as Parameters<typeof zodToJsonSchema>[0],
    ) as Record<string, unknown>;

    const result = await routeCall({
      alias: options.alias,
      requiredCapability: AICapability.STRUCTURED_OUTPUT,
      requestId,
      operation: 'generateStructured',
      call: (adapter: ProviderAdapter, model, signal) =>
        adapter.generateStructured({
          model,
          messages: options.messages,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          schemaName: options.schemaName,
          jsonSchema,
          signal,
        }),
      extractUsage: (output) => output.usage,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.output.text);
    } catch {
      throw new AIInvalidRequestError(
        'The AI provider returned a response that was not valid JSON',
      );
    }

    const validated = options.schema.safeParse(parsed);
    if (!validated.success) {
      throw new AIInvalidRequestError(
        'The AI provider returned a response that did not match the requested schema',
        validated.error.flatten(),
      );
    }

    return {
      data: validated.data,
      meta: {
        requestId,
        alias: options.alias,
        provider: result.provider,
        model: result.model,
        usedFallback: result.usedFallback,
        latencyMs: Date.now() - startedAt,
        usage: result.output.usage,
      },
    };
  },

  /** Built on `generateStructured` — classification is just structured
   * generation with a fixed `{ intent, confidence }` shape, so it needs no
   * provider-specific code of its own (CLAUDE.md §9's `classification`
   * alias, used as the default here). */
  async classifyIntent(options: ClassifyIntentOptions): Promise<ClassifyIntentResult> {
    if (options.labels.length === 0) {
      throw new AIInvalidRequestError('At least one label is required');
    }

    const schema = z.object({
      intent: z.enum(options.labels),
      confidence: z.number().min(0).max(1),
    });

    const result = await aiGateway.generateStructured({
      alias: options.alias ?? ModelAlias.CLASSIFICATION,
      messages: [
        {
          role: 'system' as const,
          content: `Classify the user's text into exactly one of these labels: ${options.labels.join(', ')}. Respond with the label and your confidence (0 to 1).`,
        },
        { role: 'user' as const, content: options.text },
      ],
      schema,
      schemaName: 'intent_classification',
      requestId: options.requestId,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });

    return { intent: result.data.intent, confidence: result.data.confidence, meta: result.meta };
  },

  async generateEmbedding(options: EmbedOptions): Promise<EmbedResult> {
    if (options.text.length === 0) {
      throw new AIInvalidRequestError('Text is required to generate an embedding');
    }
    const requestId = options.requestId ?? randomUUID();
    const startedAt = Date.now();

    const result = await routeCall({
      alias: options.alias,
      requiredCapability: AICapability.EMBEDDING,
      requestId,
      operation: 'generateEmbedding',
      call: (adapter: ProviderAdapter, model, signal) =>
        adapter.generateEmbedding({ model, text: options.text, signal }),
      extractUsage: (output) => ({
        promptTokens: output.usage.promptTokens,
        completionTokens: null,
        totalTokens: output.usage.promptTokens,
      }),
    });

    return {
      embedding: result.output.embedding,
      meta: {
        requestId,
        alias: options.alias,
        provider: result.provider,
        model: result.model,
        usedFallback: result.usedFallback,
        latencyMs: Date.now() - startedAt,
        usage: {
          promptTokens: result.output.usage.promptTokens,
          completionTokens: null,
          totalTokens: result.output.usage.promptTokens,
        },
      },
    };
  },
};
