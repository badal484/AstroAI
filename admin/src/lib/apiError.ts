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
