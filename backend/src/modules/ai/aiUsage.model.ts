import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { AIErrorCategory, AIProviderName, ModelAlias } from '@astroai/shared-types';

/**
 * `aiUsageEvents` — one document per gateway call, per ARCHITECTURE.md §5's
 * observability requirement (CLAUDE.md §10: "Record: request ID, provider,
 * model, latency, success/failure, fallback, token usage where available,
 * estimated cost where available, error category"). Feeds future admin
 * AI-cost analytics (CLAUDE.md §49).
 */
const aiUsageEventSchema = new Schema(
  {
    requestId: { type: String, required: true },
    alias: { type: String, enum: Object.values(ModelAlias), required: true },
    provider: { type: String, enum: Object.values(AIProviderName), required: true },
    model: { type: String, required: true },
    operation: { type: String, required: true },
    latencyMs: { type: Number, required: true },
    success: { type: Boolean, required: true },
    usedFallback: { type: Boolean, required: true, default: false },
    promptTokens: { type: Number, default: null },
    completionTokens: { type: Number, default: null },
    totalTokens: { type: Number, default: null },
    estimatedCostUsd: { type: Number, default: null },
    errorCategory: { type: String, enum: [...Object.values(AIErrorCategory), null], default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

aiUsageEventSchema.index({ alias: 1, createdAt: -1 });
aiUsageEventSchema.index({ provider: 1, createdAt: -1 });

export type AIUsageEventSchemaType = InferSchemaType<typeof aiUsageEventSchema>;
export type AIUsageEventDocument = HydratedDocument<AIUsageEventSchemaType>;
export const AIUsageEventModel = model('AIUsageEvent', aiUsageEventSchema);
