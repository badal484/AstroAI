import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@astroai/shared-types';
import { pricingService } from './pricing.service';
import { asyncHandler } from '../../shared/asyncHandler';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId: req.requestId,
  };
  res.status(status).json(body);
}

export const pricingController = {
  getExplanation: asyncHandler(async (req: Request, res: Response) => {
    const explanation = await pricingService.getPricingExplanation();
    ok(req, res, explanation);
  }),

  getCreditPacks: asyncHandler(async (req: Request, res: Response) => {
    const packs = await pricingService.getCreditPacks();
    ok(req, res, packs);
  }),

  getActiveConfig: asyncHandler(async (req: Request, res: Response) => {
    const config = await pricingService.getActiveConfig();
    ok(req, res, config);
  }),

  listVersions: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await pricingService.listVersions(limit, cursor);
    ok(req, res, result);
  }),

  getByVersion: asyncHandler(async (req: Request, res: Response) => {
    const version = parseInt(req.params.version as string, 10);
    const config = await pricingService.getByVersion(version);
    ok(req, res, config);
  }),

  createVersion: asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.admin?.id ?? 'system';
    const config = await pricingService.createConfigVersion(adminId, req.body);
    ok(req, res, config, 201);
  }),
};
