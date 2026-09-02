import type { ApiResponse } from '@astroai/shared-types';
import { env } from '../config/env';
import { ApiError } from './apiError';

const REFRESH_PATH = '/api/v1/admin/auth/refresh';

/**
 * Thin typed wrapper around fetch for calling the backend's /api/v1 API.
 * Parses the fixed response envelope (ARCHITECTURE.md §2) and throws a
 * typed ApiError on failure instead of returning an ambiguous shape.
 *
 * Admin auth lives in httpOnly cookies (never touched by this code
 * directly) — `credentials: 'include'` sends/receives them. On a
 * TOKEN_EXPIRED/UNAUTHORIZED response this attempts exactly one silent
 * refresh and retries the original request once; a session-level failure
 * (SESSION_REVOKED, or a failed refresh) propagates as an ApiError for the
 * caller to react to — see stores/adminAuthStore.ts and the query client's
 * error handling for the resulting logout/redirect.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    const canRetryWithRefresh =
      retry &&
      path !== REFRESH_PATH &&
      (body.error.code === 'UNAUTHORIZED' || body.error.code === 'TOKEN_EXPIRED');

    if (canRetryWithRefresh && (await tryRefresh())) {
      return apiRequest<T>(path, init, false);
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

async function tryRefresh(): Promise<boolean> {
  try {
    await apiRequest(REFRESH_PATH, { method: 'POST' }, false);
    return true;
  } catch {
    return false;
  }
}
