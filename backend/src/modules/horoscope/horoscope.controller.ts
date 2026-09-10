import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { dailyDispatchService } from './dailyDispatch.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const horoscopeController = {
  getDailyDispatch: asyncHandler(async (req: Request, res: Response) => {
    const date = req.query.date as string | undefined;
    const dispatch = dailyDispatchService.getDailyDispatch(req.user?.id || 'guest', date);
    ok(req, res, dispatch, 200);
  }),
};
