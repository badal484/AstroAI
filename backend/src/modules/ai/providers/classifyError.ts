import { AIErrorCategory } from '@astroai/shared-types';

export interface ClassifiedError {
  category: AIErrorCategory;
  /** Worth an immediate same-provider retry with backoff before giving up
   * on this candidate (CLAUDE.md §40 "retry where appropriate"). */
  retryableSameProvider: boolean;
  /** Worth moving on to the alias's next configured fallback candidate
   * (CLAUDE.md §10). */
  fallbackEligible: boolean;
  /** Safe, generic message — never the raw provider error text. */
  message: string;
}

function extractStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return undefined;
}

/**
 * Classifies a raw error thrown by any of the three provider SDKs (or a
 * plain network failure) into a normalized category, independent of which
 * provider threw it — OpenAI's `APIError`, Anthropic's `APIError` and
 * Gemini's `ApiError` all expose the same `.status: number` convention,
 * so one classifier covers all three (CLAUDE.md §10 "error normalization
 * ... callers/users never see raw provider error text").
 */
export function classifyProviderError(error: unknown): ClassifiedError {
  if (error instanceof Error && error.name === 'ProviderNotConfiguredError') {
    return {
      category: AIErrorCategory.NOT_CONFIGURED,
      retryableSameProvider: false,
      fallbackEligible: true,
      message: 'The AI provider is not configured.',
    };
  }

  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return {
      category: AIErrorCategory.TIMEOUT,
      retryableSameProvider: true,
      fallbackEligible: true,
      message: 'The AI provider took too long to respond.',
    };
  }

  const status = extractStatus(error);

  if (status === 401 || status === 403) {
    return {
      category: AIErrorCategory.AUTHENTICATION,
      retryableSameProvider: false,
      fallbackEligible: false,
      message: 'The AI provider rejected the request credentials.',
    };
  }

  if (status === 429) {
    return {
      category: AIErrorCategory.RATE_LIMITED,
      retryableSameProvider: false,
      fallbackEligible: true,
      message: 'The AI provider is rate-limiting requests right now.',
    };
  }

  if (status !== undefined && status >= 500) {
    return {
      category: AIErrorCategory.SERVER_ERROR,
      retryableSameProvider: true,
      fallbackEligible: true,
      message: 'The AI provider returned a server error.',
    };
  }

  if (status !== undefined && status >= 400) {
    return {
      category: AIErrorCategory.INVALID_REQUEST,
      retryableSameProvider: false,
      fallbackEligible: false,
      message: 'The AI provider rejected the request.',
    };
  }

  return {
    category: AIErrorCategory.UNKNOWN,
    retryableSameProvider: true,
    fallbackEligible: true,
    message: 'The AI provider call failed unexpectedly.',
  };
}
