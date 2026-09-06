import { Router } from 'express';
import { AdminPermission } from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { reportController } from './report.controller';

export const reportRouter = Router();

// User Routes (Protected by session access token)
reportRouter.use(authenticate);
reportRouter.post('/', reportController.createReport);
reportRouter.get('/', reportController.listReports);
reportRouter.get('/:id', reportController.getReport);
reportRouter.get('/:id/pdf', reportController.downloadPdf);
reportRouter.post('/:id/retry', reportController.retryReport);

// Admin Routes
export const adminReportRouter = Router();
adminReportRouter.use(authenticateAdmin);

adminReportRouter.get(
  '/',
  requirePermission(AdminPermission.REPORTS_READ),
  reportController.adminListReports,
);

adminReportRouter.get(
  '/:id',
  requirePermission(AdminPermission.REPORTS_READ),
  reportController.adminGetReport,
);

adminReportRouter.get(
  '/:id/pdf',
  requirePermission(AdminPermission.REPORTS_READ),
  reportController.adminDownloadPdf,
);

adminReportRouter.post(
  '/:id/retry',
  requirePermission(AdminPermission.REPORTS_MANAGE),
  reportController.adminRetryReport,
);

adminReportRouter.post(
  '/:id/refund',
  requirePermission(AdminPermission.REPORTS_MANAGE),
  reportController.adminRefundReport,
);
