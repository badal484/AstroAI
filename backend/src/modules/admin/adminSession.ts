import { model } from 'mongoose';
import { env } from '../../config/env';
import { createSessionSchema, type SessionModelType } from '../../shared/session/session.schema';
import { createSessionService } from '../../shared/session/session.service';

export const AdminSessionModel = model('AdminSession', createSessionSchema()) as SessionModelType;

export const adminSessionService = createSessionService(
  AdminSessionModel,
  env.ADMIN_JWT_REFRESH_TTL_SECONDS,
);

export type { SessionMeta, IssuedSession } from '../../shared/session/session.service';
