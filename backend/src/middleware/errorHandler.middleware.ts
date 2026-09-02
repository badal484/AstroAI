import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
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

  if (err instanceof ZodError) {
    return new ValidationError('Request validation failed', err.flatten());
  }

  return new (class extends AppError {
    readonly code = ErrorCode.INTERNAL_ERROR;
    readonly httpStatus = 500;
  })(err instanceof Error ? err.message : 'Unknown error');
}
