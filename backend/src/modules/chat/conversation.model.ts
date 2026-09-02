import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { SupportedLanguage } from '@astroai/shared-types';

const conversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    birthProfileId: { type: Schema.Types.ObjectId, ref: 'BirthProfile', default: null },
    title: { type: String, required: true, trim: true },
    // The most recently detected message language — used to default the
    // language switcher and suggested questions to whatever the
    // conversation has actually been happening in.
    language: { type: String, enum: [...Object.values(SupportedLanguage), null], default: null },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true },
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });

export type ConversationSchemaType = InferSchemaType<typeof conversationSchema>;
export type ConversationDocument = HydratedDocument<ConversationSchemaType>;
export const ConversationModel = model('Conversation', conversationSchema);
