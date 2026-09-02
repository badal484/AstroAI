import type { NextFunction, Request, Response } from 'express';
import { AccountStatus } from '@astroai/shared-types';
import { env } from '../config/env';
import { userService } from '../modules/users';
import {
  AccountDeletedError,
  AccountSuspendedError,
  NotFoundError,
  UnauthorizedError,
} from '../shared/errors';
import { verifyAccessToken } from '../shared/tokens';
import { asyncHandler } from '../shared/asyncHandler';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: string };
  }
}

/**
 * Verifies the end-user access token AND re-checks the account's current
 * status against the database on every request (not just the token's
 * signature/expiry) — a suspension issued mid-token-lifetime takes effect
 * immediately rather than waiting up to JWT_ACCESS_TTL_SECONDS for the
 * token to expire (CLAUDE.md's "account suspension" handling requirement).
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) throw new UnauthorizedError('Authentication is required');

    const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);

    const user = await userService.getById(payload.sub).catch((error: unknown) => {
      if (error instanceof NotFoundError) throw new UnauthorizedError('Invalid access token');
      throw error;
    });

    if (user.status === AccountStatus.SUSPENDED) throw new AccountSuspendedError();
    if (user.status === AccountStatus.DELETED) throw new AccountDeletedError();

    req.user = { id: user._id.toString(), role: user.role };
    next();
  },
);
