import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { WalletScreen } from '../src/screens/wallet/WalletScreen';
import { fetchPricingExplanation } from '../src/lib/pricingApi';
import { fetchWalletBalance, fetchWalletTransactions } from '../src/lib/walletApi';

jest.mock('../src/lib/walletApi', () => ({
  fetchWalletBalance: jest.fn(),
  fetchWalletTransactions: jest.fn(),
}));

jest.mock('../src/lib/pricingApi', () => ({
  fetchPricingExplanation: jest.fn(),
  fetchCreditPacks: jest.fn(),
}));

const mockFetchBalance = jest.mocked(fetchWalletBalance);
const mockFetchExplanation = jest.mocked(fetchPricingExplanation);
const mockFetchTransactions = jest.mocked(fetchWalletTransactions);

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WalletScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockFetchBalance.mockReset();
  mockFetchExplanation.mockReset();
  mockFetchTransactions.mockReset();
});

describe('WalletScreen', () => {
  it('renders wallet balance card and credit packs correctly', async () => {
    mockFetchBalance.mockResolvedValue({
      userId: 'user_1',
      balance: 100,
      heldBalance: 20,
      availableBalance: 80,
      currency: 'CREDITS',
      lifetimeEarned: 150,
      lifetimeSpent: 50,
      updatedAt: new Date().toISOString(),
    });

    mockFetchExplanation.mockResolvedValue({
      chat: {
        creditsPerMessage: 2,
        freeMessagesPerDay: 3,
        freeMessagesOnSignup: 5,
      },
      voice: {
        billingUnit: 'minute' as any,
        creditsPerUnit: 5,
        minimumChargeCredits: 5,
        freeInitialSeconds: 30,
        roundingRule: 'ceil' as any,
      },
      reports: [
        {
          reportType: 'natal_chart',
          title: 'Full Kundli',
          description: 'Comprehensive chart',
          credits: 50,
          effectiveCredits: 50,
          discountPercent: 10,
        },
      ],
      freeCreditsOnSignup: 10,
      creditPacks: [
        {
          id: 'starter_pack',
          name: 'Starter Bundle',
          description: '50 Credits to get started',
          credits: 50,
          bonusCredits: 5,
          priceAmount: 4900,
          currency: 'INR',
          badge: 'Popular',
          active: true,
          sortOrder: 1,
        },
      ],
    });

    await renderScreen();

    expect(await screen.findByText('80')).toBeTruthy();
    expect(await screen.findByText('Starter Bundle')).toBeTruthy();
    expect(await screen.findByText(/\(\+5 Bonus\)/i)).toBeTruthy();
    expect(await screen.findByText(/Recharge ₹49/i)).toBeTruthy();
  });

  it('switches to pricing guide tab and displays rates', async () => {
    mockFetchBalance.mockResolvedValue({
      userId: 'user_1',
      balance: 50,
      heldBalance: 0,
      availableBalance: 50,
      currency: 'CREDITS',
      lifetimeEarned: 50,
      lifetimeSpent: 0,
      updatedAt: new Date().toISOString(),
    });

    mockFetchExplanation.mockResolvedValue({
      chat: {
        creditsPerMessage: 2,
        freeMessagesPerDay: 3,
        freeMessagesOnSignup: 5,
      },
      voice: {
        billingUnit: 'minute' as any,
        creditsPerUnit: 5,
        minimumChargeCredits: 5,
        freeInitialSeconds: 30,
        roundingRule: 'ceil' as any,
      },
      reports: [
        {
          reportType: 'natal_chart',
          title: 'Full Kundli',
          description: 'Comprehensive chart',
          credits: 50,
          effectiveCredits: 50,
          discountPercent: 10,
        },
      ],
      freeCreditsOnSignup: 10,
      creditPacks: [],
    });

    await renderScreen();

    await screen.findAllByText('50');

    await act(async () => {
      fireEvent.press(screen.getByText('Service Rates'));
    });

    expect(await screen.findByText(/Acharya Written Query/i)).toBeTruthy();
    expect(await screen.findByText(/Welcome Signup Credits/i)).toBeTruthy();
    expect(await screen.findByText(/Full Kundli/i)).toBeTruthy();
  });
});
