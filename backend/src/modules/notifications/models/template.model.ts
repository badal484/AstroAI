import mongoose, { Document, Schema } from 'mongoose';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationEventType,
  type NotificationTemplateDTO,
  type TemplateLocaleContent,
} from '@astroai/shared-types';

export interface ITemplateDoc extends Document {
  _id: mongoose.Types.ObjectId;
  templateCode: string;
  name: string;
  description?: string;
  eventType: NotificationEventType;
  category: NotificationCategory;
  channels: NotificationChannel[];
  locales: Record<string, TemplateLocaleContent>;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  toDTO(): NotificationTemplateDTO;
}

const TemplateSchema = new Schema<ITemplateDoc>(
  {
    templateCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    eventType: {
      type: String,
      enum: Object.values(NotificationEventType),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      required: true,
      index: true,
    },
    channels: [{ type: String, enum: Object.values(NotificationChannel) }],
    locales: { type: Schema.Types.Mixed, required: true },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

TemplateSchema.methods.toDTO = function (): NotificationTemplateDTO {
  const doc = this as ITemplateDoc;
  return {
    id: doc._id.toString(),
    templateCode: doc.templateCode,
    name: doc.name,
    description: doc.description,
    eventType: doc.eventType,
    category: doc.category,
    channels: doc.channels,
    locales: doc.locales || {},
    variables: doc.variables || [],
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const NotificationTemplateModel = mongoose.model<ITemplateDoc>(
  'NotificationTemplate',
  TemplateSchema,
);
