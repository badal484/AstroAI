import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AICapability, AIProviderName, IntentCategory, ModelAlias } from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { redis } from '../../src/lib/redis';
import { userService } from '../../src/modules/users';
import { aiConfigService } from '../../src/modules/ai/aiConfig.service';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../src/modules/ai/registry';
import type { ProviderAdapter } from '../../src/modules/ai/ai.types';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

const fakeAdapter = {
  providerName: AIProviderName.OPENAI,
  capabilities: new Set([AICapability.TEXT_GENERATION, AICapability.STRUCTURED_OUTPUT]),
  generateText: () =>
    Promise.resolve({
      text: 'This looks like a genuinely favorable period for you, though the outcome depends on the choices you make along the way.',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    }),
  streamText: () => ({
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.reject(new Error('not used in this test')),
    }),
  }),
  generateStructured: () =>
    Promise.resolve({
      text: JSON.stringify({ intent: IntentCategory.GENERAL_ASTROLOGY, confidence: 0.9 }),
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
    }),
  generateEmbedding: () => Promise.reject(new Error('not used in this test')),
} satisfies ProviderAdapter;

async function createAuthedUser() {
  const user = await userService.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Test User',
    avatarUrl: null,
  });
  const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
  return { user, authHeader: `Bearer ${token}` };
}

async function createConversation(authHeader: string) {
  const res = await request(app)
    .post('/api/v1/conversations')
    .set('Authorization', authHeader)
    .send({});
  return res.body.data as { id: string };
}

