import { randomBytes, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { TokenExpiredError, UnauthorizedError } from './errors';

/** Opaque refresh token: random bytes, only the sha256 hash is ever stored
 * server-side (in a Session document) — the raw value is shown to the
 * client exactly once, at issuance. This makes revocation trivial (delete/
 * mark the session) without needing a JWT blacklist. */
export function generateOpaqueToken(): string {
  return randomBytes(40).toString('hex');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export function signAccessToken(
  payload: AccessTokenPayload,
  secret: string,
  ttlSeconds: number,
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const token = jwt.sign(payload, secret, { expiresIn: ttlSeconds });
  return { token, expiresAt };
}

/** Verifies an access token's signature and expiry only — it does NOT
 * confirm the subject still exists or is still active. Callers (the
 * authenticate middleware) must re-check current account status against
 * the database, since a token can outlive a suspension issued mid-lifetime. */
export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || !('sub' in decoded) || !('role' in decoded)) {
      throw new UnauthorizedError('Malformed access token');
    }
    return { sub: String(decoded.sub), role: String(decoded.role) };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    }
    throw new UnauthorizedError('Invalid access token');
  }
}
