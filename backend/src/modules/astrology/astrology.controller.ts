import type { Request, Response } from 'express';
import type {
  AnalyzePalmInput,
  ApiSuccessResponse,
  CastPrashnaInput,
  CompatibilityRequest,
  TransitsQuery,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { astrologyService } from './astrology.service';
import { cosmicRadarEngine } from './engine/cosmicRadarEngine';
import { palmistryService } from './palmistry.service';
import { prashnaService } from './prashna.service';
import { dashaService } from './dasha.service';

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

  getCosmicRadar: asyncHandler(async (req: Request, res: Response) => {
    const radar = cosmicRadarEngine.calculate();
    ok(req, res, radar, 200);
  }),

  analyzePalm: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as AnalyzePalmInput;
    const result = await palmistryService.analyzePalm(req.user!.id, input);
    ok(req, res, result, 200);
  }),

  castPrashna: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CastPrashnaInput;
    const result = prashnaService.castPrashna(input);
    ok(req, res, result, 200);
  }),

  getDashaTimeline: asyncHandler(async (req: Request, res: Response) => {
    const birthProfileId = req.query.birthProfileId as string | undefined;
    const timeline = await dashaService.getDashaTimeline(req.user!.id, birthProfileId);
    ok(req, res, timeline, 200);
  }),
};
