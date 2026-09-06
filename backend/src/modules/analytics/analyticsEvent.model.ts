import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const analyticsEventSchema = new Schema(
  {
    category: {
      type: String,
      enum: ['product', 'financial', 'ai_gateway', 'notification', 'system'],
      required: true,
      index: true,
    },
    eventName: { type: String, required: true, index: true },
    entityId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
      index: true,
    },
    durationMs: { type: Number, default: null },
    metrics: { type: Map, of: Number, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

analyticsEventSchema.index({ category: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: -1 });

export type AnalyticsEventSchemaType = InferSchemaType<typeof analyticsEventSchema>;
export type AnalyticsEventDocument = HydratedDocument<AnalyticsEventSchemaType>;
export const AnalyticsEventModel = model('AnalyticsEvent', analyticsEventSchema);
