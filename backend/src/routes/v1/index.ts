import { Router } from 'express';
import { authRouter } from '../../modules/auth';
import { adminRouter } from '../../modules/admin';
import { locationRouter } from '../../modules/location';
import { birthProfileRouter } from '../../modules/birthProfiles';
import { astrologyRouter } from '../../modules/astrology';
import { chatRouter } from '../../modules/chat';
import { healthRouter } from './health.routes';

/**
 * All v1 routes mount here. A future breaking change adds a sibling
 * `routes/v2` mounted at `/api/v2`, never replacing v1 in place
 * (CLAUDE.md §37).
 */
export const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use(authRouter);
v1Router.use(locationRouter);
v1Router.use(birthProfileRouter);
v1Router.use(astrologyRouter);
v1Router.use(chatRouter);
v1Router.use('/admin', adminRouter);