async function waitForTerminalStatus(
  authHeader: string,
  conversationId: string,
  messageId: string,
  timeoutMs = 5000,
): Promise<{ id: string; status: string; content: string; errorMessage: string | null }> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await request(app)
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', authHeader);
    const message = (res.body.data.items as { id: string; status: string }[]).find(
      (m) => m.id === messageId,
    );
    if (message && (message.status === 'complete' || message.status === 'failed')) {
      return message as {
        id: string;
        status: string;
        content: string;
        errorMessage: string | null;
      };
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for message ${messageId} to reach a terminal status`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

beforeEach(async () => {
  await redis.flushall();
  __resetProviderRegistryForTests();
  __setProviderRegistryForTests({ [AIProviderName.OPENAI]: fakeAdapter });
  await aiConfigService.setRoutingCandidates(ModelAlias.SMART_CHAT, [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
  ]);
  await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
  ]);
  await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
  ]);
});

describe('POST /api/v1/conversations', () => {
  it('creates a conversation with a default title', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', authHeader)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('New reading');
    expect(res.body.data.birthProfileId).toBeNull();
  });

  it('rejects a birth profile the caller does not own', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', authHeader)
      .send({ birthProfileId: '000000000000000000000000' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/conversations', () => {
  it("lists only the requesting user's own conversations", async () => {
    const owner = await createAuthedUser();
    await createConversation(owner.authHeader);
    await createConversation(owner.authHeader);
    const other = await createAuthedUser();
    await createConversation(other.authHeader);

    const res = await request(app)
      .get('/api/v1/conversations')
      .set('Authorization', owner.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
  });
});

describe('conversation ownership', () => {
  it('returns 404 for a conversation owned by someone else', async () => {
    const owner = await createAuthedUser();
    const conversation = await createConversation(owner.authHeader);
    const stranger = await createAuthedUser();

    const res = await request(app)
      .get(`/api/v1/conversations/${conversation.id}`)
      .set('Authorization', stranger.authHeader);

    expect(res.status).toBe(404);
  });
});

describe('sending a message', () => {
  it('creates the user message immediately and completes the assistant reply asynchronously', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);

    const sendRes = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({
        content: 'What does my chart say about my career?',
        clientMessageId: crypto.randomUUID(),
      });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.role).toBe('user');
    expect(sendRes.body.data.status).toBe('complete');

    const listRes = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const assistantPlaceholder = (listRes.body.data.items as { role: string; id: string }[]).find(
      (m) => m.role === 'assistant',
    )!;
    expect(assistantPlaceholder).toBeDefined();

    const finalMessage = await waitForTerminalStatus(
      authHeader,
      conversation.id,
      assistantPlaceholder.id,
    );
    expect(finalMessage.status).toBe('complete');
    expect(finalMessage.content).toMatch(/favorable period/i);
  });

  it('auto-titles the conversation from the first message', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);

    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Will I find love this year?', clientMessageId: crypto.randomUUID() });

    const res = await request(app)
      .get(`/api/v1/conversations/${conversation.id}`)
      .set('Authorization', authHeader);
    expect(res.body.data.title).toBe('Will I find love this year?');
  });

  it('prevents duplicate messages from a retried send request', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);
    const clientMessageId = crypto.randomUUID();

    const first = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Hello', clientMessageId });
    const second = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Hello', clientMessageId });

    expect(first.body.data.id).toBe(second.body.data.id);

    const listRes = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const userMessages = (listRes.body.data.items as { role: string }[]).filter(
      (m) => m.role === 'user',
    );
    expect(userMessages).toHaveLength(1);
  });

  it('rejects an empty message', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);

    const res = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: '', clientMessageId: crypto.randomUUID() });

    expect(res.status).toBe(400);
  });

  it('marks the assistant message failed (not charged, safe error text) when the AI Gateway is exhausted', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: {
        ...fakeAdapter,
        generateText: () => Promise.reject(Object.assign(new Error('down'), { status: 503 })),
      },
    });
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);

    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Will I be rich?', clientMessageId: crypto.randomUUID() });

    const listRes = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const assistantPlaceholder = (listRes.body.data.items as { role: string; id: string }[]).find(
      (m) => m.role === 'assistant',
    )!;

    const finalMessage = await waitForTerminalStatus(
      authHeader,
      conversation.id,
      assistantPlaceholder.id,
    );
    expect(finalMessage.status).toBe('failed');
    expect(finalMessage.errorMessage).not.toMatch(/AIGatewayError|status.*503/i);
  });
});

describe('message history pagination', () => {
  it('pages oldest-first through history using a cursor, without skipping or duplicating messages', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);

    // Three send/wait round-trips -> 6 messages total (3 user + 3 assistant).
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post(`/api/v1/conversations/${conversation.id}/messages`)
        .set('Authorization', authHeader)
        .send({ content: `question ${i}`, clientMessageId: crypto.randomUUID() });
      const list = await request(app)
        .get(`/api/v1/conversations/${conversation.id}/messages`)
        .set('Authorization', authHeader);
      const assistantMsg = (list.body.data.items as { role: string; id: string }[])
        .filter((m) => m.role === 'assistant')
        .at(-1)!;
      await waitForTerminalStatus(authHeader, conversation.id, assistantMsg.id);
    }

    const firstPage = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages?limit=4`)
      .set('Authorization', authHeader);
    expect(firstPage.body.data.items).toHaveLength(4);
    expect(firstPage.body.data.nextCursor).not.toBeNull();

    const secondPage = await request(app)
      .get(
        `/api/v1/conversations/${conversation.id}/messages?limit=4&cursor=${firstPage.body.data.nextCursor as string}`,
      )
      .set('Authorization', authHeader);
    expect(secondPage.body.data.items).toHaveLength(2);
    expect(secondPage.body.data.nextCursor).toBeNull();

    const firstIds = (firstPage.body.data.items as { id: string }[]).map((m) => m.id);
    const secondIds = (secondPage.body.data.items as { id: string }[]).map((m) => m.id);
    expect(new Set([...firstIds, ...secondIds]).size).toBe(6);
  });
});

