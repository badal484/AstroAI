import { Router } from 'express';
import { authRouter } from '../../modules/auth';
import { adminRouter } from '../../modules/admin';
import { healthRouter } from './health.routes';

/**
 * All v1 routes mount here. A future breaking change adds a sibling
 * `routes/v2` mounted at `/api/v2`, never replacing v1 in place
 * (CLAUDE.md §37).
 */
export const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use(authRouter);
v1Router.use('/admin', adminRouter);
