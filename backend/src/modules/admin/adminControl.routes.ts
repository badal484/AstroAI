import { AdminPermission } from '@astroai/shared-types';
import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { adminControlController } from './adminControl.controller';

const router = Router();

// All control center routes require authenticated admin session
router.use(authenticateAdmin);

// 1. User 360 & User Actions
router.get(
  '/users/:id/overview',
  requirePermission(AdminPermission.USERS_READ),
  (req, res, next) => adminControlController.getUser360(req, res, next),
);
router.post(
  '/users/:id/action',
  requirePermission(AdminPermission.USERS_MANAGE),
  (req, res, next) => adminControlController.executeUserAction(req, res, next),
);

// 2. Audit Logs
router.get(
  '/audit-logs',
  requirePermission(AdminPermission.AUDIT_LOGS_READ),
  (req, res, next) => adminControlController.listAuditLogs(req, res, next),
);

// 3. AI Providers & Routing
router.get(
  '/ai/config',
  requirePermission(AdminPermission.AI_READ),
  (req, res, next) => adminControlController.getAIConfig(req, res, next),
);

// 4. Astrology Engine Config
router.get(
  '/astrology/config',
  requirePermission(AdminPermission.ASTROLOGY_READ),
  (req, res, next) => adminControlController.getAstrologyConfig(req, res, next),
);
router.put(
  '/astrology/config',
  requirePermission(AdminPermission.ASTROLOGY_MANAGE),
  (req, res, next) => adminControlController.updateAstrologyConfig(req, res, next),
);

// 5. Content CMS
router.get(
  '/content/horoscopes',
  requirePermission(AdminPermission.CONTENT_READ),
  (req, res, next) => adminControlController.listHoroscopes(req, res, next),
);
router.get(
  '/content/articles',
  requirePermission(AdminPermission.CONTENT_READ),
  (req, res, next) => adminControlController.listArticles(req, res, next),
);
router.get(
  '/content/remedies',
  requirePermission(AdminPermission.CONTENT_READ),
  (req, res, next) => adminControlController.listRemedies(req, res, next),
);

// 6. Feature Flags
router.get(
  '/feature-flags',
  requirePermission(AdminPermission.FEATURE_FLAGS_READ),
  (req, res, next) => adminControlController.listFeatureFlags(req, res, next),
);
router.post(
  '/feature-flags/:key/toggle',
  requirePermission(AdminPermission.FEATURE_FLAGS_MANAGE),
  (req, res, next) => adminControlController.toggleFeatureFlag(req, res, next),
);

// 7. Executive Analytics
router.get(
  '/analytics/overview',
  requirePermission(AdminPermission.ANALYTICS_READ),
  (req, res, next) => adminControlController.getExecutiveMetrics(req, res, next),
);
router.get(
  '/analytics/revenue',
  requirePermission(AdminPermission.ANALYTICS_READ),
  (req, res, next) => adminControlController.getRevenueChart(req, res, next),
);

// 8. Support Helpdesk
router.get(
  '/support/tickets',
  requirePermission(AdminPermission.SUPPORT_READ),
  (req, res, next) => adminControlController.listSupportTickets(req, res, next),
);
router.post(
  '/support/tickets/:id/reply',
  requirePermission(AdminPermission.SUPPORT_MANAGE),
  (req, res, next) => adminControlController.replySupportTicket(req, res, next),
);
router.post(
  '/support/tickets/:id/resolve',
  requirePermission(AdminPermission.SUPPORT_MANAGE),
  (req, res, next) => adminControlController.resolveSupportTicket(req, res, next),
);

// 9. System Settings & Maintenance
router.get(
  '/settings',
  requirePermission(AdminPermission.SYSTEM_SETTINGS_READ),
  (req, res, next) => adminControlController.getSystemSettings(req, res, next),
);
router.post(
  '/settings/maintenance',
  requirePermission(AdminPermission.SYSTEM_SETTINGS_MANAGE),
  (req, res, next) => adminControlController.toggleMaintenanceMode(req, res, next),
);

// 10. Admin User Accounts
router.get(
  '/admin-users',
  requirePermission(AdminPermission.ADMIN_USERS_MANAGE),
  (req, res, next) => adminControlController.listAdminUsers(req, res, next),
);
router.post(
  '/admin-users',
  requirePermission(AdminPermission.ADMIN_USERS_MANAGE),
  (req, res, next) => adminControlController.createAdminUser(req, res, next),
);

export const adminControlRoutes = router;
