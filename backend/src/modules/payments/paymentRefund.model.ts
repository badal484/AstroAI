import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { PaymentRefundStatus } from '@astroai/shared-types';

const paymentRefundSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, index: true },
    gatewayRefundId: { type: String, default: null, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR', required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(PaymentRefundStatus),
      default: PaymentRefundStatus.PROCESSED,
      required: true,
      index: true,
    },
    adminId: { type: String, default: null },
    rawResponse: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

export type PaymentRefundSchemaType = InferSchemaType<typeof paymentRefundSchema>;
export type PaymentRefundDocument = HydratedDocument<PaymentRefundSchemaType>;

export const PaymentRefundModel = model('PaymentRefund', paymentRefundSchema);
