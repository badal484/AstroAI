import argon2 from 'argon2';
import { AccountStatus, type AdminSessionUser } from '@astroai/shared-types';
import { env } from '../../config/env';
import { AccountSuspendedError, InvalidCredentialsError, NotFoundError } from '../../shared/errors';
import { signAccessToken } from '../../shared/tokens';
import { adminUserRepository } from './adminUser.repository';
import { adminSessionService, type IssuedSession, type SessionMeta } from './adminSession';
import { permissionsForRole } from './rbac';
import type { AdminUserDocument } from './adminUser.model';

export interface AdminAuthResult {
  admin: AdminSessionUser;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

function toAdminSessionUser(admin: AdminUserDocument): AdminSessionUser {
  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: permissionsForRole(admin.role),
  };
}

function assertActive(admin: AdminUserDocument): void {
  if (admin.status === AccountStatus.SUSPENDED || admin.status === AccountStatus.DELETED) {
    throw new AccountSuspendedError('This admin account has been deactivated');
  }
}

function buildResult(admin: AdminUserDocument, session: IssuedSession): AdminAuthResult {
  const access = signAccessToken(
    { sub: admin._id.toString(), role: admin.role },
    env.ADMIN_JWT_ACCESS_SECRET,
    env.ADMIN_JWT_ACCESS_TTL_SECONDS,
  );

  return {
    admin: toAdminSessionUser(admin),
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken: session.refreshToken,
    refreshTokenExpiresAt: session.expiresAt,
  };
}

export const adminAuthService = {
  async login(email: string, password: string, meta: SessionMeta): Promise<AdminAuthResult> {
    const admin = await adminUserRepository.findByEmail(email);
    if (!admin) throw new InvalidCredentialsError();

    const valid = await argon2.verify(admin.passwordHash, password);
    if (!valid) throw new InvalidCredentialsError();

    assertActive(admin);

    const session = await adminSessionService.createSession(admin._id.toString(), meta);
    return buildResult(admin, session);
  },

  async refresh(rawRefreshToken: string, meta: SessionMeta): Promise<AdminAuthResult> {
    const { subjectId, session } = await adminSessionService.rotate(rawRefreshToken, meta);
    const admin = await adminUserRepository.findById(subjectId);
    if (!admin) throw new NotFoundError('Admin account not found');
    assertActive(admin);
    return buildResult(admin, session);
  },

  async logout(rawRefreshToken: string): Promise<void> {
    await adminSessionService.revoke(rawRefreshToken);
  },

  async me(adminId: string): Promise<AdminSessionUser> {
    const admin = await adminUserRepository.findById(adminId);
    if (!admin) throw new NotFoundError('Admin account not found');
    assertActive(admin);
    return toAdminSessionUser(admin);
  },
};
