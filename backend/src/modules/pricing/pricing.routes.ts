import { Router } from 'express';
import { AdminPermission, createPricingConfigSchema } from '@astroai/shared-types';
import { pricingController } from './pricing.controller';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validateBody } from '../../middleware/validate.middleware';

/**
 * Public/User Pricing router mounted at /api/v1/pricing
 */
export const pricingRouter = Router();
pricingRouter.get('/pricing', pricingController.getExplanation);
pricingRouter.get('/pricing/packs', pricingController.getCreditPacks);

/**
 * Admin Pricing router mounted at /api/v1/admin/pricing
 */
export const adminPricingRouter = Router();
adminPricingRouter.use('/pricing', authenticateAdmin);

adminPricingRouter.get(
  '/pricing',
  requirePermission(AdminPermission.PRICING_READ),
  pricingController.getActiveConfig,
);

adminPricingRouter.get(
  '/pricing/versions',
  requirePermission(AdminPermission.PRICING_READ),
  pricingController.listVersions,
);

adminPricingRouter.get(
  '/pricing/versions/:version',
  requirePermission(AdminPermission.PRICING_READ),
  pricingController.getByVersion,
);

adminPricingRouter.post(
  '/pricing',
  requirePermission(AdminPermission.PRICING_MANAGE),
  validateBody(createPricingConfigSchema),
  pricingController.createVersion,
);
