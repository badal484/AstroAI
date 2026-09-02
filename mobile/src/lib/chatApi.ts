import type {
  ChatMessage,
  Conversation,
  CreateConversationInput,
  FeedbackInput,
  PaginatedResult,
  SendMessageInput,
  SupportedLanguage,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function listConversations(
  cursor?: string,
): Promise<PaginatedResult<Conversation>> {
  return apiRequest(
    `/api/v1/conversations${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
  );
}

export function createConversation(
  input: CreateConversationInput,
): Promise<Conversation> {
  return apiRequest('/api/v1/conversations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getConversation(id: string): Promise<Conversation> {
  return apiRequest(`/api/v1/conversations/${id}`);
}

export function deleteConversation(id: string): Promise<{ success: true }> {
  return apiRequest(`/api/v1/conversations/${id}`, { method: 'DELETE' });
}

export function listMessages(
  conversationId: string,
  cursor?: string,
  limit = 50,
): Promise<PaginatedResult<ChatMessage>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiRequest(
    `/api/v1/conversations/${conversationId}/messages?${params.toString()}`,
  );
}

export function sendMessage(
  conversationId: string,
  input: SendMessageInput,
): Promise<ChatMessage> {
  return apiRequest(`/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function regenerateMessage(
  conversationId: string,
  messageId: string,
): Promise<ChatMessage> {
  return apiRequest(
    `/api/v1/conversations/${conversationId}/messages/${messageId}/regenerate`,
    { method: 'POST' },
  );
}

export function submitFeedback(
  conversationId: string,
  messageId: string,
  input: FeedbackInput,
): Promise<ChatMessage> {
  return apiRequest(
    `/api/v1/conversations/${conversationId}/messages/${messageId}/feedback`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function getSuggestedQuestions(
  conversationId: string,
  language?: SupportedLanguage,
): Promise<{ questions: string[] }> {
  const query = language ? `?language=${language}` : '';
  return apiRequest(
    `/api/v1/conversations/${conversationId}/suggested-questions${query}`,
  );
}
