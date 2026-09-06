import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const walletBalanceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    heldBalance: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, default: 'CREDITS' },
    lifetimeEarned: { type: Number, default: 0, min: 0 },
    lifetimeSpent: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type WalletBalanceSchemaType = InferSchemaType<typeof walletBalanceSchema>;
export type WalletBalanceDocument = HydratedDocument<WalletBalanceSchemaType>;

export const WalletBalanceModel = model('WalletBalance', walletBalanceSchema);
