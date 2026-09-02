import type { ErrorCode } from '@astroai/shared-types';

/** Thrown by apiClient when the backend returns an ApiErrorResponse envelope. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly requestId: string;
  readonly details?: unknown;

  constructor(params: {
    code: ErrorCode;
    status: number;
    message: string;
    requestId: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId;
    this.details = params.details;
  }
}

/** A session-valid-but-not-permitted response (RBAC denial) — distinct from
 * a session-level failure (UNAUTHORIZED/TOKEN_EXPIRED/SESSION_REVOKED,
 * handled by apiClient's refresh-and-retry) or ACCOUNT_SUSPENDED (which
 * should log the admin out). Pages use this to render an "unauthorized"
 * state in place rather than redirecting to /login. */
export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'FORBIDDEN';
}
