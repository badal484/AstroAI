import type {
  AdminWalletAdjustmentInput,
  PaginatedResult,
  WalletBalanceDTO,
  WalletTransactionDTO,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export interface AdminUserWalletDetails {
  balance: WalletBalanceDTO;
  transactions: {
    items: WalletTransactionDTO[];
    nextCursor: string | null;
  };
}

export interface ReconcileResult {
  reconciled: boolean;
  cachedBalance: number;
  ledgerBalance: number;
  transactionCount: number;
}

export function listAdminWallets(
  limit = 20,
  cursor?: string,
): Promise<PaginatedResult<WalletBalanceDTO>> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  return apiRequest(`/api/v1/admin/wallets?${params.toString()}`);
}

export function fetchAdminUserWallet(userId: string): Promise<AdminUserWalletDetails> {
  return apiRequest(`/api/v1/admin/wallets/${encodeURIComponent(userId)}`);
}

export function adjustAdminWallet(
  userId: string,
  input: AdminWalletAdjustmentInput,
): Promise<WalletTransactionDTO> {
  return apiRequest(`/api/v1/admin/wallets/${encodeURIComponent(userId)}/adjust`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function reconcileAdminWallet(userId: string): Promise<ReconcileResult> {
  return apiRequest(`/api/v1/admin/wallets/${encodeURIComponent(userId)}/reconcile`, {
    method: 'POST',
  });
}
