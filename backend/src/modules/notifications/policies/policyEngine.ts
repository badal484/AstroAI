import { DateTime } from 'luxon';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@astroai/shared-types';
import type { IUserPreferenceDoc } from '../models/userPreference.model';
import { notificationLogRepository } from '../repositories/notificationLog.repository';

export interface PolicyEvaluationResult {
  action: 'SEND' | 'DEFER' | 'SUPPRESS';
  status: NotificationDeliveryStatus;
  reason?: string;
  deferUntil?: Date;
}

export const policyEngine = {
  /**
   * Evaluates all anti-spam and user preference constraints.
   */
  async evaluate(options: {
    preference: IUserPreferenceDoc;
    category: NotificationCategory;
    channel: NotificationChannel;
    deduplicationKey?: string;
    deduplicationWindowMs?: number;
    forceSend?: boolean; // For critical transactional notifications
  }): Promise<PolicyEvaluationResult> {
    const { preference, category, channel, deduplicationKey, deduplicationWindowMs, forceSend } =
      options;

    // 1. Global Opt-Out Check
    if (preference.optedOut) {
      return {
        action: 'SUPPRESS',
        status: NotificationDeliveryStatus.SUPPRESSED_OPT_OUT,
        reason: 'User has globally opted out of notifications',
      };
    }

    // 2. Channel Preference Check
    const channelEnabled = preference.channels[channel as keyof typeof preference.channels];
    if (channelEnabled === false) {
      return {
        action: 'SUPPRESS',
        status: NotificationDeliveryStatus.SUPPRESSED_OPT_OUT,
        reason: `User disabled channel: ${channel}`,
      };
    }

    // 3. Category Preference Check (Transactional cannot be disabled unless global opt-out)
    if (category !== NotificationCategory.TRANSACTIONAL) {
      const categoryEnabled = preference.categories[category as keyof typeof preference.categories];
      if (categoryEnabled === false) {
        return {
          action: 'SUPPRESS',
          status: NotificationDeliveryStatus.SUPPRESSED_OPT_OUT,
          reason: `User disabled category: ${category}`,
        };
      }
    }

    // 4. Deduplication Check
    if (deduplicationKey) {
      const isDuplicate = await notificationLogRepository.checkDuplicate(
        deduplicationKey,
        deduplicationWindowMs || 86400000,
      );
      if (isDuplicate) {
        return {
          action: 'SUPPRESS',
          status: NotificationDeliveryStatus.SUPPRESSED_DUPLICATE,
          reason: `Duplicate notification suppressed for key: ${deduplicationKey}`,
        };
      }
    }

    // 5. Frequency Capping Check (applied to MARKETING notifications)
    if (category === NotificationCategory.MARKETING) {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [countDay, countWeek] = await Promise.all([
        notificationLogRepository.countMarketingSince(preference.userId, oneDayAgo),
        notificationLogRepository.countMarketingSince(preference.userId, oneWeekAgo),
      ]);

      const maxPerDay = preference.frequencyCap?.maxMarketingPerDay ?? 1;
      const maxPerWeek = preference.frequencyCap?.maxMarketingPerWeek ?? 3;

      if (countDay >= maxPerDay || countWeek >= maxPerWeek) {
        return {
          action: 'SUPPRESS',
          status: NotificationDeliveryStatus.SUPPRESSED_FREQUENCY_CAP,
          reason: `Marketing frequency cap exceeded (day: ${countDay}/${maxPerDay}, week: ${countWeek}/${maxPerWeek})`,
        };
      }
    }

    // 6. Quiet Hours Check (Non-transactional notifications are deferred during quiet hours)
    if (category !== NotificationCategory.TRANSACTIONAL && !forceSend) {
      const quietHours = preference.quietHours;
      if (quietHours?.enabled) {
        const tz = preference.timezone || 'UTC';
        const userTime = DateTime.now().setZone(tz);
        const validUserTime = userTime.isValid ? userTime : DateTime.now().setZone('UTC');

        const currentMinutes = validUserTime.hour * 60 + validUserTime.minute;
        const startMinutes = quietHours.startHour * 60 + quietHours.startMinute;
        const endMinutes = quietHours.endHour * 60 + quietHours.endMinute;

        let inQuietHours = false;
        let deferUntilTime: DateTime;

        if (startMinutes > endMinutes) {
          // Overnight quiet hours (e.g. 22:00 to 08:00)
          inQuietHours = currentMinutes >= startMinutes || currentMinutes < endMinutes;
          if (inQuietHours) {
            if (currentMinutes >= startMinutes) {
              // Later tonight: quiet hours end tomorrow at endHour:endMinute
              deferUntilTime = validUserTime
                .plus({ days: 1 })
                .set({ hour: quietHours.endHour, minute: quietHours.endMinute, second: 0, millisecond: 0 });
            } else {
              // Early morning: quiet hours end today at endHour:endMinute
              deferUntilTime = validUserTime.set({
                hour: quietHours.endHour,
                minute: quietHours.endMinute,
                second: 0,
                millisecond: 0,
              });
            }
          }
        } else {
          // Same day quiet hours (e.g. 13:00 to 15:00)
          inQuietHours = currentMinutes >= startMinutes && currentMinutes < endMinutes;
          if (inQuietHours) {
            deferUntilTime = validUserTime.set({
              hour: quietHours.endHour,
              minute: quietHours.endMinute,
              second: 0,
              millisecond: 0,
            });
          }
        }

        if (inQuietHours) {
          return {
            action: 'DEFER',
            status: NotificationDeliveryStatus.DEFERRED_QUIET_HOURS,
            reason: `Deferred due to user quiet hours (${quietHours.startHour}:${String(quietHours.startMinute).padStart(2, '0')} - ${quietHours.endHour}:${String(quietHours.endMinute).padStart(2, '0')} in ${tz})`,
            deferUntil: deferUntilTime!.toJSDate(),
          };
        }
      }
    }

    return {
      action: 'SEND',
      status: NotificationDeliveryStatus.QUEUED,
    };
  },
};
