import { Router } from 'express';
import { AdminPermission } from '@astroai/shared-types';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { analyticsController } from './analytics.controller';

const router = Router();

router.use(authenticateAdmin);

router.get(
  '/product',
  requirePermission(AdminPermission.ANALYTICS_READ),
  analyticsController.getProductAnalytics,
);

router.get(
  '/financial',
  requirePermission(AdminPermission.ANALYTICS_READ),
  analyticsController.getFinancialAnalytics,
);

router.get(
  '/ai',
  requirePermission(AdminPermission.ANALYTICS_READ),
  analyticsController.getAITechnicalAnalytics,
);

router.get(
  '/events',
  requirePermission(AdminPermission.ANALYTICS_READ),
  analyticsController.getPaginatedEvents,
);

export const analyticsRoutes = router;
