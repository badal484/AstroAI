import type { ChatMessage, Conversation } from '@astroai/shared-types';
import type { ConversationDocument } from './conversation.model';
import type { MessageDocument } from './message.model';

// Mongoose's `InferSchemaType` widens fields without `required: true` to
// include `undefined` even when a `default` guarantees a value at runtime
// — normalized at this one boundary rather than threading `?? null`
// through every call site (same pattern as birthProfiles' chat.types.ts).

export function toConversation(doc: ConversationDocument): Conversation {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    birthProfileId: doc.birthProfileId ? doc.birthProfileId.toString() : null,
    personaId: (doc.personaId as any) ?? null,
    title: doc.title,
    language: doc.language ?? null,
    lastMessageAt: doc.lastMessageAt ? doc.lastMessageAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toChatMessage(doc: MessageDocument): ChatMessage {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    role: doc.role,
    content: doc.content,
    status: doc.status,
    intent: doc.intent ?? null,
    language: doc.language ?? null,
    errorCode: doc.errorCode ?? null,
    errorMessage: doc.errorMessage ?? null,
    feedback: doc.feedback
      ? {
          rating: doc.feedback.rating,
          comment: doc.feedback.comment ?? null,
          createdAt: doc.feedback.createdAt.toISOString(),
        }
      : null,
    aiSession: doc.aiSession
      ? {
          requestId: doc.aiSession.requestId,
          provider: doc.aiSession.provider ?? null,
          model: doc.aiSession.model ?? null,
          usedFallback: doc.aiSession.usedFallback,
          safetyCorrectionApplied: doc.aiSession.safetyCorrectionApplied,
          latencyMs: doc.aiSession.latencyMs ?? null,
        }
      : null,
    quickReplyChips: doc.quickReplyChips
      ? doc.quickReplyChips.map((c) => ({
          id: c.id,
          label: c.label,
          query: c.query,
          icon: c.icon ?? undefined,
        }))
      : null,
    interactiveWidget: doc.interactiveWidget
      ? {
          type: doc.interactiveWidget.type as any,
          title: doc.interactiveWidget.title,
          subtitle: doc.interactiveWidget.subtitle ?? undefined,
          data: doc.interactiveWidget.data ?? {},
        }
      : null,
    audioUrl: doc.audioUrl ?? null,
    audioDurationSeconds: doc.audioDurationSeconds ?? null,
    regeneratedFromMessageId: doc.regeneratedFromMessageId
      ? doc.regeneratedFromMessageId.toString()
      : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
