import type {
  ConversationRole,
  IntentCategory,
  MessageStatus,
  SupportedLanguage,
} from '@astroai/shared-types';
import { MessageStatus as MessageStatusValue } from '@astroai/shared-types';
import { MessageModel, type MessageDocument } from './message.model';

// Explicit write DTOs, decoupled from Mongoose's `InferSchemaType` (which
// widens ObjectId ref fields to `ObjectId & string` and adds spurious
// `undefined` to defaulted fields) — the read shape and the write
// contract don't need to be the same type, and keeping them separate
// avoids fighting Mongoose's inferred types on every write (same pattern
// as `birthProfiles`' `BirthProfileWriteData`).
export interface CreateMessageData {
  conversationId: string;
  userId: string;
  role: ConversationRole;
  content: string;
  status: MessageStatus;
  clientMessageId?: string;
  regeneratedFromMessageId?: string;
}

export interface UpdateMessageData {
  status?: MessageStatus;
  content?: string;
  intent?: IntentCategory | null;
  language?: SupportedLanguage | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  feedback?: { rating: string; comment: string | null; createdAt: Date };
  aiSession?: {
    requestId: string;
    provider: string | null;
    model: string | null;
    usedFallback: boolean;
    safetyCorrectionApplied: boolean;
    latencyMs: number | null;
  };
}

export const messageRepository = {
  create(data: CreateMessageData) {
    return MessageModel.create(data);
  },

  findById(id: string): Promise<MessageDocument | null> {
    return MessageModel.findById(id).exec();
  },

  findByIdForConversation(id: string, conversationId: string): Promise<MessageDocument | null> {
    return MessageModel.findOne({ _id: id, conversationId }).exec();
  },

  findByClientMessageId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<MessageDocument | null> {
    return MessageModel.findOne({ conversationId, clientMessageId }).exec();
  },

  /** Most recent messages in a conversation, in oldest-first (display)
   * order — the shape a chat UI and the astrologer's conversation context
   * both want. `beforeId` pages further back in history. */
  async listRecentForConversation(
    conversationId: string,
    params: { limit: number; beforeId?: string },
  ): Promise<{ items: MessageDocument[]; nextCursor: string | null }> {
    const query: Record<string, unknown> = { conversationId };
    if (params.beforeId) {
      query._id = { $lt: params.beforeId };
    }
    const items = await MessageModel.find(query)
      .sort({ _id: -1 })
      .limit(params.limit + 1)
      .exec();

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    const last = page.at(-1);
    return { items: page.reverse(), nextCursor: hasMore && last ? last._id.toString() : null };
  },

  /** The last N *completed* turns, for building the astrologer's
   * conversation context — pending/streaming/failed messages are excluded
   * since they have no reliable content to hand back to the model. */
  findCompletedHistory(conversationId: string, limit: number): Promise<MessageDocument[]> {
    return MessageModel.find({ conversationId, status: MessageStatusValue.COMPLETE })
      .sort({ _id: -1 })
      .limit(limit)
      .exec()
      .then((docs) => docs.reverse());
  },

  update(id: string, patch: UpdateMessageData): Promise<MessageDocument | null> {
    return MessageModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  },

  deleteAllForConversation(conversationId: string) {
    return MessageModel.deleteMany({ conversationId }).exec();
  },
};
