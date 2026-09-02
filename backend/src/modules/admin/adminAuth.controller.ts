import type { CookieOptions, Request, Response } from 'express';
import type { AdminLoginInput, ApiSuccessResponse } from '@astroai/shared-types';
import { env } from '../../config/env';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors';
import { adminAuthService, type AdminAuthResult } from './adminAuth.service';
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
} from '../../middleware/authenticateAdmin.middleware';

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Path "/" (not scoped to /api/v1/admin): the admin Next.js app's own
    // proxy.ts needs to see this cookie on requests to ITS pages (/, /login,
    // ...), not just on calls to the backend API. Cookies are matched by
    // (registrable domain, path) — never by port — so this same cookie is
    // also correctly sent on API calls to localhost:4000 in local dev where
    // the admin app runs on localhost:3000. httpOnly + SameSite=Lax already
    // protect it; the wider path only affects which of *our own* requests
    // include it, not who else can read it.
    path: '/',
    ...(env.ADMIN_COOKIE_DOMAIN ? { domain: env.ADMIN_COOKIE_DOMAIN } : {}),
  };
}

function setSessionCookies(res: Response, result: AdminAuthResult): void {
  res.cookie(ADMIN_ACCESS_COOKIE, result.accessToken, {
    ...baseCookieOptions(),
    expires: result.accessTokenExpiresAt,
  });
  res.cookie(ADMIN_REFRESH_COOKIE, result.refreshToken, {
    ...baseCookieOptions(),
    expires: result.refreshTokenExpiresAt,
  });
}

function clearSessionCookies(res: Response): void {
  res.clearCookie(ADMIN_ACCESS_COOKIE, baseCookieOptions());
  res.clearCookie(ADMIN_REFRESH_COOKIE, baseCookieOptions());
}

function readRefreshToken(req: Request): string | undefined {
  const fromCookie = (req.cookies as Record<string, string> | undefined)?.[ADMIN_REFRESH_COOKIE];
  if (fromCookie) return fromCookie;
  const body = req.body as { refreshToken?: unknown } | undefined;
  return typeof body?.refreshToken === 'string' ? body.refreshToken : undefined;
}

function sessionMeta(req: Request) {
  return { userAgent: req.header('user-agent') ?? null, ip: req.ip ?? null };
}

function ok<T>(req: Request, res: Response, data: T): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(200).json(body);
}

export const adminAuthController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as AdminLoginInput;
    const result = await adminAuthService.login(email, password, sessionMeta(req));
    setSessionCookies(res, result);
    ok(req, res, { admin: result.admin });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) throw new UnauthorizedError('No refresh token provided');

    const result = await adminAuthService.refresh(refreshToken, sessionMeta(req));
    setSessionCookies(res, result);
    ok(req, res, { admin: result.admin });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) await adminAuthService.logout(refreshToken);
    clearSessionCookies(res);
    ok(req, res, { success: true });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const admin = await adminAuthService.me(req.admin!.id);
    ok(req, res, admin);
  }),
};
