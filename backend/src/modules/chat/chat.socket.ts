import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type DefaultEventsMap } from 'socket.io';
import {
  AccountStatus,
  type ChatClientToServerEvents,
  type ChatMessage,
  type ChatServerToClientEvents,
} from '@astroai/shared-types';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import { verifyAccessToken } from '../../shared/tokens';
import { userService } from '../users';
import { conversationRepository } from './conversation.repository';

interface SocketData {
  userId: string;
}

type ChatIOServer = SocketIOServer<
  ChatClientToServerEvents,
  ChatServerToClientEvents,
  DefaultEventsMap,
  SocketData
>;

let io: ChatIOServer | null = null;

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/**
 * One namespace, JWT-authenticated at the handshake (same access token the
 * REST API uses — CLAUDE.md §36), rooms scoped per conversation so a
 * client only ever receives events for conversations it has explicitly
 * joined (and whose ownership was checked at join time, not just at
 * connect time).
 */
export function initChatSocket(httpServer: HttpServer): ChatIOServer {
  io = new SocketIOServer<
    ChatClientToServerEvents,
    ChatServerToClientEvents,
    DefaultEventsMap,
    SocketData
  >(httpServer, {
    cors: { origin: env.CORS_ALLOWED_ORIGINS, credentials: true },
    // Skip long-polling — flakier than a plain WebSocket on React Native
    // and unnecessary for a mobile-only realtime client.
    transports: ['websocket'],
  });

  io.use((socket, next) => {
    void (async () => {
      try {
        const token = socket.handshake.auth.token as string | undefined;
        if (!token) throw new Error('missing token');

        const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
        const user = await userService.getById(payload.sub);
        if (user.status !== AccountStatus.ACTIVE) throw new Error('account not active');

        socket.data = { userId: user._id.toString() };
        next();
      } catch {
        next(new Error('unauthorized'));
      }
    })();
  });

  io.on('connection', (socket) => {
    socket.on('join_conversation', (payload) => {
      void (async () => {
        const conversation = await conversationRepository.findByIdForUser(
          payload.conversationId,
          socket.data.userId,
        );
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }
        await socket.join(conversationRoom(payload.conversationId));
      })();
    });

    socket.on('leave_conversation', (payload) => {
      void socket.leave(conversationRoom(payload.conversationId));
    });
  });

  return io;
}

/** Whether there's a live Socket.IO server to deliver events to at all —
 * lets callers skip the point of pacing a delivery nobody is receiving
 * (e.g. in tests/scripts, or before `initChatSocket` has run). */
export function isChatSocketInitialized(): boolean {
  return io !== null;
}

function room(conversationId: string) {
  if (!io) {
    // Expected in tests/scripts that never call initChatSocket — chat
    // still works over REST, live delivery is just a no-op.
    logger.debug({ conversationId }, 'Chat socket not initialized, skipping emit');
    return null;
  }
  return io.to(conversationRoom(conversationId));
}

// Deliberately not a single generic passthrough: Socket.IO's typed-emit
// overloads (decorated internally for acknowledgement callback support)
// don't play well with a `Parameters<Events[K]>[0]` generic wrapper, and
// one explicit function per event is just as readable.
export const chatSocket = {
  messageCreated(conversationId: string, message: ChatMessage): void {
    room(conversationId)?.emit('message:created', { message });
  },
  messageStatus(conversationId: string, messageId: string, status: ChatMessage['status']): void {
    room(conversationId)?.emit('message:status', { messageId, status });
  },
  messageChunk(conversationId: string, messageId: string, delta: string): void {
    room(conversationId)?.emit('message:chunk', { messageId, delta });
  },
  messageComplete(conversationId: string, message: ChatMessage): void {
    room(conversationId)?.emit('message:complete', { message });
  },
  messageError(conversationId: string, messageId: string, code: string, message: string): void {
    room(conversationId)?.emit('message:error', { messageId, code, message });
  },
};
