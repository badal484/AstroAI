import mongoose, { Document, Schema } from 'mongoose';
import {
  AudienceSegment,
  CampaignStatus,
  NotificationChannel,
  type CampaignStats,
  type NotificationCampaignDTO,
} from '@astroai/shared-types';

export interface ICampaignDoc extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  templateCode: string;
  audienceSegment: AudienceSegment;
  audienceFilters?: {
    zodiacSign?: string;
    inactiveDays?: number;
    maxBalance?: number;
  };
  targetLanguage?: string;
  channels: NotificationChannel[];
  status: CampaignStatus;
  scheduledAt?: Date | null;
  executedAt?: Date | null;
  stats: CampaignStats;
  createdAt: Date;
  updatedAt: Date;
  toDTO(): NotificationCampaignDTO;
}

const CampaignSchema = new Schema<ICampaignDoc>(
  {
    name: { type: String, required: true },
    description: { type: String },
    templateCode: { type: String, required: true, index: true },
    audienceSegment: {
      type: String,
      enum: Object.values(AudienceSegment),
      required: true,
      index: true,
    },
    audienceFilters: { type: Schema.Types.Mixed },
    targetLanguage: { type: String },
    channels: [{ type: String, enum: Object.values(NotificationChannel) }],
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.DRAFT,
      index: true,
    },
    scheduledAt: { type: Date, index: true },
    executedAt: { type: Date },
    stats: {
      totalTargeted: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      suppressed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

CampaignSchema.methods.toDTO = function (): NotificationCampaignDTO {
  const doc = this as ICampaignDoc;
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    templateCode: doc.templateCode,
    audienceSegment: doc.audienceSegment,
    audienceFilters: doc.audienceFilters,
    targetLanguage: doc.targetLanguage,
    channels: doc.channels,
    status: doc.status,
    scheduledAt: doc.scheduledAt ? doc.scheduledAt.toISOString() : null,
    executedAt: doc.executedAt ? doc.executedAt.toISOString() : null,
    stats: doc.stats,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const NotificationCampaignModel = mongoose.model<ICampaignDoc>(
  'NotificationCampaign',
  CampaignSchema,
);
