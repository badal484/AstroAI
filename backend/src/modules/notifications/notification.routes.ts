import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware';
import { notificationController } from './notification.controller';

export const notificationRouter = Router();

notificationRouter.get(
  '/preferences',
  authenticate,
  notificationController.getPreferences,
);

notificationRouter.put(
  '/preferences',
  authenticate,
  notificationController.updatePreferences,
);

notificationRouter.post(
  '/push-token',
  authenticate,
  notificationController.registerPushToken,
);

notificationRouter.get(
  '/inbox',
  authenticate,
  notificationController.getInbox,
);
