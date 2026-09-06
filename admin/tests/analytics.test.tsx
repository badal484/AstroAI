import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsHubPage from '../src/app/(dashboard)/analytics/page';
import { adminControlApi } from '../src/lib/adminControlApi';

vi.mock('../src/lib/adminControlApi', () => ({
  adminControlApi: {
    getProductAnalytics: vi.fn(),
    getFinancialAnalytics: vi.fn(),
    getAITechnicalAnalytics: vi.fn(),
    getAnalyticsEvents: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('Analytics Hub Dashboard UI Tests', () => {
  const mockProductData = {
    registrationsTimeline: [{ date: '2026-09-01', registrations: 45 }],
    activationFunnel: {
      totalRegistrations: 1000,
      profileCompleted: { count: 650, conversionRate: 65.0 },
      firstChatStarted: { count: 480, conversionRate: 48.0 },
      firstPurchaseCompleted: { count: 210, conversionRate: 21.0 },
    },
    activeUsers: { dau: 320, wau: 890, mau: 1540, stickinessPercent: 20.8 },
    retentionCohorts: [
      { cohortDate: '2026-08-01', initialUsers: 250, day1Percent: 82.5, day7Percent: 54.2, day14Percent: 38.0, day30Percent: 26.5 },
    ],
    churn: { totalUsers: 2500, activeUsers30d: 1540, churnedUsersCount: 960, churnRatePercent: 38.4 },
  };

  const mockFinancialData = {
    overview: { gmvPaise: 45000000, netRevenuePaise: 41400000, refundsPaise: 0, totalPaidOrders: 850 },
    unitEconomics: { arpuPaise: 29200, arppuPaise: 52900, averageOrderValuePaise: 52900 },
    serviceBreakdown: [
      { service: 'credit_packs' as const, revenuePaise: 30000000, ordersCount: 600, sharePercent: 67 },
      { service: 'reports' as const, revenuePaise: 10000000, ordersCount: 150, sharePercent: 22 },
      { service: 'voice_calls' as const, revenuePaise: 5000000, ordersCount: 100, sharePercent: 11 },
    ],
    walletUsage: { totalCreditsPurchased: 450000, totalCreditsConsumed: 380000, totalCreditsHeld: 0, totalCreditsExpired: 0 },
    voice: { totalMinutesBilled: 1250, totalCalls: 100, averageDurationMinutes: 12.5, billedRevenuePaise: 5000000, providerCostPaise: 750000, grossMarginPercent: 85 },
    reports: { totalReportsPurchased: 150, kundliReports: 110, compatibilityReports: 40, revenuePaise: 10000000 },
    marketingAttribution: {
      promotions: { redemptionsCount: 120, discountCostPaise: 240000, attributedGmvPaise: 1440000, roiMultiplier: 6.0 },
      referrals: { invitesSent: 450, refereesClaimed: 150, qualifyingPurchases: 60, rewardsIssuedCredits: 3000 },
      notifications: { totalSent: 5000, openRatePercent: 44.5, conversionRatePercent: 9.2, attributedGmvPaise: 810000 },
    },
  };

  const mockAIData = {
    overview: { totalRequests: 12500, successfulRequests: 12420, failedRequests: 80, successRatePercent: 99.4 },
    tokens: { promptTokens: 3500000, completionTokens: 1800000, totalTokens: 5300000 },
    cost: {
      totalCostPaise: 750000,
      totalCostUsd: 85.7142,
      costByProvider: [
        { provider: 'openai', requests: 8000, totalTokens: 3400000, costUsd: 55.4, costPaise: 484750 },
        { provider: 'gemini', requests: 4500, totalTokens: 1900000, costUsd: 30.3, costPaise: 265250 },
      ],
    },
    reliability: {
      fallbackCount: 140,
      fallbackRatePercent: 1.1,
      failuresByCategory: [
        { category: 'rate_limited', count: 50, percentage: 62.5 },
        { category: 'timeout', count: 30, percentage: 37.5 },
      ],
    },
    latencies: {
      overall: { averageMs: 420, p50Ms: 380, p95Ms: 780, p99Ms: 1450 },
      byTask: [
        { task: 'chat', averageMs: 350, p50Ms: 310, p95Ms: 620, p99Ms: 980 },
        { task: 'interpretation', averageMs: 850, p50Ms: 790, p95Ms: 1250, p99Ms: 1850 },
      ],
    },
  };

  const mockEventsData = {
    items: [
      {
        id: 'ev_1',
        category: 'product' as const,
        eventName: 'birth_profile_created',
        entityId: 'user_123',
        status: 'success' as const,
        durationMs: 45,
        metrics: { kundliCalculated: 1 },
        createdAt: '2026-09-01T12:00:00.000Z',
      },
    ],
    total: 1,
    limit: 15,
    offset: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminControlApi.getProductAnalytics).mockResolvedValue(mockProductData);
    vi.mocked(adminControlApi.getFinancialAnalytics).mockResolvedValue(mockFinancialData);
    vi.mocked(adminControlApi.getAITechnicalAnalytics).mockResolvedValue(mockAIData);
    vi.mocked(adminControlApi.getAnalyticsEvents).mockResolvedValue(mockEventsData);
  });

  it('renders Product & Growth Analytics with activation funnel and retention cohorts', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsHubPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Platform Intelligence & Analytics')).toBeDefined();
    expect(await screen.findByText('20.8%')).toBeDefined(); // stickiness
    expect(screen.getByText('Seeker Activation & Conversion Funnel')).toBeDefined();
    expect(screen.getByText('65% conversion')).toBeDefined();
    expect(screen.getByText('82.5%')).toBeDefined();
  });

  it('switches to Financial & Unit Economics tab and displays GMV, service breakdown, and promo ROI', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsHubPage />
      </QueryClientProvider>,
    );

    const financialTabBtn = await screen.findByText(/Financial & Unit Economics/i);
    fireEvent.click(financialTabBtn);

    expect(await screen.findByTestId('financial-analytics-tab')).toBeDefined();
    expect(screen.getByText('₹4,50,000')).toBeDefined();
    expect(screen.getByText('₹292')).toBeDefined(); // ARPU
    expect(screen.getByText('6x ROI')).toBeDefined();
    expect(screen.getByText('85%')).toBeDefined(); // Gross margin
  });

  it('switches to AI Gateway & Reliability tab and displays token volumes, cost table, and p50/p95/p99 latencies', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsHubPage />
      </QueryClientProvider>,
    );

    const aiTabBtn = await screen.findByText(/AI Gateway & Technical Reliability/i);
    fireEvent.click(aiTabBtn);

    expect(await screen.findByTestId('ai-analytics-tab')).toBeDefined();
    expect(screen.getByText('5,300,000')).toBeDefined(); // Total tokens
    expect(screen.getByText('1.1%')).toBeDefined(); // Fallback rate
    expect(screen.getByText('380 ms')).toBeDefined(); // P50
    expect(screen.getByText('1450 ms')).toBeDefined(); // P99
    expect(screen.getByText('openai')).toBeDefined();
  });

  it('switches to Diagnostic Events Log tab and displays paginated event records', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsHubPage />
      </QueryClientProvider>,
    );

    const eventsTabBtn = await screen.findByText(/Diagnostic Events Log/i);
    fireEvent.click(eventsTabBtn);

    expect(await screen.findByTestId('events-tab')).toBeDefined();
    expect(screen.getByText('birth_profile_created')).toBeDefined();
    expect(screen.getByText('SUCCESS')).toBeDefined();
    expect(screen.getByText('45ms')).toBeDefined();
  });

  it('re-fetches analytics data when time range selector changes', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsHubPage />
      </QueryClientProvider>,
    );

    await screen.findByText('Platform Intelligence & Analytics');
    const ninetyDaysBtn = screen.getByText('90 Days');
    fireEvent.click(ninetyDaysBtn);

    await waitFor(() => {
      expect(adminControlApi.getProductAnalytics).toHaveBeenCalledWith('90d');
    });
  });
});
