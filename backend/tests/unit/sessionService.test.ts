import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionRevokedError, UnauthorizedError } from '../../src/shared/errors';
import {
  createSessionSchema,
  type SessionModelType,
} from '../../src/shared/session/session.schema';
import { createSessionService } from '../../src/shared/session/session.service';

const SessionModel = mongoose.model(
  'TestSession',
  createSessionSchema(),
) as unknown as SessionModelType;
const sessionService = createSessionService(SessionModel, 3600);

function newSubjectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

describe('session service', () => {
  beforeEach(async () => {
    await SessionModel.deleteMany({});
  });

  it('creates a session and can rotate it exactly once', async () => {
    const subjectId = newSubjectId();
    const issued = await sessionService.createSession(subjectId, { ip: '127.0.0.1' });

    const rotated = await sessionService.rotate(issued.refreshToken, { ip: '127.0.0.1' });
    expect(rotated.subjectId).toEqual(subjectId);
    expect(rotated.session.refreshToken).not.toEqual(issued.refreshToken);
  });

  it('rejects an unknown refresh token', async () => {
    await expect(sessionService.rotate('not-a-real-token')).rejects.toThrow(UnauthorizedError);
  });

  it('detects reuse of an already-rotated token and revokes the whole session family', async () => {
    const subjectId = newSubjectId();
    const first = await sessionService.createSession(subjectId);
    const second = await sessionService.rotate(first.refreshToken);

    // Presenting the OLD (already-rotated) token again is a replay signal.
    await expect(sessionService.rotate(first.refreshToken)).rejects.toThrow(SessionRevokedError);

    // The reuse response revokes the entire family, including the session
    // that legitimately replaced it.
    await expect(sessionService.rotate(second.session.refreshToken)).rejects.toThrow(
      SessionRevokedError,
    );
  });

  it('rejects a revoked session', async () => {
    const subjectId = newSubjectId();
    const issued = await sessionService.createSession(subjectId);
    await sessionService.revoke(issued.refreshToken);

    await expect(sessionService.rotate(issued.refreshToken)).rejects.toThrow(SessionRevokedError);
  });

  it('revokeAllForSubject invalidates every active session for that subject', async () => {
    const subjectId = newSubjectId();
    const a = await sessionService.createSession(subjectId);
    const b = await sessionService.createSession(subjectId);

    await sessionService.revokeAllForSubject(subjectId);

    await expect(sessionService.rotate(a.refreshToken)).rejects.toThrow(SessionRevokedError);
    await expect(sessionService.rotate(b.refreshToken)).rejects.toThrow(SessionRevokedError);
  });

  it('rejects an expired session', async () => {
    const shortLivedService = createSessionService(SessionModel, -1);
    const subjectId = newSubjectId();
    const issued = await shortLivedService.createSession(subjectId);

    await expect(shortLivedService.rotate(issued.refreshToken)).rejects.toThrow(UnauthorizedError);
  });
});
