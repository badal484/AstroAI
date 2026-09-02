import type { NextFunction, Request, Response } from 'express';
import { AccountStatus, type AdminPermission, type AdminRole } from '@astroai/shared-types';
import { env } from '../config/env';
import { adminUserRepository } from '../modules/admin/adminUser.repository';
import { permissionsForRole } from '../modules/admin/rbac';
import { AccountSuspendedError, UnauthorizedError } from '../shared/errors';
import { verifyAccessToken } from '../shared/tokens';
import { asyncHandler } from '../shared/asyncHandler';

declare module 'express-serve-static-core' {
  interface Request {
    admin?: { id: string; role: AdminRole; permissions: AdminPermission[] };
  }
}

export const ADMIN_ACCESS_COOKIE = 'admin_access_token';
export const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';

/**
 * Separate audience/secret from end-user auth (ARCHITECTURE.md §14) — an
 * end-user access token can never pass this check and vice versa. Accepts
 * the token from the admin_access_token httpOnly cookie (how the Next.js
 * admin app authenticates) or an Authorization header (tools/tests).
 */
export const authenticateAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header('authorization');
    const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    const token =
      bearer ?? (req.cookies as Record<string, string> | undefined)?.[ADMIN_ACCESS_COOKIE];

    if (!token) throw new UnauthorizedError('Admin authentication is required');

    const payload = verifyAccessToken(token, env.ADMIN_JWT_ACCESS_SECRET);
    const admin = await adminUserRepository.findById(payload.sub);

    if (!admin) throw new UnauthorizedError('Invalid admin session');
    if (admin.status === AccountStatus.SUSPENDED || admin.status === AccountStatus.DELETED) {
      throw new AccountSuspendedError('This admin account has been deactivated');
    }

    req.admin = {
      id: admin._id.toString(),
      role: admin.role,
      permissions: permissionsForRole(admin.role),
    };
    next();
  },
);
