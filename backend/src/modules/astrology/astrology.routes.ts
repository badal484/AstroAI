import { Router } from 'express';
import {
  analyzePalmSchema,
  castPrashnaSchema,
  compatibilityRequestSchema,
  dashaTimelineQuerySchema,
  transitsQuerySchema,
} from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { astrologyController } from './astrology.controller';

export const astrologyRouter = Router();

astrologyRouter.use('/astrology', authenticate);

astrologyRouter.get('/astrology/cosmic-radar', astrologyController.getCosmicRadar);
astrologyRouter.get(
  '/astrology/dasha-timeline',
  validateQuery(dashaTimelineQuerySchema),
  astrologyController.getDashaTimeline,
);
astrologyRouter.get('/astrology/chart/:birthProfileId', astrologyController.getChart);
astrologyRouter.get(
  '/astrology/transits/:birthProfileId',
  validateQuery(transitsQuerySchema),
  astrologyController.getTransits,
);
astrologyRouter.post(
  '/astrology/compatibility',
  validateBody(compatibilityRequestSchema),
  astrologyController.getCompatibility,
);
astrologyRouter.post(
  '/astrology/palmistry-analyze',
  validateBody(analyzePalmSchema),
  astrologyController.analyzePalm,
);
astrologyRouter.post(
  '/astrology/prashna-cast',
  validateBody(castPrashnaSchema),
  astrologyController.castPrashna,
);
