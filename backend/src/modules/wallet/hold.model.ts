import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { WalletHoldStatus, WalletTransactionSource } from '@astroai/shared-types';

const walletHoldSchema = new Schema(
  {
    holdId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    referenceId: { type: String, default: null },
    source: {
      type: String,
      enum: Object.values(WalletTransactionSource),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(WalletHoldStatus),
      default: WalletHoldStatus.ACTIVE,
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export type WalletHoldSchemaType = InferSchemaType<typeof walletHoldSchema>;
export type WalletHoldDocument = HydratedDocument<WalletHoldSchemaType>;

export const WalletHoldModel = model('WalletHold', walletHoldSchema);
