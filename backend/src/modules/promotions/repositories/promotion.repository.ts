import {
  CreatePromotionInput,
  PromotionAudienceSegment,
  PromotionDTO,
  PromotionStatus,
  UpdatePromotionInput,
} from '@astroai/shared-types';
import { ClientSession } from 'mongoose';
import { PromotionDocument, PromotionModel } from '../models/promotion.model';

function toDTO(doc: PromotionDocument): PromotionDTO {
  return {
    id: doc._id.toString(),
    code: doc.code,
    name: doc.name,
    description: doc.description,
    type: doc.type,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    target: doc.target,
    targetIds: doc.targetIds || [],
    audienceSegment: doc.audienceSegment,
    rules: {
      minPurchaseAmount: doc.rules?.minPurchaseAmount ?? 0,
      maxDiscountAmount: doc.rules?.maxDiscountAmount ?? null,
      startDate: doc.rules?.startDate ?? null,
      endDate: doc.rules?.endDate ?? null,
      totalUsageLimit: doc.rules?.totalUsageLimit ?? null,
      perUserLimit: doc.rules?.perUserLimit ?? 1,
      newUserOnly: doc.rules?.newUserOnly ?? false,
      existingUserOnly: doc.rules?.existingUserOnly ?? false,
    },
    stats: {
      impressions: doc.stats?.impressions ?? 0,
      redemptions: doc.stats?.redemptions ?? 0,
      revenueGenerated: doc.stats?.revenueGenerated ?? 0,
      discountCost: doc.stats?.discountCost ?? 0,
    },
    status: doc.status,
    isActive: doc.isActive,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export class PromotionRepository {
  async create(input: CreatePromotionInput): Promise<PromotionDTO> {
    const doc = await PromotionModel.create({
      ...input,
      code: input.code.toUpperCase(),
      status: input.isActive ? PromotionStatus.ACTIVE : PromotionStatus.DRAFT,
    });
    return toDTO(doc);
  }

  async findById(id: string): Promise<PromotionDTO | null> {
    const doc = await PromotionModel.findById(id).exec();
    return doc ? toDTO(doc) : null;
  }

  async findByCode(code: string): Promise<PromotionDTO | null> {
    const doc = await PromotionModel.findOne({ code: code.toUpperCase() }).exec();
    return doc ? toDTO(doc) : null;
  }

  async update(id: string, input: UpdatePromotionInput): Promise<PromotionDTO | null> {
    const doc = await PromotionModel.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true },
    ).exec();
    return doc ? toDTO(doc) : null;
  }

  async list(filters: {
    status?: PromotionStatus;
    isActive?: boolean;
    audienceSegment?: PromotionAudienceSegment;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: PromotionDTO[]; total: number }> {
    const query: Record<string, any> = {};
    if (filters.status) query.status = filters.status;
    if (typeof filters.isActive === 'boolean') query.isActive = filters.isActive;
    if (filters.audienceSegment) query.audienceSegment = filters.audienceSegment;

    const total = await PromotionModel.countDocuments(query).exec();
    const docs = await PromotionModel.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .exec();

    return {
      items: docs.map(toDTO),
      total,
    };
  }

  async listActiveOffers(audienceSegments: PromotionAudienceSegment[]): Promise<PromotionDTO[]> {
    const docs = await PromotionModel.find({
      isActive: true,
      status: PromotionStatus.ACTIVE,
      audienceSegment: { $in: audienceSegments },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    return docs.map(toDTO);
  }

  async incrementStats(
    promotionId: string,
    deltas: {
      impressions?: number;
      redemptions?: number;
      revenueGenerated?: number;
      discountCost?: number;
    },
    session?: ClientSession,
  ): Promise<void> {
    const inc: Record<string, number> = {};
    if (deltas.impressions) inc['stats.impressions'] = deltas.impressions;
    if (deltas.redemptions) inc['stats.redemptions'] = deltas.redemptions;
    if (deltas.revenueGenerated) inc['stats.revenueGenerated'] = deltas.revenueGenerated;
    if (deltas.discountCost) inc['stats.discountCost'] = deltas.discountCost;

    await PromotionModel.findByIdAndUpdate(
      promotionId,
      { $inc: inc },
      session ? { session } : {},
    ).exec();
  }

  async count(): Promise<number> {
    return PromotionModel.countDocuments().exec();
  }
}

export const promotionRepository = new PromotionRepository();
