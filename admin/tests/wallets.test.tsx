import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPermission } from '@astroai/shared-types';
import WalletsPage from '../src/app/(dashboard)/wallets/page';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

const listAdminWalletsMock = vi.fn();
const fetchAdminUserWalletMock = vi.fn();
const adjustAdminWalletMock = vi.fn();
const reconcileAdminWalletMock = vi.fn();

vi.mock('../src/lib/adminWalletApi', () => ({
  listAdminWallets: () => listAdminWalletsMock(),
  fetchAdminUserWallet: (...args: unknown[]) => fetchAdminUserWalletMock(...args),
  adjustAdminWallet: (...args: unknown[]) => adjustAdminWalletMock(...args),
  reconcileAdminWallet: (...args: unknown[]) => reconcileAdminWalletMock(...args),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Admin WalletsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAdminAuthStore.setState({
      status: 'authenticated',
      admin: {
        id: 'admin_1',
        email: 'finance@astroai.test',
        name: 'Finance Admin',
        role: 'finance' as any,
        permissions: [AdminPermission.WALLET_READ, AdminPermission.WALLET_MANAGE],
      },
    });
  });

  it('renders user wallets list correctly', async () => {
    listAdminWalletsMock.mockResolvedValueOnce({
      items: [
        {
          userId: 'user_cust_1',
          balance: 150,
          heldBalance: 20,
          availableBalance: 130,
          currency: 'CREDITS',
          lifetimeEarned: 200,
          lifetimeSpent: 50,
          updatedAt: '2026-09-02T10:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    renderWithQuery(<WalletsPage />);

    expect(screen.getByText(/loading user wallets/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('user_cust_1')).toBeInTheDocument();
      expect(screen.getByText('150 Cr')).toBeInTheDocument();
      expect(screen.getByText(/Avail: 130/i)).toBeInTheDocument();
    });
  });
});
