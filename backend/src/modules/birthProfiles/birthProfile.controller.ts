import type { Request, Response } from 'express';
import type {
  ApiSuccessResponse,
  BirthProfile,
  CreateBirthProfileInput,
  UpdateBirthProfileInput,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { birthProfileService } from './birthProfile.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const birthProfileController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateBirthProfileInput;
    const profile: BirthProfile = await birthProfileService.create(req.user!.id, input);
    ok(req, res, profile, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const profiles = await birthProfileService.list(req.user!.id);
    ok(req, res, { items: profiles }, 200);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const profile = await birthProfileService.getById(req.user!.id, req.params.id as string);
    ok(req, res, profile, 200);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as UpdateBirthProfileInput;
    const profile = await birthProfileService.update(req.user!.id, req.params.id as string, input);
    ok(req, res, profile, 200);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await birthProfileService.remove(req.user!.id, req.params.id as string);
    ok(req, res, { success: true }, 200);
  }),
};
