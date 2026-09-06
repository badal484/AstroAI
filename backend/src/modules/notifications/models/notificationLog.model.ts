import mongoose, { Document, Schema } from 'mongoose';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  type NotificationLogDTO,
} from '@astroai/shared-types';

export interface INotificationLogDoc extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  eventType: NotificationEventType;
  templateCode?: string;
  campaignId?: string;
  recipient: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  status: NotificationDeliveryStatus;
  deduplicationKey?: string;
  retryCount: number;
  scheduledFor?: Date | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  failedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toDTO(): NotificationLogDTO;
}

const NotificationLogSchema = new Schema<INotificationLogDoc>(
  {
    userId: { type: String, required: true, index: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: Object.values(NotificationEventType),
      required: true,
      index: true,
    },
    templateCode: { type: String, index: true },
    campaignId: { type: String, index: true },
    recipient: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: Object.values(NotificationDeliveryStatus),
      default: NotificationDeliveryStatus.QUEUED,
      index: true,
    },
    deduplicationKey: { type: String, index: true },
    retryCount: { type: Number, default: 0 },
    scheduledFor: { type: Date, index: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    failedReason: { type: String },
  },
  {
    timestamps: true,
  },
);

// Compound index for deduplication checks
NotificationLogSchema.index({ deduplicationKey: 1, createdAt: -1 });

NotificationLogSchema.methods.toDTO = function (): NotificationLogDTO {
  const doc = this as INotificationLogDoc;
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    channel: doc.channel,
    category: doc.category,
    eventType: doc.eventType,
    templateCode: doc.templateCode,
    campaignId: doc.campaignId,
    recipient: doc.recipient,
    title: doc.title,
    body: doc.body,
    data: doc.data,
    status: doc.status,
    deduplicationKey: doc.deduplicationKey,
    retryCount: doc.retryCount,
    scheduledFor: doc.scheduledFor ? doc.scheduledFor.toISOString() : null,
    sentAt: doc.sentAt ? doc.sentAt.toISOString() : null,
    deliveredAt: doc.deliveredAt ? doc.deliveredAt.toISOString() : null,
    failedReason: doc.failedReason,
    createdAt: doc.createdAt.toISOString(),
  };
};

export const NotificationLogModel = mongoose.model<INotificationLogDoc>(
  'NotificationLog',
  NotificationLogSchema,
);
