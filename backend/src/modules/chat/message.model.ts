import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  AIProviderName,
  ConversationRole,
  FeedbackRating,
  IntentCategory,
  MessageStatus,
  SupportedLanguage,
} from '@astroai/shared-types';

const feedbackSubSchema = new Schema(
  {
    rating: { type: String, enum: Object.values(FeedbackRating), required: true },
    comment: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const aiSessionSubSchema = new Schema(
  {
    requestId: { type: String, required: true },
    provider: { type: String, enum: [...Object.values(AIProviderName), null], default: null },
    model: { type: String, default: null },
    usedFallback: { type: Boolean, required: true, default: false },
    safetyCorrectionApplied: { type: Boolean, required: true, default: false },
    latencyMs: { type: Number, default: null },
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    // Denormalized for cheap ownership checks without joining to
    // Conversation on every message read.
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(ConversationRole), required: true },
    // Not `required`: Mongoose's built-in String required-check also
    // rejects an empty string, but an assistant placeholder legitimately
    // starts as `''` (status `pending`/`streaming`) before generation
    // fills it in.
    content: { type: String, default: '' },
    status: { type: String, enum: Object.values(MessageStatus), required: true },
    intent: { type: String, enum: [...Object.values(IntentCategory), null], default: null },
    language: { type: String, enum: [...Object.values(SupportedLanguage), null], default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    feedback: { type: feedbackSubSchema, default: null },
    aiSession: { type: aiSessionSubSchema, default: null },
    regeneratedFromMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    // Only set on user messages — the idempotency key that prevents a
    // retried "send" request from creating a duplicate (CLAUDE.md
    // §38/§45). Deliberately no `default`: the field must stay truly
    // *absent* (not present-with-value-`null`) on every other message, or
    // the sparse unique index below stops excluding them — a sparse index
    // only skips documents where the field is missing, not ones where
    // it's explicitly `null`, and every message would otherwise collide
    // on the same `null`.
    clientMessageId: { type: String },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
// Only user messages carry a clientMessageId, and only within one
// conversation does it need to be unique (the same client-generated UUID
// could theoretically collide across conversations with negligible risk,
// but scoping to conversationId costs nothing and removes even that). A
// partial index with an explicit filter, not Mongoose's `sparse: true`
// shorthand: Mongoose/the MongoDB driver can still serialize an
// undefined field as BSON `null` rather than omitting the key entirely,
// which would make every message with no clientMessageId collide on the
// same `null` under a plain sparse index. Filtering on the field
// actually being a string sidesteps that regardless of which one happens.
messageSchema.index(
  { conversationId: 1, clientMessageId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } },
);

export type MessageSchemaType = InferSchemaType<typeof messageSchema>;
export type MessageDocument = HydratedDocument<MessageSchemaType>;
export const MessageModel = model('Message', messageSchema);
