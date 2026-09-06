import {
  createPromotionSchema,
  PromotionStatus,
  updatePromotionSchema,
} from '@astroai/shared-types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { promotionsService } from './promotions.service';
import { referralService } from './referral.service';

const listQuerySchema = z.object({
  status: z.nativeEnum(PromotionStatus).optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const statusUpdateSchema = z.object({
  status: z.nativeEnum(PromotionStatus),
});

export class AdminPromotionsController {
  async listPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listQuerySchema.parse(req.query);
      const result = await promotionsService.listPromotions(query);
      res.status(200).json({ success: true, data: result.items, total: result.total });
    } catch (err) {
      next(err);
    }
  }

  async createPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createPromotionSchema.parse(req.body);
      const created = await promotionsService.createPromotion(parsed);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  async getPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promo = await promotionsService.getPromotionById(req.params.id as string);
      res.status(200).json({ success: true, data: promo });
    } catch (err) {
      next(err);
    }
  }

  async updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updatePromotionSchema.parse(req.body);
      const updated = await promotionsService.updatePromotion(req.params.id as string, parsed);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = statusUpdateSchema.parse(req.body);
      const updated = await promotionsService.setPromotionStatus(req.params.id as string, parsed.status);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await promotionsService.getAnalytics();
      res.status(200).json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }

  async listReferrals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const referrals = await referralService.listAllReferrals(100);
      res.status(200).json({ success: true, data: referrals });
    } catch (err) {
      next(err);
    }
  }
}

export const adminPromotionsController = new AdminPromotionsController();
