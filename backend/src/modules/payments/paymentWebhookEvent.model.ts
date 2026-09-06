import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const paymentWebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true, index: true },
    gatewayOrderId: { type: String, default: null, index: true },
    gatewayPaymentId: { type: String, default: null, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: true },
    errorMessage: { type: String, default: null },
    processedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

export type PaymentWebhookEventSchemaType = InferSchemaType<typeof paymentWebhookEventSchema>;
export type PaymentWebhookEventDocument = HydratedDocument<PaymentWebhookEventSchemaType>;

export const PaymentWebhookEventModel = model('PaymentWebhookEvent', paymentWebhookEventSchema);
