import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  VoiceAudioFormat,
  VoiceEndReason,
  VoiceSessionStatus,
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

const voiceTurnSchema = new Schema(
  {
    turnIndex: { type: Number, required: true },
    userTranscription: { type: String, required: true },
    assistantText: { type: String, required: true },
    audioUrl: { type: String, default: null },
    audioFormat: {
      type: String,
      enum: Object.values(VoiceAudioFormat),
      default: VoiceAudioFormat.MP3,
    },
    latencyMs: {
      sttMs: { type: Number, default: 0 },
      llmMs: { type: Number, default: 0 },
      ttsMs: { type: Number, default: 0 },
      totalMs: { type: Number, default: 0 },
    },
    durationSeconds: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const voiceSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    astrologerId: { type: String, required: true, index: true },
    birthProfileId: { type: String, default: null },
    language: { type: String, default: 'en' },
    status: {
      type: String,
      enum: Object.values(VoiceSessionStatus),
      default: VoiceSessionStatus.INITIATING,
      required: true,
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    lastHeartbeatAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    billableSeconds: { type: Number, default: 0 },
    creditsCharged: { type: Number, default: 0 },
    pricingSnapshot: { type: pricingSnapshotSchema, required: true },
    holdId: { type: String, default: null, index: true },
    idempotencyKey: { type: String, required: true },
    endReason: {
      type: String,
      enum: Object.values(VoiceEndReason),
      default: null,
    },
    failureReason: { type: String, default: null },
    turns: { type: [voiceTurnSchema], default: [] },
  },
  {
    timestamps: true,
  },
);

voiceSessionSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
voiceSessionSchema.index({ userId: 1, createdAt: -1 });
voiceSessionSchema.index({ status: 1, createdAt: -1 });

export type VoiceSessionSchemaType = InferSchemaType<typeof voiceSessionSchema>;
export type VoiceSessionDocument = HydratedDocument<VoiceSessionSchemaType>;

export const VoiceSessionModel = model('VoiceSession', voiceSessionSchema);
