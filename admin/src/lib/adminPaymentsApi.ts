import type {
  AdminPaymentRefundInput,
  PaginatedResult,
  PaymentHistoryQuery,
  PaymentOrderDTO,
  PaymentReconciliationResult,
  PaymentRefundDTO,
  PaymentTransactionDTO,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export interface AdminPaymentDetailsResult {
  order: PaymentOrderDTO;
  transactions: PaymentTransactionDTO[];
  refunds: PaymentRefundDTO[];
}

export function listAdminPayments(
  query: PaymentHistoryQuery = { limit: 20 },
): Promise<PaginatedResult<PaymentOrderDTO>> {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.status) params.set('status', query.status);

  return apiRequest(`/api/v1/admin/payments?${params.toString()}`);
}

export function fetchAdminPaymentDetails(
  orderId: string,
): Promise<AdminPaymentDetailsResult> {
  return apiRequest(`/api/v1/admin/payments/${encodeURIComponent(orderId)}`);
}

export function refundAdminPayment(
  orderId: string,
  input: AdminPaymentRefundInput,
): Promise<PaymentRefundDTO> {
  return apiRequest(`/api/v1/admin/payments/${encodeURIComponent(orderId)}/refund`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function reconcileAdminPayment(
  orderId: string,
): Promise<PaymentReconciliationResult> {
  return apiRequest(`/api/v1/admin/payments/${encodeURIComponent(orderId)}/reconcile`, {
    method: 'POST',
  });
}
