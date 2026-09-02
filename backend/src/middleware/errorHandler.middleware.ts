import type { ErrorRequestHandler } from 'express';
import type { ZodError } from 'zod';
import type { ApiErrorResponse } from '@astroai/shared-types';
import { ErrorCode } from '@astroai/shared-types';
import { AppError, ValidationError } from '../shared/errors';
import { logger } from '../shared/logger';

/**
 * Single centralized error middleware (CLAUDE.md §39). Never leaks stack
 * traces or internal error messages to the client; logs full detail
 * server-side keyed by requestId.
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (rawErr, req, res, _next) => {
  const err: unknown = rawErr;
  const requestId = req.requestId ?? 'unknown';
  const appError = toAppError(err);

  if (appError.httpStatus >= 500) {
    logger.error({ err, requestId }, 'Unhandled error');
  } else {
    logger.warn(
      { err: { message: appError.message, code: appError.code }, requestId },
      'Request error',
    );
  }

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message:
        appError.httpStatus >= 500 ? 'Something went wrong. Please try again.' : appError.message,
      ...(appError.details !== undefined ? { details: appError.details } : {}),
    },
    requestId,
  };

  res.status(appError.httpStatus).json(body);
};

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (isZodError(err)) {
    return new ValidationError('Request validation failed', err.flatten());
  }

  return new (class extends AppError {
    readonly code = ErrorCode.INTERNAL_ERROR;
    readonly httpStatus = 500;
  })(err instanceof Error ? err.message : 'Unknown error');
}

/**
 * Duck-typed rather than `instanceof ZodError`: this codebase has observed
 * `instanceof` fail to match here despite the error genuinely being a
 * ZodError (constructor.name === 'ZodError', real .issues array) — most
 * likely two separately-loaded copies of the zod module ending up with
 * distinct class identities. Checking shape instead of identity sidesteps
 * that entirely.
 */
function isZodError(err: unknown): err is ZodError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    err.name === 'ZodError' &&
    'issues' in err &&
    Array.isArray(err.issues) &&
    typeof (err as ZodError).flatten === 'function'
  );
}
