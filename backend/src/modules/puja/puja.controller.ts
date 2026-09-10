import type { Request, Response } from 'express';
import type {
  ApiSuccessResponse,
  BookPujaInput,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { pujaService } from './puja.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const pujaController = {
  getCatalog: asyncHandler(async (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const items = pujaService.getCatalog(category);
    ok(req, res, { items }, 200);
  }),

  getPujaById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const puja = pujaService.getPujaById(id);
    if (!puja) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Puja '${id}' not found` },
      });
      return;
    }
    ok(req, res, puja, 200);
  }),

  bookPuja: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as BookPujaInput;
    const order = await pujaService.bookPuja(req.user!.id, input);
    ok(req, res, order, 201);
  }),

  getMyOrders: asyncHandler(async (req: Request, res: Response) => {
    const orders = await pujaService.getUserOrders(req.user!.id);
    ok(req, res, { orders }, 200);
  }),

  getOrderById: asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const order = await pujaService.getOrderById(req.user!.id, orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Puja order not found' },
      });
      return;
    }
    ok(req, res, order, 200);
  }),
};
