import { Router } from 'express';
import { healthRouter } from './health.routes';

/**
 * All v1 routes mount here. A future breaking change adds a sibling
 * `routes/v2` mounted at `/api/v2`, never replacing v1 in place
 * (CLAUDE.md §37).
 *
 * Module route routers (auth, users, wallet, ...) are added here as each
 * module is implemented — none exist yet in this foundation phase.
 */
export const v1Router = Router();

v1Router.use(healthRouter);
