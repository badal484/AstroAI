import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@astroai/shared-types';
import {
  registerPushTokenSchema,
  updateNotificationPreferenceSchema,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { notificationService } from './notification.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const notificationController = {
  getPreferences: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const prefs = await notificationService.getUserPreferences(userId);
    ok(req, res, prefs);
  }),

  updatePreferences: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const validated = updateNotificationPreferenceSchema.parse(req.body);
    const prefs = await notificationService.updateUserPreferences(userId, validated);
    ok(req, res, prefs);
  }),

  registerPushToken: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const validated = registerPushTokenSchema.parse(req.body);
    const prefs = await notificationService.registerPushToken(userId, validated);
    ok(req, res, prefs);
  }),

  getInbox: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    const result = await notificationService.listUserNotifications(userId, { limit, cursor });
    ok(req, res, result);
  }),
};
