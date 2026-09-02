import { randomUUID } from 'node:crypto';
import {
  ConversationRole,
  MessageStatus,
  SupportedLanguage,
  type ChatMessage,
  type FeedbackInput,
  type PaginatedResult,
  type SendMessageInput,
} from '@astroai/shared-types';
import { generateAstrologerResponse } from '../astrologer';
import { userService } from '../users';
import { AppError, ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import { conversationRepository } from './conversation.repository';
import { conversationService } from './conversation.service';
import { messageRepository } from './message.repository';
import { toChatMessage } from './chat.types';
import { chatSocket, isChatSocketInitialized } from './chat.socket';
import type { ConversationDocument } from './conversation.model';

// How many recent completed turns feed the astrologer's own conversation
// window (which then applies its own tighter windowing on top — CLAUDE.md
// §22 layered memory, applied at two levels).
const HISTORY_WINDOW = 20;
// Word-chunk size and pacing for the client-facing "typing" replay — see
// the module-level comment on `replayAsChunks` for why this replays an
// already-persisted, already-validated response rather than streaming raw
// provider tokens.
const REPLAY_WORDS_PER_CHUNK = 3;
const REPLAY_DELAY_MS = 45;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toSupportedLanguage(value: string | null | undefined): SupportedLanguage | null {
  const known = Object.values(SupportedLanguage) as string[];
  return value && known.includes(value) ? (value as SupportedLanguage) : null;
}

export const chatService = {
  async listMessages(
    userId: string,
    conversationId: string,
    params: { limit: number; cursor?: string },
  ): Promise<PaginatedResult<ChatMessage>> {
    await requireOwnedConversation(userId, conversationId);
    const { items, nextCursor } = await messageRepository.listRecentForConversation(
      conversationId,
      {
        limit: params.limit,
        beforeId: params.cursor,
      },
    );
    return { items: items.map(toChatMessage), nextCursor };
  },

  /**
   * Creates the user's message and an assistant placeholder immediately
   * (both visible to the client right away — CLAUDE.md §43's "no dead-end
   * screen"), then generates the assistant reply asynchronously. The HTTP
   * caller gets the user message back right away; the assistant reply
   * arrives via `chatSocket` events (and is always fetchable over REST
   * regardless of socket connectivity).
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    input: SendMessageInput,
  ): Promise<ChatMessage> {
    const conversation = await requireOwnedConversation(userId, conversationId);

    const existing = await messageRepository.findByClientMessageId(
      conversationId,
      input.clientMessageId,
    );
    if (existing) {
      // Idempotent replay (CLAUDE.md §38/§45): a client retrying a timed-
      // out send sees the same result, never a duplicate message.
      return toChatMessage(existing);
    }

    const userMessageDoc = await messageRepository.create({
      conversationId,
      userId,
      role: ConversationRole.USER,
      content: input.content,
      status: MessageStatus.COMPLETE,
      clientMessageId: input.clientMessageId,
    });
    const userMessage = toChatMessage(userMessageDoc);
    chatSocket.messageCreated(conversationId, userMessage);
    await conversationService.autoTitleFromFirstMessage(
      conversationId,
      conversation.title,
      input.content,
    );

    const assistantDoc = await messageRepository.create({
      conversationId,
      userId,
      role: ConversationRole.ASSISTANT,
      content: '',
      status: MessageStatus.PENDING,
    });
    chatSocket.messageCreated(conversationId, toChatMessage(assistantDoc));

    void runGeneration(userId, conversation, assistantDoc._id.toString());

    return userMessage;
  },

  /** Works for both "retry" (target is `failed`) and "regenerate" (target
   * is `complete`) — mobile exposes these as differently-labeled buttons
   * over the same operation, per CLAUDE.md §23. A failed message is reset
   * in place (nothing worth preserving); a completed one is preserved and
   * a fresh assistant message is created alongside it, so a user can still
   * see what the AI said before if they preferred it. */
  async regenerate(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ChatMessage> {
    const conversation = await requireOwnedConversation(userId, conversationId);
    const target = await messageRepository.findByIdForConversation(messageId, conversationId);
    if (!target) throw new NotFoundError('Message not found');
    if (target.role !== ConversationRole.ASSISTANT) {
      throw new ValidationError('Only assistant messages can be regenerated');
    }
    if (target.status === MessageStatus.PENDING || target.status === MessageStatus.STREAMING) {
      throw new ConflictError('This response is still being generated');
    }

    let regenerationTargetId = messageId;
    if (target.status === MessageStatus.COMPLETE) {
      const fresh = await messageRepository.create({
        conversationId,
        userId,
        role: ConversationRole.ASSISTANT,
        content: '',
        status: MessageStatus.PENDING,
        regeneratedFromMessageId: messageId,
      });
      chatSocket.messageCreated(conversationId, toChatMessage(fresh));
      regenerationTargetId = fresh._id.toString();
    } else {
      await messageRepository.update(messageId, {
        status: MessageStatus.PENDING,
        content: '',
        errorCode: null,
        errorMessage: null,
      });
      chatSocket.messageStatus(conversationId, messageId, MessageStatus.PENDING);
    }

    void runGeneration(userId, conversation, regenerationTargetId);

    const created = await messageRepository.findById(regenerationTargetId);
    return toChatMessage(created!);
  },

  async submitFeedback(
    userId: string,
    conversationId: string,
    messageId: string,
    input: FeedbackInput,
  ): Promise<ChatMessage> {
    await requireOwnedConversation(userId, conversationId);
    const message = await messageRepository.findByIdForConversation(messageId, conversationId);
    if (!message) throw new NotFoundError('Message not found');
    if (message.role !== ConversationRole.ASSISTANT) {
      throw new ValidationError('Feedback can only be left on assistant messages');
    }

    const updated = await messageRepository.update(messageId, {
      feedback: { rating: input.rating, comment: input.comment ?? null, createdAt: new Date() },
    });
    return toChatMessage(updated!);
  },
};

async function requireOwnedConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationDocument> {
  const conversation = await conversationRepository.findByIdForUser(conversationId, userId);
  if (!conversation) throw new NotFoundError('Conversation not found');
  return conversation;
}

/**
 * The exact required pipeline (user message → intent → context →
 * astrology data where relevant → AI Gateway → safety validation →
 * response) lives entirely inside `generateAstrologerResponse` — this
 * function's job is persistence and delivery around that call, never
 * reimplementing it.
 *
 * Runs fire-and-forget from the HTTP handler. Errors are caught and turned
 * into a `failed` message rather than an unhandled rejection — a failed
 * generation must never crash the process or silently vanish.
 */
async function runGeneration(
  userId: string,
  conversation: ConversationDocument,
  assistantMessageId: string,
): Promise<void> {
  const conversationId = conversation._id.toString();
  const startedAt = Date.now();

  try {
    await messageRepository.update(assistantMessageId, { status: MessageStatus.STREAMING });
    chatSocket.messageStatus(conversationId, assistantMessageId, MessageStatus.STREAMING);

    const history = await messageRepository.findCompletedHistory(conversationId, HISTORY_WINDOW);
    const triggerUserMessage = [...history]
      .reverse()
      .find((message) => message.role === ConversationRole.USER);
    if (!triggerUserMessage) {
      throw new ValidationError('No user message found to respond to');
    }

    const conversationHistory = history
      .filter((message) => message._id.toString() !== triggerUserMessage._id.toString())
      .map((message) => ({ role: message.role, content: message.content }));

    const user = await userService.getById(userId);

    const result = await generateAstrologerResponse({
      userId,
      birthProfileId: conversation.birthProfileId ? conversation.birthProfileId.toString() : null,
      conversationHistory,
      userMessage: triggerUserMessage.content,
      userName: user.name,
      preferredLanguage: toSupportedLanguage(user.language),
      requestId: randomUUID(),
    });

    // Persisted in full BEFORE any client-facing delivery begins — see
    // module doc comment: this is what makes app termination / a dropped
    // socket connection during "streaming" safe. The client-visible typing
    // animation below is replaying content that already safely exists.
    const updated = await messageRepository.update(assistantMessageId, {
      content: result.responseText,
      status: MessageStatus.COMPLETE,
      intent: result.intent,
      language: result.language,
      aiSession: {
        requestId: result.meta.requestId,
        provider: result.meta.provider,
        model: result.meta.model,
        usedFallback: result.meta.usedFallback,
        safetyCorrectionApplied: result.meta.safetyCorrectionApplied,
        latencyMs: Date.now() - startedAt,
      },
    });
    await conversationService.touchLastMessageAt(conversationId, result.language);

    await replayAsChunks(conversationId, assistantMessageId, result.responseText);
    chatSocket.messageComplete(conversationId, toChatMessage(updated!));

    // Billing integration point (CLAUDE.md's "do not charge for failed AI
    // responses"): nothing charges credits anywhere in this codebase yet
    // (no wallet/pricing module exists), so there is nothing to debit here
    // — but this is precisely where a future wallet debit belongs, gated
    // on having reached MessageStatus.COMPLETE. It must never move earlier
    // in this function, and the catch block below must never call it.
  } catch (error) {
    const safeMessage = 'This response could not be generated. Please try again.';
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';

    await messageRepository.update(assistantMessageId, {
      status: MessageStatus.FAILED,
      errorCode: code,
      errorMessage: safeMessage,
    });
    chatSocket.messageError(conversationId, assistantMessageId, code, safeMessage);
    logger.error(
      { err: error, conversationId, assistantMessageId },
      'Chat message generation failed',
    );
  }
}

/**
 * Delivers an already-generated, already-safety-validated response to
 * connected clients as small word chunks with a short delay between them —
 * a genuine "typing" feel for the user, without ever streaming raw,
 * unvalidated provider output (the AI astrologer layer is deliberately
 * non-streaming for exactly this reason — see modules/astrologer). A
 * client that's offline or reconnects mid-replay simply fetches the
 * already-complete message over REST next; nothing is lost either way.
 */
async function replayAsChunks(
  conversationId: string,
  messageId: string,
  text: string,
): Promise<void> {
  if (text.length === 0) return;
  const words = text.split(' ');
  // No point pacing a delivery nobody is listening to (no live socket
  // server at all — tests/scripts, or before initChatSocket has run).
  const shouldPace = isChatSocketInitialized();

  for (let i = 0; i < words.length; i += REPLAY_WORDS_PER_CHUNK) {
    const isLastChunk = i + REPLAY_WORDS_PER_CHUNK >= words.length;
    const delta = words.slice(i, i + REPLAY_WORDS_PER_CHUNK).join(' ') + (isLastChunk ? '' : ' ');
    chatSocket.messageChunk(conversationId, messageId, delta);
    if (!isLastChunk && shouldPace) await delay(REPLAY_DELAY_MS);
  }
}
