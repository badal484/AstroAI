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
  // Birth profile / location / astrology-specific — distinct codes so the
  // mobile app can show a targeted message instead of a generic error.
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  LOCATION_PROVIDER_UNAVAILABLE: 'LOCATION_PROVIDER_UNAVAILABLE',
  FUTURE_DATE_OF_BIRTH: 'FUTURE_DATE_OF_BIRTH',
  ASTROLOGY_ENGINE_UNAVAILABLE: 'ASTROLOGY_ENGINE_UNAVAILABLE',
  // AI Gateway
  AI_GATEWAY_UNAVAILABLE: 'AI_GATEWAY_UNAVAILABLE',
  AI_INVALID_REQUEST: 'AI_INVALID_REQUEST',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
