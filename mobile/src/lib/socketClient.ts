import { io, type Socket } from 'socket.io-client';
import type {
  ChatClientToServerEvents,
  ChatServerToClientEvents,
} from '@astroai/shared-types';
import { env } from '../config/env';
import { useAuthStore } from '../stores/authStore';

export type ChatSocket = Socket<
  ChatServerToClientEvents,
  ChatClientToServerEvents
>;

let socket: ChatSocket | null = null;

/**
 * One shared socket for the whole app, created lazily and reused across
 * screens (so navigating away from a chat screen and back doesn't tear
 * down and renegotiate a fresh connection every time). `auth` is a
 * function, not a plain object, specifically so a reconnect picks up
 * whatever the current access token is at reconnect time — including one
 * obtained from a silent refresh that happened while disconnected — rather
 * than a stale token captured once at socket creation.
 */
export function connectChatSocket(): ChatSocket {
  socket ??= io(env.apiBaseUrl, {
    autoConnect: false,
    // Long-polling is markedly flakier than a plain WebSocket on React
    // Native and isn't needed for a mobile-only client — matches the
    // server's own `transports: ['websocket']` config.
    transports: ['websocket'],
    auth: callback => callback({ token: useAuthStore.getState().accessToken }),
  });

  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
}

export function getChatSocket(): ChatSocket | null {
  return socket;
}
