import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  PujaOrderStatus,
  PujaTier,
} from '@astroai/shared-types';

const deliveryAddressSchema = new Schema(
  {
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    contactPhone: { type: String, required: true },
  },
  { _id: false },
);

const pujaOrderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    pujaId: { type: String, required: true, index: true },
    pujaTitle: { type: String, required: true },
    templeName: { type: String, required: true },
    templeLocation: { type: String, required: true },
    tier: {
      type: String,
      enum: Object.values(PujaTier),
      default: PujaTier.STANDARD,
      required: true,
    },
    amountINR: { type: Number, required: true },
    creditsDeducted: { type: Number, required: true },
    sankalpaName: { type: String, required: true },
    gotra: { type: String, required: true },
    nakshatra: { type: String, required: true },
    prayerIntent: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(PujaOrderStatus),
      default: PujaOrderStatus.CONFIRMED,
      required: true,
      index: true,
    },
    scheduledDate: { type: String, required: true },
    liveStreamUrl: { type: String, default: null },
    prasadTrackingNumber: { type: String, default: null },
    prasadCourier: { type: String, default: null },
    isPrasadDeliveryRequested: { type: Boolean, default: true },
    deliveryAddress: { type: deliveryAddressSchema, default: null },
  },
  {
    timestamps: true,
  },
);

pujaOrderSchema.index({ userId: 1, createdAt: -1 });

export type PujaOrderSchemaType = InferSchemaType<typeof pujaOrderSchema>;
export type PujaOrderDocument = HydratedDocument<PujaOrderSchemaType>;

export const PujaOrderModel = model('PujaOrder', pujaOrderSchema);
