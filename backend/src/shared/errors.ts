import { ErrorCode } from '@astroai/shared-types';

/**
 * Base of the typed error hierarchy (ARCHITECTURE.md §2 "Error handling").
 * Every error thrown intentionally by application code should extend this,
 * carrying a stable `code` and the `httpStatus` the centralized error
 * middleware should respond with. Anything that is NOT an AppError is
 * treated as an unexpected bug and mapped to a generic 500.
 */
export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly httpStatus: number;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly httpStatus = 400;
}

export class UnauthorizedError extends AppError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly httpStatus = 401;

  constructor(message = 'Authentication is required') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly httpStatus = 403;

  constructor(message = 'You do not have permission to perform this action') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly httpStatus = 404;

  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly code = ErrorCode.CONFLICT;
  readonly httpStatus = 409;
}

export class RateLimitedError extends AppError {
  readonly code = ErrorCode.RATE_LIMITED;
  readonly httpStatus = 429;

  constructor(message = 'Too many requests') {
    super(message);
  }
}

export class ServiceUnavailableError extends AppError {
  readonly code = ErrorCode.SERVICE_UNAVAILABLE;
  readonly httpStatus = 503;
}

export class InternalError extends AppError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly httpStatus = 500;

  constructor(message = 'Something went wrong') {
    super(message);
  }
}

// --- Auth-specific errors (distinct codes so clients can react differently
// per CLAUDE.md's auth requirements — e.g. mobile silently refreshes on
// TOKEN_EXPIRED but forces a full logout on SESSION_REVOKED) ---

export class InvalidCredentialsError extends AppError {
  readonly code = ErrorCode.INVALID_CREDENTIALS;
  readonly httpStatus = 401;

  constructor(message = 'Invalid credentials') {
    super(message);
  }
}

export class TokenExpiredError extends AppError {
  readonly code = ErrorCode.TOKEN_EXPIRED;
  readonly httpStatus = 401;

  constructor(message = 'Token has expired') {
    super(message);
  }
}

export class SessionRevokedError extends AppError {
  readonly code = ErrorCode.SESSION_REVOKED;
  readonly httpStatus = 401;

  constructor(message = 'Session has been revoked') {
    super(message);
  }
}

export class AccountSuspendedError extends AppError {
  readonly code = ErrorCode.ACCOUNT_SUSPENDED;
  readonly httpStatus = 403;

  constructor(message = 'This account has been suspended') {
    super(message);
  }
}

export class AccountDeletedError extends AppError {
  readonly code = ErrorCode.ACCOUNT_DELETED;
  readonly httpStatus = 403;

  constructor(message = 'This account no longer exists') {
    super(message);
  }
}

// --- Birth profile / location / astrology-specific errors ---

export class LocationNotFoundError extends AppError {
  readonly code = ErrorCode.LOCATION_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(message = 'Location not found') {
    super(message);
  }
}

/** The location provider is not configured (no API key) — a clearly
 * isolated integration seam, not a fake/empty result (CLAUDE.md §51). */
export class LocationProviderUnavailableError extends AppError {
  readonly code = ErrorCode.LOCATION_PROVIDER_UNAVAILABLE;
  readonly httpStatus = 503;

  constructor(
    message = 'Location search is not configured on this server yet. Enter the location manually instead.',
  ) {
    super(message);
  }
}

export class FutureDateOfBirthError extends AppError {
  readonly code = ErrorCode.FUTURE_DATE_OF_BIRTH;
  readonly httpStatus = 400;

  constructor(message = 'Date of birth cannot be in the future') {
    super(message);
  }
}

/** The astrology calculation engine is not configured — never fabricated,
 * per CLAUDE.md §11/§51 ("do not hardcode fake astrology results"). */
export class AstrologyEngineUnavailableError extends AppError {
  readonly code = ErrorCode.ASTROLOGY_ENGINE_UNAVAILABLE;
  readonly httpStatus = 503;

  constructor(
    message = 'Astrology calculations are not available yet — the calculation engine is not configured on this server.',
  ) {
    super(message);
  }
}
