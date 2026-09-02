import type { Conversation, PaginatedResult } from '@astroai/shared-types';
import { birthProfileService } from '../birthProfiles';
import { NotFoundError } from '../../shared/errors';
import { conversationRepository } from './conversation.repository';
import { messageRepository } from './message.repository';
import { toConversation } from './chat.types';

export const DEFAULT_CONVERSATION_TITLE = 'New reading';
const AUTO_TITLE_MAX_LENGTH = 60;

export const conversationService = {
  async create(
    userId: string,
    input: { birthProfileId?: string; title?: string },
  ): Promise<Conversation> {
    if (input.birthProfileId) {
      // Ownership-checked read — throws NotFoundError if the birth profile
      // doesn't exist or belongs to someone else, same 404-for-both
      // behavior as the birth profiles module itself.
      await birthProfileService.getById(userId, input.birthProfileId);
    }

    const doc = await conversationRepository.create({
      userId,
      birthProfileId: input.birthProfileId ?? null,
      title: input.title?.trim() || DEFAULT_CONVERSATION_TITLE,
    });
    return toConversation(doc);
  },

  async list(
    userId: string,
    params: { limit: number; cursor?: string },
  ): Promise<PaginatedResult<Conversation>> {
    const { items, nextCursor } = await conversationRepository.listForUser(userId, params);
    return { items: items.map(toConversation), nextCursor };
  },

  async getById(userId: string, id: string): Promise<Conversation> {
    const doc = await conversationRepository.findByIdForUser(id, userId);
    if (!doc) throw new NotFoundError('Conversation not found');
    return toConversation(doc);
  },

  async remove(userId: string, id: string): Promise<void> {
    const doc = await conversationRepository.findByIdForUser(id, userId);
    if (!doc) throw new NotFoundError('Conversation not found');
    await messageRepository.deleteAllForConversation(id);
    await conversationRepository.deleteById(id);
  },

  /** Auto-titles a conversation from its first user message, the way most
   * chat products do, so a user never has to name a conversation
   * themselves for it to be recognizable in the list later. Only ever
   * overwrites the placeholder default, never a title the user set. */
  async autoTitleFromFirstMessage(
    conversationId: string,
    currentTitle: string,
    content: string,
  ): Promise<void> {
    if (currentTitle !== DEFAULT_CONVERSATION_TITLE) return;
    const title =
      content.length > AUTO_TITLE_MAX_LENGTH
        ? `${content.slice(0, AUTO_TITLE_MAX_LENGTH).trim()}…`
        : content;
    await conversationRepository.updateTitle(conversationId, title);
  },

  touchLastMessageAt(conversationId: string, language: string | null): Promise<void> {
    return conversationRepository
      .touchLastMessageAt(conversationId, new Date(), language)
      .then(() => undefined);
  },
};
