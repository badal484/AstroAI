import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ChatMessage, PaginatedResult } from '@astroai/shared-types';
import { connectChatSocket } from '../lib/socketClient';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

function messagesQueryKey(conversationId: string): readonly [string, string] {
  return ['messages', conversationId] as const;
}

function upsertMessage(
  data: PaginatedResult<ChatMessage> | undefined,
  message: ChatMessage,
): PaginatedResult<ChatMessage> {
  if (!data) return { items: [message], nextCursor: null };
  const index = data.items.findIndex(item => item.id === message.id);
  if (index === -1) return { ...data, items: [...data.items, message] };
  const items = [...data.items];
  items[index] = message;
  return { ...data, items };
}

function patchMessage(
  data: PaginatedResult<ChatMessage> | undefined,
  messageId: string,
  patch: Partial<ChatMessage>,
): PaginatedResult<ChatMessage> | undefined {
  if (!data) return data;
  return {
    ...data,
    items: data.items.map(item =>
      item.id === messageId ? { ...item, ...patch } : item,
    ),
  };
}

function omitKey(
  record: Record<string, string>,
  key: string,
): Record<string, string> {
  const next = { ...record };
  delete next[key];
  return next;
}

/**
 * Joins a conversation's Socket.IO room for the lifetime of the screen
 * that's viewing it, keeping the REST-backed TanStack Query cache in sync
 * with live events. `streamingText` is kept as separate local state
 * (not funneled through the query cache) since chunk events arrive far
 * more often than anything query-cache invalidation is meant for.
 *
 * On every `connect` (including a reconnect after a network drop) this
 * re-joins the room *and* invalidates the message list — the socket is a
 * supplement to REST, never a replacement for it (ARCHITECTURE.md's
 * Realtime section): anything missed while disconnected is reconciled by
 * simply re-fetching, not by trusting a replay of missed events.
 */
export function useConversationSocket(conversationId: string | undefined): {
  streamingText: Record<string, string>;
  connectionStatus: ConnectionStatus;
} {
  const queryClient = useQueryClient();
  const [streamingText, setStreamingText] = useState<Record<string, string>>(
    {},
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');

  useEffect(() => {
    if (!conversationId) return undefined;

    const socket = connectChatSocket();
    const queryKey = messagesQueryKey(conversationId);

    function handleConnect() {
      setConnectionStatus('connected');
      socket.emit('join_conversation', { conversationId: conversationId! });
      void queryClient.invalidateQueries({ queryKey });
    }
    function handleDisconnect() {
      setConnectionStatus('disconnected');
    }
    function handleReconnectAttempt() {
      setConnectionStatus('connecting');
    }
    function handleCreated({ message }: { message: ChatMessage }) {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(queryKey, old =>
        upsertMessage(old, message),
      );
    }
    function handleStatus({
      messageId,
      status,
    }: {
      messageId: string;
      status: ChatMessage['status'];
    }) {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(queryKey, old =>
        patchMessage(old, messageId, { status }),
      );
    }
    function handleChunk({
      messageId,
      delta,
    }: {
      messageId: string;
      delta: string;
    }) {
      setStreamingText(prev => ({
        ...prev,
        [messageId]: (prev[messageId] ?? '') + delta,
      }));
    }
    function handleComplete({ message }: { message: ChatMessage }) {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(queryKey, old =>
        upsertMessage(old, message),
      );
      setStreamingText(prev => omitKey(prev, message.id));
    }
    function handleError({
      messageId,
      message,
    }: {
      messageId: string;
      code: string;
      message: string;
    }) {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(queryKey, old =>
        patchMessage(old, messageId, {
          status: 'failed',
          errorMessage: message,
        }),
      );
      setStreamingText(prev => omitKey(prev, messageId));
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('message:created', handleCreated);
    socket.on('message:status', handleStatus);
    socket.on('message:chunk', handleChunk);
    socket.on('message:complete', handleComplete);
    socket.on('message:error', handleError);

    if (socket.connected) handleConnect();

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('message:created', handleCreated);
      socket.off('message:status', handleStatus);
      socket.off('message:chunk', handleChunk);
      socket.off('message:complete', handleComplete);
      socket.off('message:error', handleError);
    };
  }, [conversationId, queryClient]);

  return { streamingText, connectionStatus };
}
