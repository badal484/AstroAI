import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPermission, BillingUnit, PricingConfigStatus, RoundingRule } from '@astroai/shared-types';
import PricingPage from '../src/app/(dashboard)/pricing/page';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

const fetchActivePricingMock = vi.fn();
const fetchPricingVersionsMock = vi.fn();
const createPricingVersionMock = vi.fn();

vi.mock('../src/lib/adminPricingApi', () => ({
  fetchActivePricing: () => fetchActivePricingMock(),
  fetchPricingVersions: () => fetchPricingVersionsMock(),
  createPricingVersion: (...args: unknown[]) => createPricingVersionMock(...args),
}));

const mockConfig = {
  version: 1,
  status: PricingConfigStatus.ACTIVE,
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  effectiveTo: null,
  freeCreditsOnSignup: 10,
  firstPurchaseDiscountPercent: 20,
  creditPacks: [
    {
      id: 'pack_1',
      name: 'Starter Pack',
      description: 'Starter credits',
      credits: 50,
      bonusCredits: 5,
      priceAmount: 4900,
      currency: 'INR',
      badge: null,
      active: true,
      sortOrder: 1,
    },
  ],
  chat: {
    creditsPerMessage: 2,
    freeMessagesPerDay: 3,
    freeMessagesOnSignup: 5,
  },
  voice: {
    billingUnit: BillingUnit.MINUTE,
    creditsPerUnit: 5,
    minimumChargeCredits: 5,
    freeInitialSeconds: 30,
    roundingRule: RoundingRule.CEIL,
    maxSessionDurationSeconds: 3600,
  },
  reports: [
    {
      reportType: 'natal_chart',
      title: 'Full Kundli',
      description: 'Birth chart',
      credits: 50,
      discountPercent: 10,
      active: true,
    },
  ],
  subscriptions: [],
  notes: 'Production config',
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Admin PricingPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAdminAuthStore.setState({
      status: 'authenticated',
      admin: {
        id: 'admin_1',
        email: 'super@astroai.test',
        name: 'Super Admin',
        role: 'super_admin' as any,
        permissions: [AdminPermission.PRICING_READ, AdminPermission.PRICING_MANAGE],
      },
    });
  });

  it('renders active pricing rates correctly', async () => {
    fetchActivePricingMock.mockResolvedValueOnce(mockConfig);

    renderWithQuery(<PricingPage />);

    expect(screen.getByText(/loading pricing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/v1 Active/i)).toBeInTheDocument();
      expect(screen.getByText(/2 Credits/i)).toBeInTheDocument();
      expect(screen.getByText(/Starter Pack/i)).toBeInTheDocument();
      expect(screen.getByText(/Full Kundli/i)).toBeInTheDocument();
    });
  });
});
