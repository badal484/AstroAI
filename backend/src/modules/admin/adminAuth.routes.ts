import { Router } from 'express';
import { adminLoginSchema } from '@astroai/shared-types';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { createRateLimiter } from '../../middleware/rateLimiter.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { adminAuthController } from './adminAuth.controller';

export const adminAuthRouter = Router();

const adminAuthRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: 'admin-auth',
});

adminAuthRouter.use('/auth', adminAuthRateLimiter);

adminAuthRouter.post('/auth/login', validateBody(adminLoginSchema), adminAuthController.login);
adminAuthRouter.post('/auth/refresh', adminAuthController.refresh);
adminAuthRouter.post('/auth/logout', adminAuthController.logout);
adminAuthRouter.get('/auth/me', authenticateAdmin, adminAuthController.me);
