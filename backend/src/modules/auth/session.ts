import { model } from 'mongoose';
import { env } from '../../config/env';
import { createSessionSchema, type SessionModelType } from '../../shared/session/session.schema';
import { createSessionService } from '../../shared/session/session.service';

export const UserSessionModel = model('Session', createSessionSchema()) as SessionModelType;

export const userSessionService = createSessionService(
  UserSessionModel,
  env.JWT_REFRESH_TTL_SECONDS,
);

export type { SessionMeta, IssuedSession } from '../../shared/session/session.service';
