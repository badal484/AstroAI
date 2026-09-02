import type { Request, Response } from 'express';
import { AuthProviderType, type AuthResponse } from '@astroai/shared-types';
import type {
  ApiSuccessResponse,
  AuthUser,
  GoogleSignInInput,
  RefreshTokenInput,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { authService } from './auth.service';
import type { SessionMeta } from './session';

function sessionMeta(req: Request): SessionMeta {
  return { userAgent: req.header('user-agent') ?? null, ip: req.ip ?? null };
}

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const authController = {
  googleSignIn: asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body as GoogleSignInInput;
    const result: AuthResponse = await authService.signIn(
      AuthProviderType.GOOGLE,
      idToken,
      sessionMeta(req),
    );
    ok(req, res, result, 200);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result: AuthResponse = await authService.refresh(refreshToken, sessionMeta(req));
    ok(req, res, result, 200);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken);
    ok(req, res, { success: true }, 200);
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.id);
    ok(req, res, { success: true }, 200);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user: AuthUser = await authService.me(req.user!.id);
    ok(req, res, user, 200);
  }),

  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    await authService.deleteAccount(req.user!.id);
    ok(req, res, { success: true }, 200);
  }),
};
