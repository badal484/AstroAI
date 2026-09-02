import { Router } from 'express';
import { googleSignInSchema, refreshTokenSchema } from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { createRateLimiter } from '../../middleware/rateLimiter.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { authController } from './auth.controller';

export const authRouter = Router();

// Auth endpoints are a common abuse target (credential stuffing, token
// guessing) — a stricter limiter than the app-wide default, per
// ARCHITECTURE.md §15 ("stricter limits on auth endpoints").
const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: 'auth',
});

authRouter.use('/auth', authRateLimiter);

authRouter.post('/auth/google', validateBody(googleSignInSchema), authController.googleSignIn);
authRouter.post('/auth/refresh', validateBody(refreshTokenSchema), authController.refresh);
authRouter.post('/auth/logout', validateBody(refreshTokenSchema), authController.logout);
authRouter.post('/auth/logout-all', authenticate, authController.logoutAll);
authRouter.get('/auth/me', authenticate, authController.me);
authRouter.delete('/auth/me', authenticate, authController.deleteAccount);
