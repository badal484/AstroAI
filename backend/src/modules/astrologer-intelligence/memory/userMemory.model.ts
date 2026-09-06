import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { MemoryCategory } from './memoryTypes';

const userMemorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: Object.values(MemoryCategory), required: true },
    fact: { type: String, required: true, trim: true },
    sourceConversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
  },
  { timestamps: true },
);

userMemorySchema.index({ userId: 1, category: 1 });

export type UserMemorySchemaType = InferSchemaType<typeof userMemorySchema>;
export type UserMemoryDocument = HydratedDocument<UserMemorySchemaType>;
export const UserMemoryModel = model('UserMemory', userMemorySchema);
