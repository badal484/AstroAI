import type {
  PaginatedResult,
  WalletBalanceDTO,
  WalletTransactionDTO,
  WalletTransactionsQuery,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function fetchWalletBalance(): Promise<WalletBalanceDTO> {
  return apiRequest('/api/v1/wallet');
}

export function fetchWalletTransactions(
  query: WalletTransactionsQuery = { limit: 20 },
): Promise<PaginatedResult<WalletTransactionDTO>> {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.type) params.set('type', query.type);
  if (query.source) params.set('source', query.source);

  return apiRequest(`/api/v1/wallet/transactions?${params.toString()}`);
}

export const walletApi = {
  fetchWalletBalance,
  fetchWalletTransactions,
  getBalance: fetchWalletBalance,
  getTransactions: fetchWalletTransactions,
};

