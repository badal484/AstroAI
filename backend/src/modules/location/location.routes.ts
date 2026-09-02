import { Router } from 'express';
import { locationSearchQuerySchema } from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { validateQuery } from '../../middleware/validate.middleware';
import { locationController } from './location.controller';

export const locationRouter = Router();

locationRouter.get(
  '/locations/search',
  authenticate,
  validateQuery(locationSearchQuerySchema),
  locationController.search,
);
locationRouter.get('/locations/:placeId', authenticate, locationController.resolve);
