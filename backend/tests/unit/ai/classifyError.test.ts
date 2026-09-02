import { describe, expect, it } from 'vitest';
import { AIErrorCategory } from '@astroai/shared-types';
import { classifyProviderError } from '../../../src/modules/ai/providers/classifyError';
import { ProviderNotConfiguredError } from '../../../src/modules/ai/providers/unconfigured.adapter';
import { AIProviderName } from '@astroai/shared-types';

function withStatus(status: number): unknown {
  return Object.assign(new Error('provider error'), { status });
}

describe('classifyProviderError', () => {
  it('classifies a timeout/abort as TIMEOUT — retryable and fallback-eligible', () => {
    const error = new DOMException('The operation was aborted', 'TimeoutError');
    const result = classifyProviderError(error);
    expect(result.category).toBe(AIErrorCategory.TIMEOUT);
    expect(result.retryableSameProvider).toBe(true);
    expect(result.fallbackEligible).toBe(true);
  });

  it('classifies 401/403 as AUTHENTICATION — not retried, not fallback-eligible', () => {
    expect(classifyProviderError(withStatus(401)).category).toBe(AIErrorCategory.AUTHENTICATION);
    const result = classifyProviderError(withStatus(403));
    expect(result.category).toBe(AIErrorCategory.AUTHENTICATION);
    expect(result.retryableSameProvider).toBe(false);
    expect(result.fallbackEligible).toBe(false);
  });

  it('classifies 429 as RATE_LIMITED — skips same-provider retry, goes straight to fallback', () => {
    const result = classifyProviderError(withStatus(429));
    expect(result.category).toBe(AIErrorCategory.RATE_LIMITED);
    expect(result.retryableSameProvider).toBe(false);
    expect(result.fallbackEligible).toBe(true);
  });

  it('classifies 5xx as SERVER_ERROR — retryable and fallback-eligible', () => {
    const result = classifyProviderError(withStatus(503));
    expect(result.category).toBe(AIErrorCategory.SERVER_ERROR);
    expect(result.retryableSameProvider).toBe(true);
    expect(result.fallbackEligible).toBe(true);
  });

  it('classifies other 4xx as INVALID_REQUEST — not retried, not fallback-eligible', () => {
    const result = classifyProviderError(withStatus(400));
    expect(result.category).toBe(AIErrorCategory.INVALID_REQUEST);
    expect(result.retryableSameProvider).toBe(false);
    expect(result.fallbackEligible).toBe(false);
  });

  it('classifies an unstructured error as UNKNOWN — lenient, retryable and fallback-eligible', () => {
    const result = classifyProviderError(new Error('ECONNRESET'));
    expect(result.category).toBe(AIErrorCategory.UNKNOWN);
    expect(result.retryableSameProvider).toBe(true);
    expect(result.fallbackEligible).toBe(true);
  });

  it('classifies an unconfigured-provider error as NOT_CONFIGURED — skips straight to fallback', () => {
    const result = classifyProviderError(new ProviderNotConfiguredError(AIProviderName.OPENAI));
    expect(result.category).toBe(AIErrorCategory.NOT_CONFIGURED);
    expect(result.retryableSameProvider).toBe(false);
    expect(result.fallbackEligible).toBe(true);
  });
});
