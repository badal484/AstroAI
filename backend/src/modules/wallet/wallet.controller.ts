import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@astroai/shared-types';
import { walletService } from './wallet.service';
import { asyncHandler } from '../../shared/asyncHandler';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId: req.requestId,
  };
  res.status(status).json(body);
}

export const walletController = {
  getBalance: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const balance = await walletService.getBalance(userId);
    ok(req, res, balance);
  }),

  getTransactions: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      cursor: req.query.cursor as string | undefined,
      type: req.query.type as any,
      source: req.query.source as any,
    };
    const result = await walletService.getTransactions(userId, query);
    ok(req, res, result);
  }),

  adminListWallets: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await walletService.listAllWallets(limit, cursor);
    ok(req, res, result);
  }),

  adminGetUserWallet: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const balance = await walletService.getBalance(userId);
    const transactions = await walletService.getTransactions(userId, { limit: 50 });
    ok(req, res, { balance, transactions });
  }),

  adminAdjustWallet: asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.admin?.id ?? 'system';
    const userId = req.params.userId as string;
    const result = await walletService.adjustment(adminId, userId, req.body);
    ok(req, res, result, 201);
  }),

  adminReconcileWallet: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const result = await walletService.reconcile(userId);
    ok(req, res, result);
  }),
};
