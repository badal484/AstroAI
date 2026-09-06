import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from '@astroai/shared-types';
import { NotificationCenterScreen } from '../src/screens/notifications/NotificationCenterScreen';
import { NotificationPreferencesScreen } from '../src/screens/notifications/NotificationPreferencesScreen';
import { notificationApi } from '../src/lib/notificationApi';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useFocusEffect: (cb: any) => {
      const react = require('react');
      react.useEffect(() => {
        return cb();
      }, [cb]);
    },
  };
});

jest.mock('../src/lib/notificationApi', () => ({
  notificationApi: {
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    registerPushToken: jest.fn(),
    getInbox: jest.fn(),
  },
}));

const mockGetPreferences = jest.mocked(notificationApi.getPreferences);
const mockUpdatePreferences = jest.mocked(notificationApi.updatePreferences);
const mockGetInbox = jest.mocked(notificationApi.getInbox);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Mobile Notification Screens', () => {
  describe('NotificationPreferencesScreen', () => {
    beforeEach(() => {
      mockGetPreferences.mockResolvedValue({
        userId: 'usr_1',
        channels: { push: true, email: true, sms: false, inApp: true },
        categories: {
          transactional: true,
          horoscope: true,
          consultation: true,
          marketing: true,
          lifecycle: true,
        },
        language: 'en',
        timezone: 'Asia/Kolkata',
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
        pushTokensCount: 1,
        updatedAt: new Date().toISOString(),
      });

      mockUpdatePreferences.mockResolvedValue({
        userId: 'usr_1',
        channels: { push: true, email: true, sms: false, inApp: true },
        categories: {
          transactional: true,
          horoscope: true,
          consultation: true,
          marketing: true,
          lifecycle: true,
        },
        language: 'en',
        timezone: 'Asia/Kolkata',
        quietHours: {
          enabled: true,
          startHour: 23,
          startMinute: 0,
          endHour: 8,
          endMinute: 0,
        },
        frequencyCap: {
          maxMarketingPerDay: 1,
          maxMarketingPerWeek: 3,
        },
        optedOut: false,
        pushTokensCount: 1,
        updatedAt: new Date().toISOString(),
      });
    });

    it('loads and renders user preferences and quiet hours', async () => {
      render(<NotificationPreferencesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notification Preferences')).toBeTruthy();
        expect(screen.getByText('Quiet Hours')).toBeTruthy();
        expect(screen.getByText('Notification Channels')).toBeTruthy();
        expect(screen.getByText('Content Topics')).toBeTruthy();
      });
    });

    it('submits save preferences request', async () => {
      render(<NotificationPreferencesScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('save-preferences-btn')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('save-preferences-btn'));

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith(
          expect.objectContaining({
            channels: expect.objectContaining({
              push: true,
              email: true,
            }),
            quietHours: expect.objectContaining({
              enabled: true,
            }),
          }),
        );
      });
    });
  });

  describe('NotificationCenterScreen', () => {
    beforeEach(() => {
      mockGetInbox.mockResolvedValue({
        items: [
          {
            id: 'log_1',
            userId: 'usr_1',
            channel: NotificationChannel.PUSH,
            category: NotificationCategory.TRANSACTIONAL,
            eventType: NotificationEventType.REPORT_READY,
            recipient: 'usr_1',
            title: 'Your Life Kundli is Ready! 📄',
            body: 'Your comprehensive Vedic report is ready for viewing and PDF download.',
            status: NotificationDeliveryStatus.DELIVERED,
            data: { actionUrl: '/reports/rep_101', reportId: 'rep_101' },
            retryCount: 0,
            deliveredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          {
            id: 'log_2',
            userId: 'usr_1',
            channel: NotificationChannel.PUSH,
            category: NotificationCategory.HOROSCOPE,
            eventType: NotificationEventType.HOROSCOPE_READY,
            recipient: 'usr_1',
            title: 'Daily Horoscope for Mesha 🪐',
            body: 'Jupiter transit brings auspicious developments today.',
            status: NotificationDeliveryStatus.DELIVERED,
            data: { actionUrl: '/horoscope' },
            retryCount: 0,
            deliveredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      });
    });

    it('renders notification inbox list with categorized badges', async () => {
      render(<NotificationCenterScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cosmic Inbox')).toBeTruthy();
        expect(screen.getByText('Your Life Kundli is Ready! 📄')).toBeTruthy();
        expect(screen.getByText('Daily Horoscope for Mesha 🪐')).toBeTruthy();
        expect(screen.getByText('TRANSACTIONAL')).toBeTruthy();
        expect(screen.getByText('HOROSCOPE')).toBeTruthy();
      });
    });

    it('navigates to report history when report notification is tapped', async () => {
      render(<NotificationCenterScreen />);

      await waitFor(() => {
        expect(screen.getByText('Your Life Kundli is Ready! 📄')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Your Life Kundli is Ready! 📄'));

      expect(mockNavigate).toHaveBeenCalledWith('ReportHistory');
    });

    it('navigates to notification preferences from header button', async () => {
      render(<NotificationCenterScreen />);

      await waitFor(() => {
        expect(screen.getByText('Preferences')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Preferences'));

      expect(mockNavigate).toHaveBeenCalledWith('NotificationPreferences');
    });
  });
});
