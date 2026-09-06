import { Router } from 'express';
import {
  AdminPermission,
  endVoiceSessionSchema,
  startVoiceSessionSchema,
  voiceHeartbeatSchema,
  voiceTurnInputSchema,
} from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { voiceController } from './voice.controller';

/**
 * Protected User Voice Router mounted at /api/v1/voice
 */
export const voiceRouter = Router();
voiceRouter.use('/voice', authenticate);

voiceRouter.post(
  '/voice/sessions',
  validateBody(startVoiceSessionSchema),
  voiceController.startSession,
);

voiceRouter.post(
  '/voice/sessions/:id/turn',
  validateBody(voiceTurnInputSchema),
  voiceController.processTurn,
);

voiceRouter.post(
  '/voice/sessions/:id/heartbeat',
  validateBody(voiceHeartbeatSchema),
  voiceController.heartbeat,
);

voiceRouter.post(
  '/voice/sessions/:id/end',
  validateBody(endVoiceSessionSchema),
  voiceController.endSession,
);

voiceRouter.get('/voice/sessions', voiceController.getUserSessions);
voiceRouter.get('/voice/sessions/:id', voiceController.getSessionDetails);

/**
 * Admin Voice Router mounted at /api/v1/admin/voice
 */
export const adminVoiceRouter = Router();
adminVoiceRouter.use('/voice', authenticateAdmin);

adminVoiceRouter.get(
  '/voice/sessions',
  requirePermission(AdminPermission.VOICE_READ),
  voiceController.adminListSessions,
);

adminVoiceRouter.get(
  '/voice/sessions/:id',
  requirePermission(AdminPermission.VOICE_READ),
  voiceController.adminGetSessionDetails,
);

adminVoiceRouter.get(
  '/voice/config',
  requirePermission(AdminPermission.VOICE_READ),
  voiceController.adminGetConfig,
);

adminVoiceRouter.post(
  '/voice/config',
  requirePermission(AdminPermission.VOICE_MANAGE),
  voiceController.adminUpdateConfig,
);
