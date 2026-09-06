import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { PaymentTransactionStatus } from '@astroai/shared-types';

const paymentTransactionSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    gatewayPaymentId: { type: String, required: true, unique: true },
    gatewayOrderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR', required: true },
    method: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(PaymentTransactionStatus),
      default: PaymentTransactionStatus.CAPTURED,
      required: true,
      index: true,
    },
    errorCode: { type: String, default: null },
    errorDescription: { type: String, default: null },
    signatureVerified: { type: Boolean, default: false },
    rawResponse: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

export type PaymentTransactionSchemaType = InferSchemaType<typeof paymentTransactionSchema>;
export type PaymentTransactionDocument = HydratedDocument<PaymentTransactionSchemaType>;

export const PaymentTransactionModel = model('PaymentTransaction', paymentTransactionSchema);
