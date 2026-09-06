import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@astroai/shared-types';
import { policyEngine } from '../../../src/modules/notifications/policies/policyEngine';
import { notificationLogRepository } from '../../../src/modules/notifications/repositories/notificationLog.repository';

vi.mock('../../../src/modules/notifications/repositories/notificationLog.repository', () => ({
  notificationLogRepository: {
    countMarketingSince: vi.fn(),
    checkDuplicate: vi.fn(),
  },
}));

const mockCountMarketing = vi.mocked(notificationLogRepository.countMarketingSince);
const mockCheckDuplicate = vi.mocked(notificationLogRepository.checkDuplicate);

describe('Policy Engine (Anti-Spam & User Preferences)', () => {
  const basePreference: any = {
    userId: 'user_1',
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
      enabled: false,
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
    pushTokens: [{ token: 'tok_1', deviceType: 'android', updatedAt: new Date() }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckDuplicate.mockResolvedValue(false);
    mockCountMarketing.mockResolvedValue(0);
  });

  it('allows notification when user preferences and policy checks pass', async () => {
    const res = await policyEngine.evaluate({
      preference: basePreference,
      category: NotificationCategory.TRANSACTIONAL,
      channel: NotificationChannel.PUSH,
    });

    expect(res.action).toBe('SEND');
    expect(res.status).toBe(NotificationDeliveryStatus.QUEUED);
  });

  it('suppresses notification when user has globally opted out', async () => {
    const res = await policyEngine.evaluate({
      preference: { ...basePreference, optedOut: true },
      category: NotificationCategory.TRANSACTIONAL,
      channel: NotificationChannel.PUSH,
    });

    expect(res.action).toBe('SUPPRESS');
    expect(res.status).toBe(NotificationDeliveryStatus.SUPPRESSED_OPT_OUT);
  });

  it('suppresses notification when user disabled specific channel', async () => {
    const res = await policyEngine.evaluate({
      preference: {
        ...basePreference,
        channels: { ...basePreference.channels, email: false },
      },
      category: NotificationCategory.LIFECYCLE,
      channel: NotificationChannel.EMAIL,
    });

    expect(res.action).toBe('SUPPRESS');
    expect(res.status).toBe(NotificationDeliveryStatus.SUPPRESSED_OPT_OUT);
  });

  it('suppresses notification when user disabled specific category', async () => {
    const res = await policyEngine.evaluate({
      preference: {
        ...basePreference,
        categories: { ...basePreference.categories, horoscope: false },
      },
      category: NotificationCategory.HOROSCOPE,
      channel: NotificationChannel.PUSH,
    });

    expect(res.action).toBe('SUPPRESS');
    expect(res.status).toBe(NotificationDeliveryStatus.SUPPRESSED_OPT_OUT);
  });

  it('suppresses duplicate notifications with matching deduplication key within window', async () => {
    mockCheckDuplicate.mockResolvedValue(true);

    const res = await policyEngine.evaluate({
      preference: basePreference,
      category: NotificationCategory.MARKETING,
      channel: NotificationChannel.PUSH,
      deduplicationKey: 'inactivity:user_1:2026_w36',
    });

    expect(res.action).toBe('SUPPRESS');
    expect(res.status).toBe(NotificationDeliveryStatus.SUPPRESSED_DUPLICATE);
  });

  it('suppresses marketing notifications when daily frequency cap is reached', async () => {
    mockCountMarketing.mockImplementation(async (_userId, sinceDate) => {
      const isDaily = Date.now() - sinceDate.getTime() < 2 * 86400000;
      return isDaily ? 1 : 1; // 1 sent today >= maxMarketingPerDay (1)
    });

    const res = await policyEngine.evaluate({
      preference: basePreference,
      category: NotificationCategory.MARKETING,
      channel: NotificationChannel.PUSH,
    });

    expect(res.action).toBe('SUPPRESS');
    expect(res.status).toBe(NotificationDeliveryStatus.SUPPRESSED_FREQUENCY_CAP);
  });

  it('defers non-transactional notifications during active quiet hours', async () => {
    // Enabled quiet hours 00:00 to 23:59 (covers all hours of day)
    const prefWithQuietHours = {
      ...basePreference,
      timezone: 'UTC',
      quietHours: {
        enabled: true,
        startHour: 0,
        startMinute: 0,
        endHour: 23,
        endMinute: 59,
      },
    };

    const res = await policyEngine.evaluate({
      preference: prefWithQuietHours,
      category: NotificationCategory.MARKETING,
      channel: NotificationChannel.PUSH,
    });

    expect(res.action).toBe('DEFER');
    expect(res.status).toBe(NotificationDeliveryStatus.DEFERRED_QUIET_HOURS);
    expect(res.deferUntil).toBeInstanceOf(Date);
  });

  it('bypasses quiet hours for critical transactional notifications', async () => {
    const prefWithQuietHours = {
      ...basePreference,
      quietHours: {
        enabled: true,
        startHour: 0,
        startMinute: 0,
        endHour: 23,
        endMinute: 59,
      },
    };

    const res = await policyEngine.evaluate({
      preference: prefWithQuietHours,
      category: NotificationCategory.TRANSACTIONAL,
      channel: NotificationChannel.EMAIL,
      forceSend: true,
    });

    expect(res.action).toBe('SEND');
    expect(res.status).toBe(NotificationDeliveryStatus.QUEUED);
  });
});
