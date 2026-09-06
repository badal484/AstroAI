import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPermission, AdminRole } from '@astroai/shared-types';
import AIControlPage from '../src/app/(dashboard)/ai/page';
import AstrologyConfigPage from '../src/app/(dashboard)/astrology/page';
import FeatureFlagsPage from '../src/app/(dashboard)/feature-flags/page';
import DashboardHomePage from '../src/app/(dashboard)/page';
import SystemSettingsPage from '../src/app/(dashboard)/settings/page';
import SupportHelpdeskPage from '../src/app/(dashboard)/support/page';
import { ConfirmActionModal } from '../src/components/ConfirmActionModal';
import { adminControlApi } from '../src/lib/adminControlApi';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

vi.mock('../src/lib/adminControlApi', () => ({
  adminControlApi: {
    getExecutiveMetrics: vi.fn(),
    getRevenueChart: vi.fn(),
    listAuditLogs: vi.fn(),
    getAIConfig: vi.fn(),
    getAstrologyConfig: vi.fn(),
    updateAstrologyConfig: vi.fn(),
    listHoroscopes: vi.fn(),
    listArticles: vi.fn(),
    listRemedies: vi.fn(),
    listFeatureFlags: vi.fn(),
    toggleFeatureFlag: vi.fn(),
    listSupportTickets: vi.fn(),
    replySupportTicket: vi.fn(),
    resolveSupportTicket: vi.fn(),
    getSystemSettings: vi.fn(),
    toggleMaintenanceMode: vi.fn(),
    listAdminUsers: vi.fn(),
    createAdminUser: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('Admin Control Center UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminAuthStore.setState({
      status: 'authenticated',
      admin: {
        id: 'admin_1',
        email: 'superadmin@astroai.com',
        name: 'Super Admin',
        role: AdminRole.SUPER_ADMIN,
        permissions: Object.values(AdminPermission),
      },
    });
  });

  it('renders Dashboard Home page with executive KPI cards and operational status', async () => {
    vi.mocked(adminControlApi.getExecutiveMetrics).mockResolvedValue({
      grossMerchandiseValuePaise: 12500000,
      netRevenuePaise: 11500000,
      monthlyRecurringRevenuePaise: 4375000,
      totalSeekers: 2500,
      activeSeekersToday: 700,
      activeSeekersMonth: 1800,
      totalVoiceMinutesBilled: 1240,
      totalReportsCompleted: 450,
      aiGatewayTotalCostPaise: 1000000,
      supportTicketsPending: 3,
    });

    vi.mocked(adminControlApi.getRevenueChart).mockResolvedValue([
      { date: '2026-09-01', grossRevenue: 450000, netRevenue: 410000, ordersCount: 35, creditsPurchased: 4500 },
    ]);

    vi.mocked(adminControlApi.listAuditLogs).mockResolvedValue([]);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardHomePage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Welcome back, Super Admin/i)).toBeDefined();
    expect(await screen.findByText('₹1,25,000')).toBeDefined();
    expect(await screen.findByText('1,800')).toBeDefined();
    expect(await screen.findByText('1,240 mins')).toBeDefined();
  });

  it('validates ConfirmActionModal requires mandatory reason before submission', async () => {
    const onConfirmMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ConfirmActionModal
        isOpen={true}
        title="Suspend Seeker"
        description="Will block user login privileges."
        riskLevel="warning"
        confirmText="Suspend"
        onConfirm={onConfirmMock}
        onClose={onCloseMock}
      />,
    );

    expect(screen.getByText('Suspend Seeker')).toBeDefined();

    const submitBtn = screen.getByTestId('confirm-modal-submit-btn');
    fireEvent.click(submitBtn);

    expect(
      screen.getByText('Please provide a mandatory administrative reason (minimum 3 characters).'),
    ).toBeDefined();
    expect(onConfirmMock).not.toHaveBeenCalled();

    const reasonInput = screen.getByTestId('confirm-modal-reason-input');
    fireEvent.change(reasonInput, { target: { value: 'Payment fraud chargeback dispute' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith('Payment fraud chargeback dispute');
    });
  });

  it('renders AI Control page with providers, models, and personas', async () => {
    vi.mocked(adminControlApi.getAIConfig).mockResolvedValue({
      providers: [
        {
          id: 'p_openai',
          name: 'OpenAI GPT-4o',
          provider: 'openai',
          type: 'llm',
          enabled: true,
          priority: 1,
          healthStatus: 'healthy',
          latencyMs: 420,
        },
      ],
      routingRules: [],
      personas: [
        {
          id: 'acharya_shastri',
          name: 'Acharya Shastri',
          specialty: 'Vedic Kundli',
          tone: 'Wise Guru',
          experienceYears: 25,
          voiceId: 'eleven_guru',
          systemPromptAdditions: 'Parashari principles',
          enabled: true,
        },
      ],
      systemPrompt: {
        version: '3.4.0',
        vedicAstrologyGuidelines: 'Ascendant Moon Sign',
        outputFormatRules: 'Insight, Factors',
        crisisInterventionRules: 'Direct self-harm to emergency',
        ethicalSafeguards: 'No fear-based threats',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      languages: [
        { code: 'en', name: 'English', nativeName: 'English', chatEnabled: true, voiceEnabled: true, reportsEnabled: true },
      ],
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AIControlPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('OpenAI GPT-4o')).toBeDefined();
    expect(screen.getByText('420 ms')).toBeDefined();
  });

  it('renders Astrology Engine configuration page with Ashtakoota Milan weights', async () => {
    vi.mocked(adminControlApi.getAstrologyConfig).mockResolvedValue({
      ayanamsha: 'lahiri' as any,
      houseSystem: 'placidus' as any,
      ephemerisProvider: 'swiss_ephemeris',
      ephemerisPrecision: 'high_precision',
      ashtakootaWeights: {
        varna: 1,
        vashya: 2,
        tara: 3,
        yoni: 4,
        grahaMaitri: 5,
        gana: 6,
        bhakoot: 7,
        nadi: 8,
      },
      manglikStrictness: 'standard',
      sadeSatiCalculation: 'exact_degree_transit',
      updatedAt: '2026-09-01T00:00:00.000Z',
      updatedBy: 'Admin',
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AstrologyConfigPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Astrology Engine Configuration')).toBeDefined();
    expect(screen.getByText('Swiss Ephemeris 2.10')).toBeDefined();
    expect(screen.getByText('8 pts')).toBeDefined();
  });

  it('renders Feature Flags page with rollout sliders and toggle buttons', async () => {
    vi.mocked(adminControlApi.listFeatureFlags).mockResolvedValue([
      {
        key: 'voice_astrologer_v2',
        name: 'Live Voice Astrologer v2',
        description: 'Real-time voice consultation pipeline.',
        enabled: true,
        rolloutPercentage: 100,
        targetUserSegments: ['all'],
        updatedAt: '2026-09-01T00:00:00.000Z',
        updatedBy: 'System',
      },
    ]);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <FeatureFlagsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('voice_astrologer_v2')).toBeDefined();
    expect(screen.getByText('Live Voice Astrologer v2')).toBeDefined();
    expect(screen.getByText('Disable')).toBeDefined();
  });

  it('renders Support Helpdesk with tickets list and conversation thread', async () => {
    vi.mocked(adminControlApi.listSupportTickets).mockResolvedValue([
      {
        id: 'ticket_123',
        userId: 'u_1',
        userEmail: 'seeker@astroai.com',
        userName: 'Aarav Patel',
        subject: 'Report generation delayed',
        category: 'report',
        priority: 'high' as any,
        status: 'open' as any,
        assignedAdminId: null,
        assignedAdminName: null,
        messages: [
          {
            id: 'm_1',
            senderType: 'user',
            senderId: 'u_1',
            senderName: 'Aarav Patel',
            body: 'My Kundli report has been processing for 20 minutes.',
            createdAt: '2026-09-01T10:00:00.000Z',
          },
        ],
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      },
    ]);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SupportHelpdeskPage />
      </QueryClientProvider>,
    );

    const titles = await screen.findAllByText('Report generation delayed');
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('My Kundli report has been processing for 20 minutes.')).toBeDefined();
    expect(screen.getByText('✓ Mark Resolved')).toBeDefined();
  });

  it('renders System Settings page with emergency maintenance mode control', async () => {
    vi.mocked(adminControlApi.getSystemSettings).mockResolvedValue({
      maintenance: {
        enabled: false,
        message: 'Under maintenance',
        allowedIpAddresses: [],
        startedAt: null,
        estimatedEndAt: null,
      },
      globalRateLimits: {
        publicApiRequestsPerMin: 60,
        authRequestsPerMin: 10,
        chatRequestsPerMin: 30,
        voiceTurnsPerMin: 20,
      },
      security: {
        enforceMfaForAdmins: false,
        sessionTimeoutMinutes: 60,
        maxLoginAttempts: 5,
      },
      systemHealth: {
        mongoDbConnected: true,
        redisConnected: true,
        aiGatewayOperational: true,
        razorpayWebhookOperational: true,
        uptimeSeconds: 12000,
      },
    });

    vi.mocked(adminControlApi.listAdminUsers).mockResolvedValue([
      {
        id: 'admin_1',
        email: 'superadmin@astroai.com',
        name: 'Super Admin',
        role: 'super_admin',
        status: 'active',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ]);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SystemSettingsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Platform Maintenance Mode: INACTIVE \(ONLINE\)/i)).toBeDefined();
    expect(screen.getByText('Activate Maintenance Mode')).toBeDefined();
    expect(screen.getByText('60 req/min')).toBeDefined();
    expect(screen.getByText('+ Invite Admin User')).toBeDefined();
  });
});
