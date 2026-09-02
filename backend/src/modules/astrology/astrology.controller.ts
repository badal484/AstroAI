import type { Request, Response } from 'express';
import type {
  ApiSuccessResponse,
  CompatibilityRequest,
  TransitsQuery,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { astrologyService } from './astrology.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const astrologyController = {
  getChart: asyncHandler(async (req: Request, res: Response) => {
    const chart = await astrologyService.getChart(
      req.user!.id,
      req.params.birthProfileId as string,
    );
    ok(req, res, chart, 200);
  }),

  getTransits: asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query as unknown as TransitsQuery;
    const transits = await astrologyService.getTransits(
      req.user!.id,
      req.params.birthProfileId as string,
      date,
    );
    ok(req, res, { transits }, 200);
  }),

  getCompatibility: asyncHandler(async (req: Request, res: Response) => {
    const { birthProfileIdA, birthProfileIdB } = req.body as CompatibilityRequest;
    const score = await astrologyService.getCompatibility(
      req.user!.id,
      birthProfileIdA,
      birthProfileIdB,
    );
    ok(req, res, score, 200);
  }),
};
