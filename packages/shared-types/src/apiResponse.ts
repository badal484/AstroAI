import { z } from 'zod';
import { ErrorCode } from './errorCode';

/**
 * Fixed response envelope used by every /api/v1 endpoint (see ARCHITECTURE.md §2).
 * `requestId` always mirrors the `x-request-id` correlation header for the request.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.nativeEnum(ErrorCode),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string(),
});
