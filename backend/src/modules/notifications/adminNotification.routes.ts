import { Router } from 'express';
import { AdminPermission } from '@astroai/shared-types';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { adminNotificationController } from './adminNotification.controller';

export const adminNotificationRouter = Router();

// Gated with authenticateAdmin & requirePermission
adminNotificationRouter.use(authenticateAdmin);

// Stats & Metrics
adminNotificationRouter.get(
  '/stats',
  requirePermission(AdminPermission.NOTIFICATIONS_READ),
  adminNotificationController.getStats,
);

// Templates
adminNotificationRouter.get(
  '/templates',
  requirePermission(AdminPermission.NOTIFICATIONS_READ),
  adminNotificationController.listTemplates,
);

adminNotificationRouter.post(
  '/templates',
  requirePermission(AdminPermission.NOTIFICATIONS_MANAGE),
  adminNotificationController.createTemplate,
);

adminNotificationRouter.put(
  '/templates/:id',
  requirePermission(AdminPermission.NOTIFICATIONS_MANAGE),
  adminNotificationController.updateTemplate,
);

// Campaigns
adminNotificationRouter.get(
  '/campaigns',
  requirePermission(AdminPermission.NOTIFICATIONS_READ),
  adminNotificationController.listCampaigns,
);

adminNotificationRouter.post(
  '/campaigns',
  requirePermission(AdminPermission.NOTIFICATIONS_MANAGE),
  adminNotificationController.createCampaign,
);

adminNotificationRouter.get(
  '/campaigns/:id',
  requirePermission(AdminPermission.NOTIFICATIONS_READ),
  adminNotificationController.getCampaign,
);

adminNotificationRouter.put(
  '/campaigns/:id',
  requirePermission(AdminPermission.NOTIFICATIONS_MANAGE),
  adminNotificationController.updateCampaign,
);

adminNotificationRouter.post(
  '/campaigns/:id/execute',
  requirePermission(AdminPermission.NOTIFICATIONS_MANAGE),
  adminNotificationController.executeCampaign,
);

adminNotificationRouter.post(
  '/campaigns/:id/pause',
  requirePermission(AdminPermission.NOTIFICATIONS_MANAGE),
  adminNotificationController.pauseCampaign,
);

adminNotificationRouter.post(
  '/campaigns/:id/resume',
  requirePermission(AdminPermission.NOTIFICATIONS_MANAGE),
  adminNotificationController.resumeCampaign,
);

// Delivery Logs
adminNotificationRouter.get(
  '/logs',
  requirePermission(AdminPermission.NOTIFICATIONS_READ),
  adminNotificationController.listLogs,
);
