import type { Request, Response } from 'express';
import type {
  AdminPaymentRefundInput,
  ApiSuccessResponse,
  CreatePaymentOrderInput,
  PaymentHistoryQuery,
  PaymentVerificationInput,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors';
import { paymentService } from './payment.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId: req.requestId,
  };
  res.status(status).json(body);
}

export const paymentController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const input = req.body as CreatePaymentOrderInput;
    const order = await paymentService.createOrder(userId, input);
    ok(req, res, order, 201);
  }),

  verifyPayment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const input = req.body as PaymentVerificationInput;
    const result = await paymentService.verifyPayment(userId, input);
    ok(req, res, result);
  }),

  getUserPayments: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const query: PaymentHistoryQuery = {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      cursor: req.query.cursor as string | undefined,
      status: req.query.status as any,
    };

    const result = await paymentService.getUserPayments(userId, query);
    ok(req, res, result);
  }),

  handleWebhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = (req.header('x-razorpay-signature') ||
      req.header('X-Razorpay-Signature') ||
      '') as string;

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await paymentService.handleWebhook(rawBody, signature);
    ok(req, res, result);
  }),

  adminListPayments: asyncHandler(async (req: Request, res: Response) => {
    const query: PaymentHistoryQuery = {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      cursor: req.query.cursor as string | undefined,
      status: req.query.status as any,
    };

    const result = await paymentService.adminListPayments(query);
    ok(req, res, result);
  }),

  adminGetPaymentDetails: asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const result = await paymentService.getOrderDetails(orderId);
    ok(req, res, result);
  }),

  adminRefundPayment: asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.admin?.id ?? 'admin_system';
    const orderId = req.params.id as string;
    const input = req.body as AdminPaymentRefundInput;

    const refund = await paymentService.refundOrder(adminId, orderId, input);
    ok(req, res, refund, 201);
  }),

  adminReconcilePayment: asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const result = await paymentService.reconcileOrder(orderId);
    ok(req, res, result);
  }),
};
