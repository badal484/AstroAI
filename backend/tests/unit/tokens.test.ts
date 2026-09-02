import { describe, expect, it } from 'vitest';
import { TokenExpiredError, UnauthorizedError } from '../../src/shared/errors';
import {
  generateOpaqueToken,
  hashToken,
  signAccessToken,
  verifyAccessToken,
} from '../../src/shared/tokens';

const SECRET = 'unit-test-secret-value-not-a-real-secret-0123456789';

describe('generateOpaqueToken / hashToken', () => {
  it('generates unique, sufficiently long tokens', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(64);
  });

  it('hashes deterministically so a stored hash can be matched later', () => {
    const token = generateOpaqueToken();
    expect(hashToken(token)).toEqual(hashToken(token));
  });

  it('produces different hashes for different tokens', () => {
    expect(hashToken(generateOpaqueToken())).not.toEqual(hashToken(generateOpaqueToken()));
  });
});

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips a valid token', () => {
    const { token } = signAccessToken({ sub: 'user-1', role: 'user' }, SECRET, 900);
    const payload = verifyAccessToken(token, SECRET);
    expect(payload).toEqual({ sub: 'user-1', role: 'user' });
  });

  it('rejects a token signed with a different secret', () => {
    const { token } = signAccessToken({ sub: 'user-1', role: 'user' }, SECRET, 900);
    expect(() => verifyAccessToken(token, 'a-completely-different-secret-value')).toThrow(
      UnauthorizedError,
    );
  });

  it('rejects an expired token with TokenExpiredError specifically', () => {
    const { token } = signAccessToken({ sub: 'user-1', role: 'user' }, SECRET, -1);
    expect(() => verifyAccessToken(token, SECRET)).toThrow(TokenExpiredError);
  });

  it('rejects a malformed token', () => {
    expect(() => verifyAccessToken('not-a-jwt', SECRET)).toThrow(UnauthorizedError);
  });
});
