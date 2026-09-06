import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPermission, PaymentGateway, PaymentOrderStatus } from '@astroai/shared-types';
import PaymentsPage from '../src/app/(dashboard)/payments/page';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

const listAdminPaymentsMock = vi.fn();
const fetchAdminPaymentDetailsMock = vi.fn();
const refundAdminPaymentMock = vi.fn();
const reconcileAdminPaymentMock = vi.fn();

vi.mock('../src/lib/adminPaymentsApi', () => ({
  listAdminPayments: (...args: unknown[]) => listAdminPaymentsMock(...args),
  fetchAdminPaymentDetails: (...args: unknown[]) => fetchAdminPaymentDetailsMock(...args),
  refundAdminPayment: (...args: unknown[]) => refundAdminPaymentMock(...args),
  reconcileAdminPayment: (...args: unknown[]) => reconcileAdminPaymentMock(...args),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Admin PaymentsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAdminAuthStore.setState({
      status: 'authenticated',
      admin: {
        id: 'admin_1',
        email: 'finance@astroai.test',
        name: 'Finance Admin',
        role: 'finance' as any,
        permissions: [AdminPermission.PAYMENTS_READ, AdminPermission.PAYMENTS_MANAGE],
      },
    });
  });

  it('renders payment orders list and metrics correctly', async () => {
    listAdminPaymentsMock.mockResolvedValueOnce({
      items: [
        {
          id: 'ord_test_101',
          userId: 'user_cust_1',
          packId: 'pack_starter',
          gateway: PaymentGateway.RAZORPAY,
          gatewayOrderId: 'order_rzp_101',
          amount: 4900,
          currency: 'INR',
          credits: 50,
          bonusCredits: 5,
          totalCredits: 55,
          status: PaymentOrderStatus.PAID,
          idempotencyKey: 'key_101',
          pricingSnapshot: {
            pricingVersion: 1,
            unitPrice: 4900,
            netAmount: 4900,
          },
          refundedAmount: 0,
          paidAt: '2026-09-02T12:00:00.000Z',
          createdAt: '2026-09-02T12:00:00.000Z',
          updatedAt: '2026-09-02T12:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    renderWithQuery(<PaymentsPage />);

    expect(screen.getByText(/loading payment records/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ord_test_101')).toBeInTheDocument();
      expect(screen.getByText('order_rzp_101')).toBeInTheDocument();
      expect(screen.getByText('user_cust_1')).toBeInTheDocument();
      expect(screen.getAllByText(/49\.00/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
