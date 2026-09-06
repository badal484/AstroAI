import {
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionRules,
  PromotionStatus,
  PromotionTarget,
  PromotionType,
} from '@astroai/shared-types';
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface PromotionDocument extends Document {
  code: string;
  name: string;
  description: string;
  type: PromotionType;
  discountType: PromotionDiscountType;
  discountValue: number;
  target: PromotionTarget;
  targetIds: string[];
  audienceSegment: PromotionAudienceSegment;
  rules: PromotionRules;
  stats: {
    impressions: number;
    redemptions: number;
    revenueGenerated: number;
    discountCost: number;
  };
  status: PromotionStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionRulesSchema = new Schema<PromotionRules>(
  {
    minPurchaseAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    totalUsageLimit: { type: Number, default: null },
    perUserLimit: { type: Number, default: 1, min: 1 },
    newUserOnly: { type: Boolean, default: false },
    existingUserOnly: { type: Boolean, default: false },
  },
  { _id: false },
);

const PromotionSchema = new Schema<PromotionDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: Object.values(PromotionType),
      required: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: Object.values(PromotionDiscountType),
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0.01 },
    target: {
      type: String,
      enum: Object.values(PromotionTarget),
      default: PromotionTarget.ALL,
    },
    targetIds: { type: [String], default: [] },
    audienceSegment: {
      type: String,
      enum: Object.values(PromotionAudienceSegment),
      default: PromotionAudienceSegment.ALL_USERS,
      index: true,
    },
    rules: { type: PromotionRulesSchema, default: () => ({}) },
    stats: {
      impressions: { type: Number, default: 0 },
      redemptions: { type: Number, default: 0 },
      revenueGenerated: { type: Number, default: 0 },
      discountCost: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: Object.values(PromotionStatus),
      default: PromotionStatus.ACTIVE,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'promotions',
  },
);

export const PromotionModel: Model<PromotionDocument> =
  mongoose.models.Promotion ||
  mongoose.model<PromotionDocument>('Promotion', PromotionSchema);
