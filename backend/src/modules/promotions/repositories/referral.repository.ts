import { ReferralRecordDTO, ReferralStatus } from '@astroai/shared-types';
import { ClientSession } from 'mongoose';
import { ReferralDocument, ReferralModel } from '../models/referral.model';

function toDTO(doc: ReferralDocument): ReferralRecordDTO {
  return {
    id: doc._id.toString(),
    referrerId: doc.referrerId,
    referrerCode: doc.referrerCode,
    refereeId: doc.refereeId,
    refereeName: doc.refereeName || undefined,
    refereeEmail: doc.refereeEmail || undefined,
    status: doc.status,
    referrerRewardCredits: doc.referrerRewardCredits,
    refereeRewardCredits: doc.refereeRewardCredits,
    qualifyingOrderId: doc.qualifyingOrderId || undefined,
    abuseSignals: doc.abuseSignals || [],
    rewardedAt: doc.rewardedAt ? doc.rewardedAt.toISOString() : null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export class ReferralRepository {
  async create(
    input: {
      referrerId: string;
      referrerCode: string;
      refereeId: string;
      refereeName?: string;
      refereeEmail?: string;
      status?: ReferralStatus;
      referrerRewardCredits?: number;
      refereeRewardCredits?: number;
      abuseSignals?: string[];
    },
    session?: ClientSession,
  ): Promise<ReferralRecordDTO> {
    const docs = await ReferralModel.create([input], session ? { session } : {});
    return toDTO(docs[0]!);
  }

  async findByRefereeId(refereeId: string): Promise<ReferralRecordDTO | null> {
    const doc = await ReferralModel.findOne({ refereeId }).exec();
    return doc ? toDTO(doc) : null;
  }

  async listByReferrerId(referrerId: string): Promise<ReferralRecordDTO[]> {
    const docs = await ReferralModel.find({ referrerId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toDTO);
  }

  async updateStatus(
    id: string,
    status: ReferralStatus,
    updates: {
      qualifyingOrderId?: string;
      rewardedAt?: Date;
    } = {},
    session?: ClientSession,
  ): Promise<ReferralRecordDTO | null> {
    const doc = await ReferralModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          ...updates,
        },
      },
      { new: true, session },
    ).exec();
    return doc ? toDTO(doc) : null;
  }

  async listAll(limit = 100): Promise<ReferralRecordDTO[]> {
    const docs = await ReferralModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(toDTO);
  }
}

export const referralRepository = new ReferralRepository();
