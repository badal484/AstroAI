import { Router } from 'express';
import { bookPujaSchema } from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { pujaController } from './puja.controller';

export const pujaRouter = Router();

// Public catalog viewing
pujaRouter.get('/catalog', pujaController.getCatalog);
pujaRouter.get('/catalog/:id', pujaController.getPujaById);

// Authenticated user operations
pujaRouter.post(
  '/book',
  authenticate,
  validateBody(bookPujaSchema),
  pujaController.bookPuja,
);

pujaRouter.get('/my-orders', authenticate, pujaController.getMyOrders);
pujaRouter.get('/orders/:id', authenticate, pujaController.getOrderById);
