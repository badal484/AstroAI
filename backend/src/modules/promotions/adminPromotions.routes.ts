import { AdminPermission } from '@astroai/shared-types';
import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { adminPromotionsController } from './adminPromotions.controller';

const router = Router();

router.use(authenticateAdmin);

router.get(
  '/',
  requirePermission(AdminPermission.PROMOTIONS_READ),
  (req, res, next) => adminPromotionsController.listPromotions(req, res, next),
);

router.post(
  '/',
  requirePermission(AdminPermission.PROMOTIONS_MANAGE),
  (req, res, next) => adminPromotionsController.createPromotion(req, res, next),
);

router.get(
  '/analytics',
  requirePermission(AdminPermission.PROMOTIONS_READ),
  (req, res, next) => adminPromotionsController.getAnalytics(req, res, next),
);

router.get(
  '/referrals',
  requirePermission(AdminPermission.PROMOTIONS_READ),
  (req, res, next) => adminPromotionsController.listReferrals(req, res, next),
);

router.get(
  '/:id',
  requirePermission(AdminPermission.PROMOTIONS_READ),
  (req, res, next) => adminPromotionsController.getPromotion(req, res, next),
);

router.put(
  '/:id',
  requirePermission(AdminPermission.PROMOTIONS_MANAGE),
  (req, res, next) => adminPromotionsController.updatePromotion(req, res, next),
);

router.post(
  '/:id/status',
  requirePermission(AdminPermission.PROMOTIONS_MANAGE),
  (req, res, next) => adminPromotionsController.updateStatus(req, res, next),
);

export const adminPromotionRoutes = router;
