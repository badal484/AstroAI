import { ReferralStatus } from '@astroai/shared-types';
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ReferralDocument extends Document {
  referrerId: string;
  referrerCode: string;
  refereeId: string;
  refereeName?: string;
  refereeEmail?: string;
  status: ReferralStatus;
  referrerRewardCredits: number;
  refereeRewardCredits: number;
  qualifyingOrderId?: string;
  abuseSignals: string[];
  rewardedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<ReferralDocument>(
  {
    referrerId: { type: String, required: true, index: true },
    referrerCode: { type: String, required: true, uppercase: true, index: true },
    refereeId: { type: String, required: true, unique: true, index: true },
    refereeName: { type: String, default: null },
    refereeEmail: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      default: ReferralStatus.PENDING,
      index: true,
    },
    referrerRewardCredits: { type: Number, default: 25 },
    refereeRewardCredits: { type: Number, default: 25 },
    qualifyingOrderId: { type: String, default: null },
    abuseSignals: { type: [String], default: [] },
    rewardedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'referrals',
  },
);

ReferralSchema.index({ referrerId: 1, refereeId: 1 }, { unique: true });

export const ReferralModel: Model<ReferralDocument> =
  mongoose.models.Referral ||
  mongoose.model<ReferralDocument>('Referral', ReferralSchema);
