import { SessionRevokedError, UnauthorizedError } from '../errors';
import { generateOpaqueToken, hashToken } from '../tokens';
import type { SessionModelType } from './session.schema';

export interface SessionMeta {
  userAgent?: string | null;
  ip?: string | null;
}

export interface IssuedSession {
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Refresh-token/session lifecycle shared by end-user and admin auth
 * (ARCHITECTURE.md §7-style ledger pattern applied to sessions instead of
 * money: append-only issuance, explicit revocation, reuse detection).
 * Each caller (modules/auth, modules/admin) instantiates this once per its
 * own Mongoose model/collection, keeping the two entirely separate.
 */
export function createSessionService(SessionModel: SessionModelType, ttlSeconds: number) {
  async function createSession(subjectId: string, meta: SessionMeta = {}): Promise<IssuedSession> {
    const refreshToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await SessionModel.create({
      subjectId,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
      expiresAt,
    });

    return { refreshToken, expiresAt };
  }

  /**
   * Validates a presented refresh token and rotates it: the old session is
   * marked revoked+replaced, a new session is created, and the new raw
   * token is returned. If the presented token was already rotated (its
   * session exists but is revoked with replacedByTokenHash set) that's a
   * reuse/replay signal — every session for this subject is revoked as a
   * precaution and SessionRevokedError is thrown, forcing a full re-login.
   */
  async function rotate(
    rawRefreshToken: string,
    meta: SessionMeta = {},
  ): Promise<{ subjectId: string; session: IssuedSession }> {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await SessionModel.findOne({ refreshTokenHash: tokenHash }).exec();

    if (!existing) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (existing.revokedAt) {
      if (existing.replacedByTokenHash) {
        // Reuse of an already-rotated token — possible theft. Nuke the family.
        await SessionModel.updateMany(
          { subjectId: existing.subjectId, revokedAt: null },
          { revokedAt: new Date() },
        ).exec();
      }
      throw new SessionRevokedError();
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const subjectId = existing.subjectId.toString();
    const next = await createSession(subjectId, meta);

    existing.revokedAt = new Date();
    existing.replacedByTokenHash = hashToken(next.refreshToken);
    await existing.save();

    return { subjectId, session: next };
  }

  async function revoke(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await SessionModel.updateOne(
      { refreshTokenHash: tokenHash, revokedAt: null },
      { revokedAt: new Date() },
    ).exec();
  }

  async function revokeAllForSubject(subjectId: string): Promise<void> {
    await SessionModel.updateMany({ subjectId, revokedAt: null }, { revokedAt: new Date() }).exec();
  }

  return { createSession, rotate, revoke, revokeAllForSubject };
}

export type SessionService = ReturnType<typeof createSessionService>;
