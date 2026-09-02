import { ConversationModel, type ConversationDocument } from './conversation.model';

export const conversationRepository = {
  create(data: { userId: string; birthProfileId: string | null; title: string }) {
    return ConversationModel.create(data);
  },

  findByIdForUser(id: string, userId: string): Promise<ConversationDocument | null> {
    return ConversationModel.findOne({ _id: id, userId }).exec();
  },

  async listForUser(
    userId: string,
    params: { limit: number; cursor?: string },
  ): Promise<{ items: ConversationDocument[]; nextCursor: string | null }> {
    const query: Record<string, unknown> = { userId };
    if (params.cursor) {
      query._id = { $lt: params.cursor };
    }
    const items = await ConversationModel.find(query)
      .sort({ lastMessageAt: -1, _id: -1 })
      .limit(params.limit + 1)
      .exec();

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    const last = page.at(-1);
    return { items: page, nextCursor: hasMore && last ? last._id.toString() : null };
  },

  touchLastMessageAt(id: string, at: Date, language: string | null) {
    return ConversationModel.findByIdAndUpdate(id, { lastMessageAt: at, language }).exec();
  },

  updateTitle(id: string, title: string) {
    return ConversationModel.findByIdAndUpdate(id, { title }).exec();
  },

  deleteById(id: string) {
    return ConversationModel.findByIdAndDelete(id).exec();
  },
};
