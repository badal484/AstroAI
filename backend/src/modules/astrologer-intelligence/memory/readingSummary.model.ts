import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const readingSummarySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    topic: { type: String, required: true, trim: true },
    summary: { type: String, required: true },
    keyAstrologicalFactors: { type: [String], default: [] },
    recommendedFollowUps: { type: [String], default: [] },
  },
  { timestamps: true },
);

readingSummarySchema.index({ userId: 1, topic: 1, createdAt: -1 });

export type ReadingSummarySchemaType = InferSchemaType<typeof readingSummarySchema>;
export type ReadingSummaryDocument = HydratedDocument<ReadingSummarySchemaType>;
export const ReadingSummaryModel = model('ReadingSummary', readingSummarySchema);
