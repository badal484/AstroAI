import type {
  CreatePaymentOrderInput,
  PaginatedResult,
  PaymentHistoryQuery,
  PaymentOrderDTO,
  PaymentVerificationInput,
  WalletBalanceDTO,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export interface PaymentVerificationResult {
  order: PaymentOrderDTO;
  walletBalance: WalletBalanceDTO;
}

export function createPaymentOrder(
  input: CreatePaymentOrderInput,
): Promise<PaymentOrderDTO> {
  return apiRequest('/api/v1/payments/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function verifyPayment(
  input: PaymentVerificationInput,
): Promise<PaymentVerificationResult> {
  return apiRequest('/api/v1/payments/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchPaymentHistory(
  query: PaymentHistoryQuery = { limit: 20 },
): Promise<PaginatedResult<PaymentOrderDTO>> {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.status) params.set('status', query.status);

  return apiRequest(`/api/v1/payments/history?${params.toString()}`);
}
