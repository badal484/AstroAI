import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PaymentGateway, PaymentOrderStatus } from '@astroai/shared-types';
import { WalletScreen } from '../src/screens/wallet/WalletScreen';

const mockFetchWalletBalance = jest.fn();
const mockFetchPricingExplanation = jest.fn();
const mockFetchWalletTransactions = jest.fn();
const mockCreatePaymentOrder = jest.fn();
const mockVerifyPayment = jest.fn();

jest.mock('../src/lib/walletApi', () => ({
  fetchWalletBalance: () => mockFetchWalletBalance(),
  fetchWalletTransactions: () => mockFetchWalletTransactions(),
}));

jest.mock('../src/lib/pricingApi', () => ({
  fetchPricingExplanation: () => mockFetchPricingExplanation(),
}));

jest.mock('../src/lib/paymentApi', () => ({
  createPaymentOrder: (...args: unknown[]) => mockCreatePaymentOrder(...args),
  verifyPayment: (...args: unknown[]) => mockVerifyPayment(...args),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Mobile WalletScreen Payment Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchWalletBalance.mockResolvedValue({
      userId: 'user_1',
      balance: 10,
      availableBalance: 10,
      heldBalance: 0,
      lifetimeCredited: 10,
      lifetimeSpent: 0,
      currency: 'CREDITS',
      updatedAt: '2026-09-02T12:00:00.000Z',
    });

    mockFetchPricingExplanation.mockResolvedValue({
      version: 1,
      creditPacks: [
        {
          id: 'pack_starter',
          name: 'Starter Astro Pack',
          description: '50 Credits for instant chats',
          credits: 50,
          bonusCredits: 5,
          priceAmount: 4900,
          currency: 'INR',
          badge: 'POPULAR',
          active: true,
        },
      ],
      chat: { creditsPerMessage: 1, freeMessagesPerDay: 5, minChargeCredits: 1 },
      voice: { creditsPerMinute: 5, roundingRule: 'UP', minimumChargeSeconds: 60, freeSeconds: 30 },
      reports: [
        {
          reportType: 'full_kundli',
          title: 'Full Life Kundli Report',
          description: 'Deep planetary positions and predictions',
          credits: 25,
          effectiveCredits: 25,
          discountPercent: 0,
        },
      ],
      freeCreditsOnSignup: 10,
    });

    mockCreatePaymentOrder.mockResolvedValue({
      id: 'ord_123',
      userId: 'user_1',
      packId: 'pack_starter',
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: 'order_rzp_123',
      amount: 4900,
      currency: 'INR',
      credits: 50,
      bonusCredits: 5,
      totalCredits: 55,
      status: PaymentOrderStatus.CREATED,
      idempotencyKey: 'mobile_key_1',
      pricingSnapshot: { pricingVersion: 1, unitPrice: 4900, netAmount: 4900 },
      refundedAmount: 0,
      paidAt: null,
      createdAt: '2026-09-02T12:00:00.000Z',
      updatedAt: '2026-09-02T12:00:00.000Z',
    });

    mockVerifyPayment.mockResolvedValue({
      order: {
        id: 'ord_123',
        userId: 'user_1',
        packId: 'pack_starter',
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId: 'order_rzp_123',
        amount: 4900,
        currency: 'INR',
        credits: 50,
        bonusCredits: 5,
        totalCredits: 55,
        status: PaymentOrderStatus.PAID,
        idempotencyKey: 'mobile_key_1',
        pricingSnapshot: { pricingVersion: 1, unitPrice: 4900, netAmount: 4900 },
        refundedAmount: 0,
        paidAt: '2026-09-02T12:01:00.000Z',
        createdAt: '2026-09-02T12:00:00.000Z',
        updatedAt: '2026-09-02T12:01:00.000Z',
      },
      walletBalance: {
        userId: 'user_1',
        balance: 65,
        availableBalance: 65,
        heldBalance: 0,
        lifetimeCredited: 65,
        lifetimeSpent: 0,
        currency: 'CREDITS',
        updatedAt: '2026-09-02T12:01:00.000Z',
      },
    });
  });

  it('initiates payment order and executes verification when buying a credit pack', async () => {
    renderWithQuery(<WalletScreen />);

    await waitFor(() => {
      expect(screen.getByText('Starter Astro Pack')).toBeTruthy();
      expect(screen.getByText('Recharge ₹49')).toBeTruthy();
    });

    // Tap Buy Pack button
    fireEvent.press(screen.getByText('Recharge ₹49'));

    await waitFor(() => {
      expect(mockCreatePaymentOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          packId: 'pack_starter',
        }),
      );
      expect(mockVerifyPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord_123',
          razorpayOrderId: 'order_rzp_123',
        }),
      );
      expect(screen.getByText(/Added 55 credits to your Vedic wallet/i)).toBeTruthy();
    });
  });
});
