import { UserPreferenceModel, type IUserPreferenceDoc } from '../models/userPreference.model';
import type { UpdateNotificationPreferenceInput } from '@astroai/shared-types';

export const userPreferenceRepository = {
  async getOrCreate(userId: string): Promise<IUserPreferenceDoc> {
    let pref = await UserPreferenceModel.findOne({ userId });
    if (!pref) {
      pref = await UserPreferenceModel.create({
        userId,
        channels: { push: true, email: true, sms: false, inApp: true },
        categories: {
          transactional: true,
          horoscope: true,
          consultation: true,
          marketing: true,
          lifecycle: true,
        },
        language: 'en',
        timezone: 'UTC',
        quietHours: {
          enabled: true,
          startHour: 22,
          startMinute: 0,
          endHour: 8,
          endMinute: 0,
        },
        frequencyCap: {
          maxMarketingPerDay: 1,
          maxMarketingPerWeek: 3,
        },
        optedOut: false,
        pushTokens: [],
      });
    }
    return pref;
  },

  async update(
    userId: string,
    updates: UpdateNotificationPreferenceInput,
  ): Promise<IUserPreferenceDoc> {
    const pref = await this.getOrCreate(userId);

    if (updates.channels) {
      pref.channels = { ...pref.channels, ...updates.channels };
    }
    if (updates.categories) {
      pref.categories = { ...pref.categories, ...updates.categories };
    }
    if (updates.language !== undefined) {
      pref.language = updates.language;
    }
    if (updates.timezone !== undefined) {
      pref.timezone = updates.timezone;
    }
    if (updates.quietHours) {
      pref.quietHours = { ...pref.quietHours, ...updates.quietHours };
    }
    if (updates.frequencyCap) {
      pref.frequencyCap = { ...pref.frequencyCap, ...updates.frequencyCap };
    }
    if (updates.optedOut !== undefined) {
      pref.optedOut = updates.optedOut;
    }

    return pref.save();
  },

  async addPushToken(
    userId: string,
    token: string,
    deviceType: 'ios' | 'android' | 'web',
  ): Promise<IUserPreferenceDoc> {
    const pref = await this.getOrCreate(userId);
    // Remove if already exists to update deviceType and timestamp
    pref.pushTokens = pref.pushTokens.filter((t) => t.token !== token);
    pref.pushTokens.push({ token, deviceType, updatedAt: new Date() });
    return pref.save();
  },

  async removePushToken(userId: string, token: string): Promise<IUserPreferenceDoc> {
    const pref = await this.getOrCreate(userId);
    pref.pushTokens = pref.pushTokens.filter((t) => t.token !== token);
    return pref.save();
  },
};
