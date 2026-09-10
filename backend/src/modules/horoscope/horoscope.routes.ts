import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware';
import { horoscopeController } from './horoscope.controller';

export const horoscopeRouter = Router();

horoscopeRouter.use('/horoscope', authenticate);

horoscopeRouter.get('/horoscope/daily-dispatch', horoscopeController.getDailyDispatch);
