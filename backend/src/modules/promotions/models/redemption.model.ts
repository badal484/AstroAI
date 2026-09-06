import mongoose, { Document, Model, Schema } from 'mongoose';

export interface RedemptionDocument extends Document {
  promotionId: string;
  code: string;
  userId: string;
  orderId?: string;
  discountApplied: number;
  bonusCreditsGranted: number;
  originalAmount: number;
  finalAmount: number;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedemptionSchema = new Schema<RedemptionDocument>(
  {
    promotionId: { type: String, required: true, index: true },
    code: { type: String, required: true, uppercase: true, index: true },
    userId: { type: String, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    discountApplied: { type: Number, default: 0 },
    bonusCreditsGranted: { type: Number, default: 0 },
    originalAmount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    idempotencyKey: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'promotions_redemptions',
  },
);

// Prevent duplicate redemption per user and order/idempotencyKey
RedemptionSchema.index({ promotionId: 1, userId: 1, orderId: 1 }, { unique: true, sparse: true });
RedemptionSchema.index({ code: 1, userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const RedemptionModel: Model<RedemptionDocument> =
  mongoose.models.Redemption ||
  mongoose.model<RedemptionDocument>('Redemption', RedemptionSchema);
