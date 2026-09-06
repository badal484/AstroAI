import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AdminPermission,
  AudienceSegment,
  CampaignStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from '@astroai/shared-types';
import AdminNotificationsPage from '../src/app/(dashboard)/notifications/page';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

const fetchNotificationStatsMock = vi.fn();
const fetchNotificationCampaignsMock = vi.fn();
const fetchNotificationTemplatesMock = vi.fn();
const fetchNotificationLogsMock = vi.fn();
const createNotificationCampaignMock = vi.fn();
const executeNotificationCampaignMock = vi.fn();
const pauseNotificationCampaignMock = vi.fn();
const resumeNotificationCampaignMock = vi.fn();
const createNotificationTemplateMock = vi.fn();
const updateNotificationTemplateMock = vi.fn();

vi.mock('../src/lib/adminNotificationsApi', () => ({
  fetchNotificationStats: (...args: unknown[]) => fetchNotificationStatsMock(...args),
  fetchNotificationCampaigns: (...args: unknown[]) => fetchNotificationCampaignsMock(...args),
  fetchNotificationTemplates: (...args: unknown[]) => fetchNotificationTemplatesMock(...args),
  fetchNotificationLogs: (...args: unknown[]) => fetchNotificationLogsMock(...args),
  createNotificationCampaign: (...args: unknown[]) => createNotificationCampaignMock(...args),
  executeNotificationCampaign: (...args: unknown[]) => executeNotificationCampaignMock(...args),
  pauseNotificationCampaign: (...args: unknown[]) => pauseNotificationCampaignMock(...args),
  resumeNotificationCampaign: (...args: unknown[]) => resumeNotificationCampaignMock(...args),
  createNotificationTemplate: (...args: unknown[]) => createNotificationTemplateMock(...args),
  updateNotificationTemplate: (...args: unknown[]) => updateNotificationTemplateMock(...args),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Admin Notifications Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();

    useAdminAuthStore.setState({
      status: 'authenticated',
      admin: {
        id: 'admin_1',
        email: 'marketing@astroai.test',
        name: 'Marketing Admin',
        role: 'marketing' as any,
        permissions: [AdminPermission.NOTIFICATIONS_READ, AdminPermission.NOTIFICATIONS_MANAGE],
      },
    });

    fetchNotificationStatsMock.mockResolvedValue({
      totalSent: 1500,
      totalDelivered: 1450,
      totalFailed: 10,
      totalSuppressed: 40,
      byChannel: { push: 1200, email: 300 },
      byCategory: { marketing: 500, transactional: 1000 },
      byStatus: { delivered: 1450, failed: 10 },
    });

    fetchNotificationCampaignsMock.mockResolvedValue([
      {
        id: 'camp_101',
        name: 'Diwali Cosmic Blessings',
        templateCode: 'PROMOTIONAL_OFFER',
        audienceSegment: AudienceSegment.ALL_USERS,
        channels: [NotificationChannel.PUSH],
        status: CampaignStatus.SCHEDULED,
        stats: {
          totalTargeted: 500,
          sent: 0,
          delivered: 0,
          failed: 0,
          suppressed: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    fetchNotificationTemplatesMock.mockResolvedValue([
      {
        id: 'tpl_101',
        templateCode: 'WELCOME_USER',
        name: 'Welcome New User',
        eventType: NotificationEventType.USER_REGISTRATION,
        category: NotificationCategory.LIFECYCLE,
        channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        variables: ['name'],
        locales: {
          en: {
            title: 'Welcome to AstroAI, {{name}}! 🌟',
            body: 'Your celestial journey begins now.',
          },
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    fetchNotificationLogsMock.mockResolvedValue({
      items: [
        {
          id: 'log_101',
          userId: 'usr_1',
          channel: NotificationChannel.PUSH,
          category: NotificationCategory.TRANSACTIONAL,
          eventType: NotificationEventType.PURCHASE,
          recipient: 'fcm_token_123',
          title: 'Payment Successful!',
          body: 'Added 50 credits to your wallet.',
          status: NotificationDeliveryStatus.DELIVERED,
          retryCount: 0,
          deliveredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
    });
  });

  it('renders platform notification KPIs, campaigns list, and actions', async () => {
    renderWithQuery(<AdminNotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Platform')).toBeInTheDocument();
      expect(screen.getByText('1450')).toBeInTheDocument(); // totalDelivered
      expect(screen.getByText('Diwali Cosmic Blessings')).toBeInTheDocument();
      expect(screen.getByText('Execute Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Execute Now'));

    await waitFor(() => {
      expect(executeNotificationCampaignMock).toHaveBeenCalledWith('camp_101');
    });
  });

  it('switches between campaigns, templates, and delivery logs tabs', async () => {
    renderWithQuery(<AdminNotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marketing Campaigns (1)')).toBeInTheDocument();
    });

    // Switch to Templates
    fireEvent.click(screen.getByText(/Notification Templates/));
    await waitFor(() => {
      expect(screen.getByText('WELCOME_USER')).toBeInTheDocument();
      expect(screen.getByText('Welcome New User')).toBeInTheDocument();
    });

    // Switch to Logs
    fireEvent.click(screen.getByText('Delivery Tracking Logs'));
    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      expect(screen.getByText('Added 50 credits to your wallet.')).toBeInTheDocument();
    });
  });
});
