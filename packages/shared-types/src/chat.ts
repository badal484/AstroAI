import { z } from 'zod';
import { SupportedLanguage, type ConversationRole, type IntentCategory } from './astrologer';
import type { AIProviderName } from './ai';

/**
 * Chat domain types (CLAUDE.md §23). Built entirely on top of the AI
 * Gateway (`ai.ts`) and the AI astrologer intelligence layer
 * (`astrologer.ts`) — a message's content always comes from
 * `generateAstrologerResponse()`, never generated ad hoc here.
 */

export const MessageStatus = {
  PENDING: 'pending',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  FAILED: 'failed',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export const FeedbackRating = {
  UP: 'up',
  DOWN: 'down',
} as const;
export type FeedbackRating = (typeof FeedbackRating)[keyof typeof FeedbackRating];

export interface MessageFeedback {
  rating: FeedbackRating;
  comment: string | null;
  createdAt: string;
}

/** Metadata about the specific AI call that produced an assistant message
 * — "AI session" info, kept on the message itself rather than a separate
 * collection since it's 1:1 with the message it produced. */
export interface MessageAiSession {
  requestId: string;
  provider: AIProviderName | null;
  model: string | null;
  usedFallback: boolean;
  safetyCorrectionApplied: boolean;
  latencyMs: number | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ConversationRole;
  content: string;
  status: MessageStatus;
  intent: IntentCategory | null;
  language: SupportedLanguage | null;
  errorCode: string | null;
  errorMessage: string | null;
  feedback: MessageFeedback | null;
  aiSession: MessageAiSession | null;
  /** Set on an assistant message created by retry/regenerate — points at
   * the assistant message it's replacing, so history isn't silently lost. */
  regeneratedFromMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  birthProfileId: string | null;
  title: string;
  language: SupportedLanguage | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createConversationSchema = z.object({
  birthProfileId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(100).optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(4000),
  /** Client-generated UUID, one per logical send attempt — the mechanism
   * that prevents duplicate messages from a retried request (CLAUDE.md
   * §38/§45). */
  clientMessageId: z.string().trim().min(1).max(100),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const suggestedQuestionsQuerySchema = z.object({
  /** Overrides the conversation's own detected language for this one
   * fetch — the "language switching" affordance in the mobile UI before a
   * user has typed anything in a conversation yet. */
  language: z.nativeEnum(SupportedLanguage).optional(),
});
export type SuggestedQuestionsQuery = z.infer<typeof suggestedQuestionsQuerySchema>;

export const feedbackSchema = z.object({
  rating: z.nativeEnum(FeedbackRating),
  comment: z.string().trim().max(1000).optional(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

/** Socket.IO event contracts, shared so the mobile client and backend
 * never drift on payload shape. */
export interface ChatServerToClientEvents {
  'message:created': (payload: { message: ChatMessage }) => void;
  'message:status': (payload: { messageId: string; status: MessageStatus }) => void;
  'message:chunk': (payload: { messageId: string; delta: string }) => void;
  'message:complete': (payload: { message: ChatMessage }) => void;
  'message:error': (payload: { messageId: string; code: string; message: string }) => void;
  error: (payload: { message: string }) => void;
}

export interface ChatClientToServerEvents {
  join_conversation: (payload: { conversationId: string }) => void;
  leave_conversation: (payload: { conversationId: string }) => void;
}
