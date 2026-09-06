import {
  claimReferralCodeSchema,
  validatePromoCodeSchema,
} from '@astroai/shared-types';
import { NextFunction, Request, Response } from 'express';
import { promotionsService } from './promotions.service';
import { referralService } from './referral.service';

export class PromotionsController {
  async validatePromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = validatePromoCodeSchema.parse(req.body);
      const result = await promotionsService.validatePromoCode(req.user!.id, parsed);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAvailableOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offers = await promotionsService.getAvailableOffers(req.user!.id);
      res.status(200).json({ success: true, data: offers });
    } catch (err) {
      next(err);
    }
  }

  async getUserReferralSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await referralService.getUserReferralSummary(req.user!.id);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  async claimReferralCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = claimReferralCodeSchema.parse(req.body);
      const user = req.user as any;
      const referral = await referralService.claimReferralCode({
        refereeId: req.user!.id,
        referralCode: parsed.referralCode,
        refereeName: user?.name || undefined,
        refereeEmail: user?.email || undefined,
        deviceId: parsed.deviceId,
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }
}

export const promotionsController = new PromotionsController();
