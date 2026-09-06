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

// --- AI Gateway errors ---

/** Every configured provider/fallback for an alias failed (or none is
 * configured at all). Carries the normalized failure category in
 * `details` for logging — the message itself is always safe/generic,
 * never a raw provider error string (CLAUDE.md §10). */
export class AIGatewayError extends AppError {
  readonly code = ErrorCode.AI_GATEWAY_UNAVAILABLE;
  readonly httpStatus = 503;

  constructor(details: unknown, message = 'AI is temporarily unavailable. Please try again.') {
    super(message, details);
  }
}

/** The request itself was malformed (bad alias, empty messages, a
 * structured-output schema the response didn't match, ...) — a caller
 * bug, not a provider failure. Never retried across providers. */
export class AIInvalidRequestError extends AppError {
  readonly code = ErrorCode.AI_INVALID_REQUEST;
  readonly httpStatus = 400;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

// --- Wallet & Pricing errors ---

export class InsufficientWalletBalanceError extends AppError {
  readonly code = ErrorCode.INSUFFICIENT_WALLET_BALANCE;
  readonly httpStatus = 400;

  constructor(message = 'Insufficient wallet balance to complete this operation') {
    super(message);
  }
}

export class InvalidTransactionAmountError extends AppError {
  readonly code = ErrorCode.INVALID_TRANSACTION_AMOUNT;
  readonly httpStatus = 400;

  constructor(message = 'Transaction amount must be a positive integer') {
    super(message);
  }
}

export class WalletTransactionFailedError extends AppError {
  readonly code = ErrorCode.WALLET_TRANSACTION_FAILED;
  readonly httpStatus = 500;

  constructor(message = 'Failed to execute wallet transaction', details?: unknown) {
    super(message, details);
  }
}

export class DuplicateIdempotencyKeyError extends AppError {
  readonly code = ErrorCode.DUPLICATE_IDEMPOTENCY_KEY;
  readonly httpStatus = 409;

  constructor(message = 'Duplicate transaction request detected') {
    super(message);
  }
}

export class WalletHoldNotFoundError extends AppError {
  readonly code = ErrorCode.WALLET_HOLD_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(message = 'Wallet hold reservation not found') {
    super(message);
  }
}

export class WalletHoldExpiredError extends AppError {
  readonly code = ErrorCode.WALLET_HOLD_EXPIRED;
  readonly httpStatus = 400;

  constructor(message = 'Wallet hold reservation has expired') {
    super(message);
  }
}

export class PricingConfigNotFoundError extends AppError {
  readonly code = ErrorCode.PRICING_CONFIG_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(message = 'Pricing configuration not found') {
    super(message);
  }
}

export class PaymentOrderNotFoundError extends AppError {
  readonly code = ErrorCode.PAYMENT_ORDER_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(message = 'Payment order not found') {
    super(message);
  }
}

export class PaymentOrderAlreadyPaidError extends AppError {
  readonly code = ErrorCode.PAYMENT_ORDER_ALREADY_PAID;
  readonly httpStatus = 409;

  constructor(message = 'Payment order has already been paid and processed') {
    super(message);
  }
}

export class PaymentVerificationFailedError extends AppError {
  readonly code = ErrorCode.PAYMENT_VERIFICATION_FAILED;
  readonly httpStatus = 400;

  constructor(message = 'Payment verification failed', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class PaymentSignatureInvalidError extends AppError {
  readonly code = ErrorCode.PAYMENT_SIGNATURE_INVALID;
  readonly httpStatus = 400;

  constructor(message = 'Invalid cryptographic payment signature') {
    super(message);
  }
}

export class PaymentGatewayError extends AppError {
  readonly code = ErrorCode.PAYMENT_GATEWAY_ERROR;
  readonly httpStatus = 502;

  constructor(message = 'Payment gateway communication error', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class PaymentRefundFailedError extends AppError {
  readonly code = ErrorCode.PAYMENT_REFUND_FAILED;
  readonly httpStatus = 400;

  constructor(message = 'Failed to execute payment refund', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class InvalidRefundAmountError extends AppError {
  readonly code = ErrorCode.INVALID_REFUND_AMOUNT;
  readonly httpStatus = 400;

  constructor(message = 'Refund amount exceeds refundable balance') {
    super(message);
  }
}

export class WebhookSignatureInvalidError extends AppError {
  readonly code = ErrorCode.WEBHOOK_SIGNATURE_INVALID;
  readonly httpStatus = 401;

  constructor(message = 'Invalid webhook HMAC signature') {
    super(message);
  }
}

export class VoiceSessionNotFoundError extends AppError {
  readonly code = ErrorCode.VOICE_SESSION_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(message = 'Voice session not found') {
    super(message);
  }
}

export class VoiceSessionAlreadyEndedError extends AppError {
  readonly code = ErrorCode.VOICE_SESSION_ALREADY_ENDED;
  readonly httpStatus = 409;

  constructor(message = 'Voice session has already been completed or terminated') {
    super(message);
  }
}

export class VoiceInsufficientBalanceError extends AppError {
  readonly code = ErrorCode.VOICE_INSUFFICIENT_BALANCE;
  readonly httpStatus = 402;

  constructor(message = 'Insufficient wallet balance to start or continue voice session') {
    super(message);
  }
}

export class VoiceSTTFailedError extends AppError {
  readonly code = ErrorCode.VOICE_STT_FAILED;
  readonly httpStatus = 502;

  constructor(message = 'Speech-to-Text transcription failed', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class VoiceTTSFailedError extends AppError {
  readonly code = ErrorCode.VOICE_TTS_FAILED;
  readonly httpStatus = 502;

  constructor(message = 'Text-to-Speech audio synthesis failed', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class VoiceProviderUnavailableError extends AppError {
  readonly code = ErrorCode.VOICE_PROVIDER_UNAVAILABLE;
  readonly httpStatus = 503;

  constructor(message = 'No voice provider is currently available') {
    super(message);
  }
}

// --- Report errors ---

export class ReportNotFoundError extends AppError {
  readonly code = ErrorCode.REPORT_NOT_FOUND;
  readonly httpStatus = 404;

  constructor(message = 'Report not found') {
    super(message);
  }
}

export class ReportAlreadyCompletedError extends AppError {
  readonly code = ErrorCode.REPORT_ALREADY_COMPLETED;
  readonly httpStatus = 409;

  constructor(message = 'Report has already been completed') {
    super(message);
  }
}

export class ReportInsufficientCreditsError extends AppError {
  readonly code = ErrorCode.REPORT_INSUFFICIENT_CREDITS;
  readonly httpStatus = 402;

  constructor(message = 'Insufficient wallet credits to generate report') {
    super(message);
  }
}

export class ReportPartnerProfileRequiredError extends AppError {
  readonly code = ErrorCode.REPORT_PARTNER_PROFILE_REQUIRED;
  readonly httpStatus = 400;

  constructor(message = 'Partner birth profile is required for compatibility reports') {
    super(message);
  }
}

export class ReportJobFailedError extends AppError {
  readonly code = ErrorCode.REPORT_JOB_FAILED;
  readonly httpStatus = 500;

  constructor(message = 'Report generation failed', details?: unknown) {
    super(message, details);
  }
}



