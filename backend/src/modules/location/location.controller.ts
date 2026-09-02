import type { Request, Response } from 'express';
import type {
  ApiSuccessResponse,
  LocationCandidate,
  LocationSearchQuery,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { locationService } from './location.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const locationController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query as unknown as LocationSearchQuery;
    const candidates: LocationCandidate[] = await locationService.search(query);
    ok(req, res, { candidates }, 200);
  }),

  resolve: asyncHandler(async (req: Request, res: Response) => {
    const location = await locationService.resolveByPlaceId(req.params.placeId as string);
    ok(req, res, location, 200);
  }),
};
