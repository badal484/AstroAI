import type { Request, Response, NextFunction } from 'express';
import { analyticsTimeRangeQuerySchema } from '@astroai/shared-types';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  async getProductAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const query = analyticsTimeRangeQuerySchema.parse(req.query);
      const data = await analyticsService.getProductAnalytics(query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getFinancialAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const query = analyticsTimeRangeQuerySchema.parse(req.query);
      const data = await analyticsService.getFinancialAnalytics(query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getAITechnicalAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const query = analyticsTimeRangeQuerySchema.parse(req.query);
      const data = await analyticsService.getAITechnicalAnalytics(query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getPaginatedEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;
      const offset = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;

      const data = await analyticsService.getPaginatedEvents({ category, limit, offset });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
