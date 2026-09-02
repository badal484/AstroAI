import { Router } from 'express';
import { createBirthProfileSchema, updateBirthProfileSchema } from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { birthProfileController } from './birthProfile.controller';

export const birthProfileRouter = Router();

birthProfileRouter.use('/birth-profiles', authenticate);

birthProfileRouter.post(
  '/birth-profiles',
  validateBody(createBirthProfileSchema),
  birthProfileController.create,
);
birthProfileRouter.get('/birth-profiles', birthProfileController.list);
birthProfileRouter.get('/birth-profiles/:id', birthProfileController.getById);
birthProfileRouter.patch(
  '/birth-profiles/:id',
  validateBody(updateBirthProfileSchema),
  birthProfileController.update,
);
birthProfileRouter.delete('/birth-profiles/:id', birthProfileController.remove);
