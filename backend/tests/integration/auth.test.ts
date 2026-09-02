import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { InvalidCredentialsError } from '../../src/shared/errors';
import { signAccessToken } from '../../src/shared/tokens';
import { userService } from '../../src/modules/users';
import { googleAuthProvider } from '../../src/modules/auth/providers/google.provider';

// vi.mock calls are hoisted above the imports above by Vitest's transform,
// so `googleAuthProvider` imported above already refers to this mock.
vi.mock('../../src/modules/auth/providers/google.provider', () => ({
  googleAuthProvider: {
    type: 'google',
    verify: vi.fn(),
  },
}));

const mockVerify = vi.mocked(googleAuthProvider.verify);

const app = createApp();

function mockGoogleIdentity(
  providerId: string,
  overrides: Partial<{
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  }> = {},
) {
  mockVerify.mockResolvedValue({
    providerId,
    email: overrides.email ?? `${providerId}@example.com`,
    name: overrides.name ?? 'Test User',
    avatarUrl: overrides.avatarUrl ?? null,
  });
}

async function signIn(providerId: string) {
  mockGoogleIdentity(providerId);
  const response = await request(app).post('/api/v1/auth/google').send({ idToken: 'fake-token' });
  return response.body.data as {
    user: { id: string };
    tokens: { accessToken: string; refreshToken: string };
  };
}

beforeEach(() => {
  mockVerify.mockReset();
});

describe('POST /api/v1/auth/google', () => {
  it('creates a new user on first sign-in', async () => {
    mockGoogleIdentity('google-new-user');
    const response = await request(app).post('/api/v1/auth/google').send({ idToken: 'fake-token' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('google-new-user@example.com');
    expect(response.body.data.tokens.accessToken).toBeTypeOf('string');
    expect(response.body.data.tokens.refreshToken).toBeTypeOf('string');
  });

  it('finds the existing user on a second sign-in with the same identity (no duplicate account)', async () => {
    const first = await signIn('google-repeat-user');
    const second = await signIn('google-repeat-user');
    expect(second.user.id).toBe(first.user.id);
  });

  it('resolves to a single user under concurrent duplicate sign-in requests', async () => {
    mockGoogleIdentity('google-concurrent-user');
    const [a, b] = await Promise.all([
      request(app).post('/api/v1/auth/google').send({ idToken: 'fake-token' }),
      request(app).post('/api/v1/auth/google').send({ idToken: 'fake-token' }),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body.data.user.id).toBe(b.body.data.user.id);
  });

  it('rejects an invalid Google credential', async () => {
    mockVerify.mockRejectedValue(new InvalidCredentialsError('Invalid Google credential'));
    const response = await request(app).post('/api/v1/auth/google').send({ idToken: 'garbage' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a request missing idToken', async () => {
    const response = await request(app).post('/api/v1/auth/google').send({});
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const { tokens } = await signIn('google-refresh-user');
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(response.status).toBe(200);
    // The refresh token is a fresh random value every rotation, so it always
    // differs. The access token is a JWT signed from {sub, role, iat, exp}
    // with second-granularity iat/exp — two calls within the same second
    // can legitimately produce byte-identical (still valid, still correct)
    // tokens, so only the refresh token is asserted to differ here.
    expect(response.body.data.tokens.refreshToken).not.toBe(tokens.refreshToken);
    expect(response.body.data.tokens.accessToken).toBeTypeOf('string');
  });

  it('rejects reuse of an already-rotated refresh token (revoked session)', async () => {
    const { tokens } = await signIn('google-reuse-user');
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: tokens.refreshToken });

    const reused = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(reused.status).toBe(401);
    expect(reused.body.error.code).toBe('SESSION_REVOKED');
  });

  it('rejects an unknown refresh token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-refresh-token' });
    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('rejects requests with no token', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
  });

  it('returns the current user for a valid access token', async () => {
    const { user, tokens } = await signIn('google-me-user');
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(user.id);
  });

  it('rejects an expired access token with TOKEN_EXPIRED', async () => {
    const { user } = await signIn('google-expired-user');
    const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, -1);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects a suspended account even with an otherwise-valid access token', async () => {
    const { user, tokens } = await signIn('google-suspended-user');
    await userService.suspend(user.id);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the session so the refresh token can no longer be used', async () => {
    const { tokens } = await signIn('google-logout-user');
    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: tokens.refreshToken });
    expect(logoutResponse.status).toBe(200);

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });
    expect(refreshResponse.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout-all', () => {
  it('revokes every session for the user', async () => {
    mockGoogleIdentity('google-logout-all-user');
    const first = await request(app).post('/api/v1/auth/google').send({ idToken: 'fake-token' });
    const second = await request(app).post('/api/v1/auth/google').send({ idToken: 'fake-token' });

    const logoutAll = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${first.body.data.tokens.accessToken}`);
    expect(logoutAll.status).toBe(200);

    const refreshA = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.body.data.tokens.refreshToken });
    const refreshB = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: second.body.data.tokens.refreshToken });

    expect(refreshA.status).toBe(401);
    expect(refreshB.status).toBe(401);
  });
});

describe('DELETE /api/v1/auth/me (account deletion)', () => {
  it('soft-deletes the account: further requests are rejected with ACCOUNT_DELETED', async () => {
    const { tokens } = await signIn('google-delete-user');

    const deleteResponse = await request(app)
      .delete('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);
    expect(deleteResponse.status).toBe(200);

    const meResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);
    expect(meResponse.status).toBe(403);
    expect(meResponse.body.error.code).toBe('ACCOUNT_DELETED');
  });

  it('also revokes sessions on deletion', async () => {
    const { tokens } = await signIn('google-delete-sessions-user');
    await request(app)
      .delete('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });
    expect(refreshResponse.status).toBe(401);
  });
});
