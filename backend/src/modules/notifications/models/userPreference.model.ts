import mongoose, { Document, Schema } from 'mongoose';
import type {
  FrequencyCapConfig,
  QuietHoursConfig,
  UserNotificationPreferenceDTO,
} from '@astroai/shared-types';

export interface IUserPreferenceDoc extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  categories: {
    transactional: boolean;
    horoscope: boolean;
    consultation: boolean;
    marketing: boolean;
    lifecycle: boolean;
  };
  language: string;
  timezone: string;
  quietHours: QuietHoursConfig;
  frequencyCap: FrequencyCapConfig;
  optedOut: boolean;
  pushTokens: Array<{
    token: string;
    deviceType: 'ios' | 'android' | 'web';
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  toDTO(): UserNotificationPreferenceDTO;
}

const UserPreferenceSchema = new Schema<IUserPreferenceDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    channels: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
    categories: {
      transactional: { type: Boolean, default: true },
      horoscope: { type: Boolean, default: true },
      consultation: { type: Boolean, default: true },
      marketing: { type: Boolean, default: true },
      lifecycle: { type: Boolean, default: true },
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    quietHours: {
      enabled: { type: Boolean, default: true },
      startHour: { type: Number, default: 22 },
      startMinute: { type: Number, default: 0 },
      endHour: { type: Number, default: 8 },
      endMinute: { type: Number, default: 0 },
    },
    frequencyCap: {
      maxMarketingPerDay: { type: Number, default: 1 },
      maxMarketingPerWeek: { type: Number, default: 3 },
    },
    optedOut: { type: Boolean, default: false },
    pushTokens: [
      {
        token: { type: String, required: true },
        deviceType: { type: String, enum: ['ios', 'android', 'web'], default: 'android' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

UserPreferenceSchema.methods.toDTO = function (): UserNotificationPreferenceDTO {
  const doc = this as IUserPreferenceDoc;
  return {
    userId: doc.userId,
    channels: doc.channels,
    categories: doc.categories,
    language: doc.language,
    timezone: doc.timezone,
    quietHours: doc.quietHours,
    frequencyCap: doc.frequencyCap,
    optedOut: doc.optedOut,
    pushTokensCount: doc.pushTokens.length,
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const UserPreferenceModel = mongoose.model<IUserPreferenceDoc>(
  'UserNotificationPreference',
  UserPreferenceSchema,
);
