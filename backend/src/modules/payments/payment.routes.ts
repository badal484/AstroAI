import { Router } from 'express';
import {
  AdminPermission,
  adminPaymentRefundSchema,
  createPaymentOrderSchema,
  paymentVerificationSchema,
} from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { paymentController } from './payment.controller';

/**
 * Public & User Payment router mounted at /api/v1/payments
 */
export const paymentRouter = Router();

// Public Webhook listener (authoritative verification via HMAC signature)
paymentRouter.post('/payments/webhook', paymentController.handleWebhook);

// Protected User Payment Routes
paymentRouter.post(
  '/payments/orders',
  authenticate,
  validateBody(createPaymentOrderSchema),
  paymentController.createOrder,
);

paymentRouter.post(
  '/payments/verify',
  authenticate,
  validateBody(paymentVerificationSchema),
  paymentController.verifyPayment,
);

paymentRouter.get(
  '/payments/history',
  authenticate,
  paymentController.getUserPayments,
);

/**
 * Admin Payment router mounted at /api/v1/admin/payments
 */
export const adminPaymentRouter = Router();
adminPaymentRouter.use('/payments', authenticateAdmin);

adminPaymentRouter.get(
  '/payments',
  requirePermission(AdminPermission.PAYMENTS_READ),
  paymentController.adminListPayments,
);

adminPaymentRouter.get(
  '/payments/:id',
  requirePermission(AdminPermission.PAYMENTS_READ),
  paymentController.adminGetPaymentDetails,
);

adminPaymentRouter.post(
  '/payments/:id/refund',
  requirePermission(AdminPermission.PAYMENTS_MANAGE),
  validateBody(adminPaymentRefundSchema),
  paymentController.adminRefundPayment,
);

adminPaymentRouter.post(
  '/payments/:id/reconcile',
  requirePermission(AdminPermission.PAYMENTS_MANAGE),
  paymentController.adminReconcilePayment,
);
