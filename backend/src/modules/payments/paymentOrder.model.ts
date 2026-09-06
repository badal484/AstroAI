import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  PaymentGateway,
  PaymentOrderStatus,
} from '@astroai/shared-types';

const pricingSnapshotSchema = new Schema(
  {
    pricingVersion: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    unitsCalculated: { type: Number },
    billingUnit: { type: String },
    discountAppliedPercent: { type: Number },
    grossAmount: { type: Number },
    netAmount: { type: Number, required: true },
  },
  { _id: false },
);

const paymentOrderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    packId: { type: String, required: true },
    gateway: {
      type: String,
      enum: Object.values(PaymentGateway),
      default: PaymentGateway.RAZORPAY,
      required: true,
    },
    gatewayOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR', required: true },
    credits: { type: Number, required: true, min: 1 },
    bonusCredits: { type: Number, default: 0, min: 0 },
    totalCredits: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(PaymentOrderStatus),
      default: PaymentOrderStatus.CREATED,
      required: true,
      index: true,
    },
    idempotencyKey: { type: String, required: true },
    pricingSnapshot: { type: pricingSnapshotSchema, required: true },
    refundedAmount: { type: Number, default: 0, min: 0 },
    paidAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

paymentOrderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
paymentOrderSchema.index({ status: 1, createdAt: -1 });

export type PaymentOrderSchemaType = InferSchemaType<typeof paymentOrderSchema>;
export type PaymentOrderDocument = HydratedDocument<PaymentOrderSchemaType>;

export const PaymentOrderModel = model('PaymentOrder', paymentOrderSchema);
