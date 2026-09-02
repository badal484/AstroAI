import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AdminPermission } from '@astroai/shared-types';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';

/** Must run after authenticateAdmin. The authoritative RBAC check
 * (CLAUDE.md §32/§37) — never trust a client-sent permission claim. */
export function requirePermission(permission: AdminPermission): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      next(new UnauthorizedError('Admin authentication is required'));
      return;
    }
    if (!req.admin.permissions.includes(permission)) {
      next(new ForbiddenError(`Missing required permission: ${permission}`));
      return;
    }
    next();
  };
}
