import { describe, expect, it } from 'vitest';
import { ApiError, isForbidden } from '../src/lib/apiError';

function makeError(code: string) {
  return new ApiError({ code: code as never, status: 403, message: 'nope', requestId: 'req-1' });
}

describe('isForbidden', () => {
  it('is true for a FORBIDDEN ApiError', () => {
    expect(isForbidden(makeError('FORBIDDEN'))).toBe(true);
  });

  it('is false for other ApiError codes', () => {
    expect(isForbidden(makeError('ACCOUNT_SUSPENDED'))).toBe(false);
    expect(isForbidden(makeError('UNAUTHORIZED'))).toBe(false);
  });

  it('is false for a non-ApiError value', () => {
    expect(isForbidden(new Error('plain error'))).toBe(false);
    expect(isForbidden(null)).toBe(false);
  });
});
