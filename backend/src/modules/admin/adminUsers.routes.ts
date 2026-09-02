import { Router } from 'express';
import { AdminPermission, paginationQuerySchema } from '@astroai/shared-types';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validateQuery } from '../../middleware/validate.middleware';
import { adminUsersController } from './adminUsers.controller';

export const adminUsersRouter = Router();

adminUsersRouter.use('/users', authenticateAdmin);

adminUsersRouter.get(
  '/users',
  requirePermission(AdminPermission.USERS_READ),
  validateQuery(paginationQuerySchema),
  adminUsersController.list,
);

adminUsersRouter.post(
  '/users/:id/suspend',
  requirePermission(AdminPermission.USERS_MANAGE),
  adminUsersController.suspend,
);

adminUsersRouter.post(
  '/users/:id/reactivate',
  requirePermission(AdminPermission.USERS_MANAGE),
  adminUsersController.reactivate,
);
