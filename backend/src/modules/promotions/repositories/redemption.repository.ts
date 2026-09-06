import { RedemptionDTO } from '@astroai/shared-types';
import { ClientSession } from 'mongoose';
import { RedemptionDocument, RedemptionModel } from '../models/redemption.model';

function toDTO(doc: RedemptionDocument): RedemptionDTO {
  return {
    id: doc._id.toString(),
    promotionId: doc.promotionId,
    code: doc.code,
    userId: doc.userId,
    orderId: doc.orderId || undefined,
    discountApplied: doc.discountApplied,
    bonusCreditsGranted: doc.bonusCreditsGranted,
    originalAmount: doc.originalAmount,
    finalAmount: doc.finalAmount,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

export class RedemptionRepository {
  async record(
    input: {
      promotionId: string;
      code: string;
      userId: string;
      orderId?: string;
      discountApplied: number;
      bonusCreditsGranted: number;
      originalAmount: number;
      finalAmount: number;
      idempotencyKey?: string;
    },
    session?: ClientSession,
  ): Promise<RedemptionDTO> {
    const docs = await RedemptionModel.create([input], session ? { session } : {});
    return toDTO(docs[0]!);
  }

  async countUserRedemptions(promotionId: string, userId: string): Promise<number> {
    return RedemptionModel.countDocuments({ promotionId, userId }).exec();
  }

  async countTotalRedemptions(promotionId: string): Promise<number> {
    return RedemptionModel.countDocuments({ promotionId }).exec();
  }

  async findByOrder(orderId: string): Promise<RedemptionDTO | null> {
    const doc = await RedemptionModel.findOne({ orderId }).exec();
    return doc ? toDTO(doc) : null;
  }

  async listByUser(userId: string): Promise<RedemptionDTO[]> {
    const docs = await RedemptionModel.find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toDTO);
  }
}

export const redemptionRepository = new RedemptionRepository();
