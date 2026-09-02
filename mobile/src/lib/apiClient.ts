import type { ApiResponse } from '@astroai/shared-types';
import { env } from '../config/env';
import { ApiError } from './apiError';

/**
 * Thin typed wrapper around fetch for calling the backend's /api/v1 API.
 * Parses the fixed response envelope (ARCHITECTURE.md §2) and throws a
 * typed ApiError on failure. No auth/session/retry wiring yet — that
 * belongs to the auth module, not this foundation phase.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
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
