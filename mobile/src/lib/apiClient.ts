import type { ApiResponse, AuthResponse } from '@astroai/shared-types';
import { env } from '../config/env';
import { useAuthStore } from '../stores/authStore';
import { ApiError } from './apiError';
import { secureStorage } from './secureStorage';

interface RequestOptions {
  /** Don't attach the Authorization header — used by the refresh/logout
   * calls, which authenticate via the refresh token in the body instead. */
  skipAuth?: boolean;
  /** Don't attempt a silent refresh-and-retry on this call — used to stop
   * the refresh call itself from recursing into another refresh attempt. */
  skipRetry?: boolean;
}

/**
 * Thin typed wrapper around fetch for calling the backend's /api/v1 API.
 * Parses the fixed response envelope (ARCHITECTURE.md §2) and throws a
 * typed ApiError on failure.
 *
 * On TOKEN_EXPIRED/UNAUTHORIZED this attempts exactly one silent refresh
 * (rotating the refresh token held in encrypted storage) and retries the
 * original request once. If the refresh itself fails — an expired-past-
 * rotation or revoked refresh token — the session is torn down and
 * SESSION_REVOKED/UNAUTHORIZED propagates so the caller's UI can react
 * (RootNavigator swaps back to the Auth stack; see stores/authStore.ts).
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const accessToken = options.skipAuth
    ? null
    : useAuthStore.getState().accessToken;

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    const isSessionExpired =
      body.error.code === 'UNAUTHORIZED' || body.error.code === 'TOKEN_EXPIRED';

    if (isSessionExpired && !options.skipRetry) {
      const refreshed = await trySilentRefresh();
      if (refreshed) {
        return apiRequest<T>(path, init, { ...options, skipRetry: true });
      }
    }

    if (isSessionExpired || body.error.code === 'SESSION_REVOKED') {
      await forceLogout();
    }

    throw new ApiError({
      code: body.error.code,
      status: response.status,
      message: body.error.message,
      requestId: body.requestId,
      details: body.error.details,
    });
  }

  return body.data;
}

async function trySilentRefresh(): Promise<boolean> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const result = await apiRequest<AuthResponse>(
      '/api/v1/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      { skipAuth: true, skipRetry: true },
    );
    await secureStorage.setRefreshToken(result.tokens.refreshToken);
    useAuthStore.getState().setSession(result.user, result.tokens.accessToken);
    return true;
  } catch {
    return false;
  }
}

async function forceLogout(): Promise<void> {
  await secureStorage.clearRefreshToken();
  useAuthStore.getState().setUnauthenticated();
}
