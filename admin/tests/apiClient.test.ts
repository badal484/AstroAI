import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../src/lib/apiClient';
import { ApiError } from '../src/lib/apiError';

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

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('returns the unwrapped data on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(successBody({ hello: 'world' })));
    const result = await apiRequest<{ hello: string }>('/api/v1/whatever');
    expect(result).toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends credentials so httpOnly session cookies are included', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(successBody({})));
    await apiRequest('/api/v1/whatever');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' });
  });

  it('throws a typed ApiError on a non-refreshable failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(errorBody('INVALID_CREDENTIALS'), 401));
    await expect(apiRequest('/api/v1/whatever')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not attempt a refresh for SESSION_REVOKED (a full re-login is required)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(errorBody('SESSION_REVOKED'), 401));
    await expect(apiRequest('/api/v1/whatever')).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('silently refreshes once and retries on TOKEN_EXPIRED, returning the retried result', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(errorBody('TOKEN_EXPIRED'), 401)) // original request
      .mockResolvedValueOnce(jsonResponse(successBody({ admin: { id: '1' } }))) // refresh call
      .mockResolvedValueOnce(jsonResponse(successBody({ ok: true }))); // retried request

    const result = await apiRequest<{ ok: boolean }>('/api/v1/whatever');
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/api/v1/admin/auth/refresh');
  });

  it('surfaces the original error if the silent refresh also fails', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(errorBody('TOKEN_EXPIRED'), 401))
      .mockResolvedValueOnce(jsonResponse(errorBody('UNAUTHORIZED'), 401)); // refresh fails too

    await expect(apiRequest('/api/v1/whatever')).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects with a normal ApiError instance', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(errorBody('FORBIDDEN'), 403));
    try {
      await apiRequest('/api/v1/whatever');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }
  });
});
