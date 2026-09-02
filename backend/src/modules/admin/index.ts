import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminUsersRouter } from './adminUsers.routes';

export const adminRouter = Router();
adminRouter.use(adminAuthRouter);
adminRouter.use(adminUsersRouter);

export { adminAuthService } from './adminAuth.service';
export { adminSessionService } from './adminSession';
export { rolePermissions, permissionsForRole } from './rbac';
