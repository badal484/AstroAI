/**
 * Stable, machine-readable error codes shared across backend, admin and mobile.
 * New codes are additive; never repurpose an existing code for a different meaning.
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  // Auth-specific — distinct codes so clients can react differently
  // (e.g. silently refresh on TOKEN_EXPIRED, force full logout on
  // SESSION_REVOKED, show a "contact support" state on ACCOUNT_SUSPENDED).
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