describe('regenerate', () => {
  it('creates a fresh assistant message when regenerating a completed reply, preserving the old one', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);
    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'What about my career?', clientMessageId: crypto.randomUUID() });

    const before = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const original = (before.body.data.items as { role: string; id: string }[]).find(
      (m) => m.role === 'assistant',
    )!;
    await waitForTerminalStatus(authHeader, conversation.id, original.id);

    const regenRes = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages/${original.id}/regenerate`)
      .set('Authorization', authHeader);

    expect(regenRes.status).toBe(200);
    expect(regenRes.body.data.id).not.toBe(original.id);
    expect(regenRes.body.data.regeneratedFromMessageId).toBe(original.id);

    await waitForTerminalStatus(authHeader, conversation.id, regenRes.body.data.id as string);
    const after = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const assistantMessages = (after.body.data.items as { role: string }[]).filter(
      (m) => m.role === 'assistant',
    );
    expect(assistantMessages).toHaveLength(2);
  });

  it('resets a failed message in place when retried', async () => {
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: {
        ...fakeAdapter,
        generateText: () => Promise.reject(Object.assign(new Error('down'), { status: 503 })),
      },
    });
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);
    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Will I be rich?', clientMessageId: crypto.randomUUID() });

    const before = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const failedMessage = (before.body.data.items as { role: string; id: string }[]).find(
      (m) => m.role === 'assistant',
    )!;
    await waitForTerminalStatus(authHeader, conversation.id, failedMessage.id);

    // Fix the provider before retrying.
    __setProviderRegistryForTests({ [AIProviderName.OPENAI]: fakeAdapter });

    const retryRes = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages/${failedMessage.id}/regenerate`)
      .set('Authorization', authHeader);
    expect(retryRes.body.data.id).toBe(failedMessage.id);

    const finalMessage = await waitForTerminalStatus(authHeader, conversation.id, failedMessage.id);
    expect(finalMessage.status).toBe('complete');

    const after = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const assistantMessages = (after.body.data.items as { role: string }[]).filter(
      (m) => m.role === 'assistant',
    );
    expect(assistantMessages).toHaveLength(1);
  });

  it('rejects regenerating a user message', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);
    const sendRes = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Hi', clientMessageId: crypto.randomUUID() });

    const res = await request(app)
      .post(
        `/api/v1/conversations/${conversation.id}/messages/${sendRes.body.data.id as string}/regenerate`,
      )
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
  });
});

describe('feedback', () => {
  it('records feedback on an assistant message', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);
    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Hi', clientMessageId: crypto.randomUUID() });
    const before = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader);
    const assistantMessage = (before.body.data.items as { role: string; id: string }[]).find(
      (m) => m.role === 'assistant',
    )!;

    const res = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages/${assistantMessage.id}/feedback`)
      .set('Authorization', authHeader)
      .send({ rating: 'up', comment: 'Very helpful!' });

    expect(res.status).toBe(200);
    expect(res.body.data.feedback).toMatchObject({ rating: 'up', comment: 'Very helpful!' });
  });

  it('rejects feedback on a user message', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);
    const sendRes = await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Hi', clientMessageId: crypto.randomUUID() });

    const res = await request(app)
      .post(
        `/api/v1/conversations/${conversation.id}/messages/${sendRes.body.data.id as string}/feedback`,
      )
      .set('Authorization', authHeader)
      .send({ rating: 'down' });

    expect(res.status).toBe(400);
  });
});

describe('suggested questions', () => {
  it('returns starter questions for a conversation with no birth profile linked', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);

    const res = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/suggested-questions`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.questions)).toBe(true);
    expect(res.body.data.questions.length).toBeGreaterThan(0);
  });
});

describe('deleting a conversation', () => {
  it('deletes the conversation and its messages', async () => {
    const { authHeader } = await createAuthedUser();
    const conversation = await createConversation(authHeader);
    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set('Authorization', authHeader)
      .send({ content: 'Hi', clientMessageId: crypto.randomUUID() });

    const deleteRes = await request(app)
      .delete(`/api/v1/conversations/${conversation.id}`)
      .set('Authorization', authHeader);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/conversations/${conversation.id}`)
      .set('Authorization', authHeader);
    expect(getRes.status).toBe(404);
  });
});
