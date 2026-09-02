import { apiRequest } from '../src/lib/apiClient';
import { secureStorage } from '../src/lib/secureStorage';
import { useAuthStore } from '../src/stores/authStore';

// jest.mock calls are hoisted above the imports above, so the `secureStorage`
// imported there already refers to this mock.
jest.mock('../src/lib/secureStorage', () => ({
  secureStorage: {
    getRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearRefreshToken: jest.fn(),
  },
}));

const mockedSecureStorage = jest.mocked(secureStorage);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function successBody<T>(data: T) {
  return { success: true, data, requestId: 'req-1' };
}

function errorBody(code: string, message = 'error') {
  return { success: false, error: { code, message }, requestId: 'req-1' };
}

const user = {
  id: 'user-1',
  email: 'user@astroai.test',
  name: 'Test User',
  avatarUrl: null,
  language: 'en',
  role: 'user' as const,
  status: 'active' as const,
  createdAt: new Date().toISOString(),
};

const fetchMock = jest.fn();

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
  mockedSecureStorage.getRefreshToken.mockReset();
  mockedSecureStorage.setRefreshToken.mockReset();
  mockedSecureStorage.clearRefreshToken.mockReset();
  useAuthStore.setState({ status: 'idle', user: null, accessToken: null });
});

describe('apiRequest', () => {
  test('attaches the access token from the store as a Bearer header', async () => {
    useAuthStore.getState().setSession(user, 'access-token-1');
    fetchMock.mockResolvedValueOnce(jsonResponse(successBody({})));

    await apiRequest('/api/v1/whatever');

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe('Bearer access-token-1');
  });

  test('does not attach a header when skipAuth is set', async () => {
    useAuthStore.getState().setSession(user, 'access-token-1');
    fetchMock.mockResolvedValueOnce(jsonResponse(successBody({})));

    await apiRequest('/api/v1/auth/refresh', {}, { skipAuth: true });

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBeUndefined();
  });

  test('on TOKEN_EXPIRED, silently refreshes and retries once, updating the store', async () => {
    useAuthStore.getState().setSession(user, 'stale-token');
    mockedSecureStorage.getRefreshToken.mockResolvedValue(
      'stored-refresh-token',
    );
    fetchMock
      .mockResolvedValueOnce(jsonResponse(errorBody('TOKEN_EXPIRED'), 401)) // original
      .mockResolvedValueOnce(
        jsonResponse(
          successBody({
            user,
            tokens: {
              accessToken: 'fresh-token',
              accessTokenExpiresAt: new Date().toISOString(),
              refreshToken: 'rotated-refresh-token',
              refreshTokenExpiresAt: new Date().toISOString(),
            },
          }),
        ),
      ) // refresh call
      .mockResolvedValueOnce(jsonResponse(successBody({ ok: true }))); // retried original

    const result = await apiRequest<{ ok: boolean }>('/api/v1/whatever');

    expect(result).toEqual({ ok: true });
    expect(mockedSecureStorage.setRefreshToken).toHaveBeenCalledWith(
      'rotated-refresh-token',
    );
    expect(useAuthStore.getState().accessToken).toBe('fresh-token');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('forces logout when there is no refresh token to try', async () => {
    useAuthStore.getState().setSession(user, 'stale-token');
    mockedSecureStorage.getRefreshToken.mockResolvedValue(null);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(errorBody('TOKEN_EXPIRED'), 401),
    );

    await expect(apiRequest('/api/v1/whatever')).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
    });

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(mockedSecureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('SESSION_REVOKED forces logout immediately without attempting a refresh', async () => {
    useAuthStore.getState().setSession(user, 'stale-token');
    fetchMock.mockResolvedValueOnce(
      jsonResponse(errorBody('SESSION_REVOKED'), 401),
    );

    await expect(apiRequest('/api/v1/whatever')).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });

    expect(mockedSecureStorage.getRefreshToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('a non-auth failure (e.g. FORBIDDEN) neither refreshes nor logs out', async () => {
    useAuthStore.getState().setSession(user, 'valid-token');
    fetchMock.mockResolvedValueOnce(jsonResponse(errorBody('FORBIDDEN'), 403));

    await expect(apiRequest('/api/v1/whatever')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
