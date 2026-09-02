import type { Request, Response } from 'express';
import type { ApiSuccessResponse, PaginationQuery } from '@astroai/shared-types';
import { toAuthUser, userService } from '../users';
import { asyncHandler } from '../../shared/asyncHandler';

function ok<T>(req: Request, res: Response, data: T): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(200).json(body);
}

export const adminUsersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { limit, cursor } = req.query as unknown as PaginationQuery;
    const result = await userService.list({ limit, cursor });
    ok(req, res, { items: result.items.map(toAuthUser), nextCursor: result.nextCursor });
  }),

  suspend: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.suspend(req.params.id as string);
    ok(req, res, toAuthUser(user));
  }),

  reactivate: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.reactivate(req.params.id as string);
    ok(req, res, toAuthUser(user));
  }),
};
