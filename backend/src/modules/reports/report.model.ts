import mongoose, { Document, Schema } from 'mongoose';
import {
  ReportFailureStage,
  ReportStatus,
  ReportType,
  type AshtakootaScoreDTO,
  type PricingSnapshot,
  type ReportSectionDTO,
} from '@astroai/shared-types';

export interface IReportDoc extends Document<string> {
  _id: string;
  userId: string;
  reportType: ReportType;
  primaryBirthProfileId: string;
  partnerBirthProfileId: string | null;
  status: ReportStatus;
  creditsCharged: number;
  pricingSnapshot: PricingSnapshot;
  astrologyData: Record<string, any>;
  compatibilityScore: AshtakootaScoreDTO | null;
  sections: ReportSectionDTO[];
  pdfUrl: string | null;
  pdfStorageKey: string | null;
  retryCount: number;
  failureStage: ReportFailureStage | null;
  failureReason: string | null;
  idempotencyKey: string;
  language: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    bulletPoints: { type: [String], default: [] },
  },
  { _id: false },
);

const ReportSchema = new Schema<IReportDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    reportType: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
      index: true,
    },
    primaryBirthProfileId: { type: String, required: true },
    partnerBirthProfileId: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.QUEUED,
      index: true,
    },
    creditsCharged: { type: Number, required: true },
    pricingSnapshot: {
      pricingVersion: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      discountPercent: { type: Number, default: 0 },
      netAmount: { type: Number, required: true },
      currency: { type: String, default: 'CREDITS' },
    },
    astrologyData: { type: Schema.Types.Mixed, default: {} },
    compatibilityScore: { type: Schema.Types.Mixed, default: null },
    sections: { type: [ReportSectionSchema], default: [] },
    pdfUrl: { type: String, default: null },
    pdfStorageKey: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    failureStage: {
      type: String,
      enum: Object.values(ReportFailureStage),
      default: null,
    },
    failureReason: { type: String, default: null },
    idempotencyKey: { type: String, required: true },
    language: { type: String, default: 'en' },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    _id: false,
  },
);

ReportSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
ReportSchema.index({ status: 1, createdAt: 1 });

export const ReportModel =
  (mongoose.models.Report as mongoose.Model<IReportDoc>) ||
  mongoose.model<IReportDoc>('Report', ReportSchema);
