import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminUsersRouter } from './adminUsers.routes';
import { adminPricingRouter } from '../pricing';
import { adminWalletRouter } from '../wallet';
import { adminPaymentRouter } from '../payments';
import { adminVoiceRouter } from '../voice';
import { adminReportRouter } from '../reports';
import { adminControlRoutes } from './adminControl.routes';

export const adminRouter = Router();
adminRouter.use(adminAuthRouter);
adminRouter.use(adminUsersRouter);
adminRouter.use(adminPricingRouter);
adminRouter.use(adminWalletRouter);
adminRouter.use(adminPaymentRouter);
adminRouter.use(adminVoiceRouter);
adminRouter.use('/reports', adminReportRouter);
adminRouter.use(adminControlRoutes);

export { adminAuthService } from './adminAuth.service';
export { adminSessionService } from './adminSession';
export { rolePermissions, permissionsForRole } from './rbac';
export { auditLogService } from './auditLog.service';
export { adminControlService } from './adminControl.service';
