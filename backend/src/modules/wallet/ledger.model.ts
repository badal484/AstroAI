import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  WalletTransactionSource,
  WalletTransactionStatus,
  WalletTransactionType,
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

const walletTransactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    idempotencyKey: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(WalletTransactionType),
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'CREDITS' },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    source: {
      type: String,
      enum: Object.values(WalletTransactionSource),
      required: true,
      index: true,
    },
    referenceId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: Object.values(WalletTransactionStatus),
      default: WalletTransactionStatus.COMPLETED,
    },
    pricingSnapshot: { type: pricingSnapshotSchema, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only ledger
  },
);

// Compound unique index for idempotency: one unique idempotencyKey per user
walletTransactionSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
walletTransactionSchema.index({ userId: 1, createdAt: -1 });

export type WalletTransactionSchemaType = InferSchemaType<typeof walletTransactionSchema>;
export type WalletTransactionDocument = HydratedDocument<WalletTransactionSchemaType>;

export const WalletTransactionModel = model('WalletTransaction', walletTransactionSchema);
