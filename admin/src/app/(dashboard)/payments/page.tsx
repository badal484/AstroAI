'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminPermission,
  PaymentOrderStatus,
  type AdminPaymentRefundInput,
  type PaymentOrderDTO,
} from '@astroai/shared-types';
import { Button } from '@/components/ui/button';
import { isForbidden } from '@/lib/apiError';
import {
  fetchAdminPaymentDetails,
  listAdminPayments,
  reconcileAdminPayment,
  refundAdminPayment,
  type AdminPaymentDetailsResult,
} from '@/lib/adminPaymentsApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const canManage = useAdminAuthStore((state) =>
    state.hasPermission(AdminPermission.PAYMENTS_MANAGE),
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentOrderStatus | 'all'>('all');

  // Detail Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Refund Modal State
  const [refundOrderId, setRefundOrderId] = useState<PaymentOrderDTO | null>(null);
  const [refundAmountRupees, setRefundAmountRupees] = useState<string>('');
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);

  // Reconcile Result State
  const [reconcileResult, setReconcileResult] = useState<{
    orderId: string;
    gatewayStatus: string;
    internalStatus: string;
    isSynced: boolean;
  } | null>(null);

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments', selectedStatus],
    queryFn: () =>
      listAdminPayments({
        limit: 50,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      }),
  });

  const detailsQuery = useQuery<AdminPaymentDetailsResult>({
    queryKey: ['admin', 'payment', selectedOrderId],
    queryFn: () => fetchAdminPaymentDetails(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const refundMutation = useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: AdminPaymentRefundInput }) =>
      refundAdminPayment(orderId, input),
    onSuccess: () => {
      setRefundOrderId(null);
      setRefundReason('');
      setRefundAmountRupees('');
      setRefundError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      if (selectedOrderId) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'payment', selectedOrderId] });
      }
    },
    onError: (err: any) => {
      setRefundError(err?.message || 'Refund processing failed');
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: (orderId: string) => reconcileAdminPayment(orderId),
    onSuccess: (data) => {
      setReconcileResult(data);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      if (selectedOrderId) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'payment', selectedOrderId] });
      }
    },
  });

  function handleOpenRefundModal(order: PaymentOrderDTO) {
    setRefundOrderId(order);
    const remainingPaise = order.amount - (order.refundedAmount || 0);
    setRefundAmountRupees((remainingPaise / 100).toFixed(2));
    setIsFullRefund(true);
    setRefundReason('');
    setRefundError(null);
  }

  function handleExecuteRefund() {
    if (!refundOrderId) return;
    if (!refundReason || refundReason.trim().length < 3) {
      setRefundError('Reason is mandatory for audit logging (min 3 chars)');
      return;
    }

    const amountInPaise = isFullRefund
      ? undefined
      : Math.round(parseFloat(refundAmountRupees || '0') * 100);

    refundMutation.mutate({
      orderId: refundOrderId.id,
      input: {
        amount: amountInPaise,
        reason: refundReason.trim(),
      },
    });
  }

  if (paymentsQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading payment records…</p>;
  }

  if (paymentsQuery.isError) {
    if (isForbidden(paymentsQuery.error)) {
      return (
        <p className="text-sm text-destructive">
          You don&apos;t have permission to view payment transactions.
        </p>
      );
    }
    return <p className="text-sm text-destructive">Failed to load payments. Please try again.</p>;
  }

  const items = paymentsQuery.data.items;
  const filteredItems = searchQuery
    ? items.filter(
        (p) =>
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.gatewayOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.userId.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  // Calculate quick metrics
  const totalRevenuePaise = items
    .filter((p) => p.status === PaymentOrderStatus.PAID || p.status === PaymentOrderStatus.PARTIALLY_REFUNDED)
    .reduce((sum, p) => sum + (p.amount - (p.refundedAmount || 0)), 0);

  const paidCount = items.filter((p) => p.status === PaymentOrderStatus.PAID).length;
  const refundCount = items.filter(
    (p) => p.status === PaymentOrderStatus.REFUNDED || p.status === PaymentOrderStatus.PARTIALLY_REFUNDED,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold">Payments & Razorpay Settlement Explorer</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authoritative gateway settlements, server verification events, webhooks, and refund management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by Order, Gateway ID, or User…"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-72"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">Net Revenue Settled</span>
          <p className="mt-1 text-2xl font-bold text-emerald-500">
            ₹{(totalRevenuePaise / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Excludes issued refunds</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">Successful Orders</span>
          <p className="mt-1 text-2xl font-bold">{paidCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Verified & wallet credited</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">Refunds Issued</span>
          <p className="mt-1 text-2xl font-bold text-amber-500">{refundCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Full and partial refunds</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">Gateway</span>
          <p className="mt-1 text-2xl font-bold">Razorpay</p>
          <p className="mt-1 text-xs text-muted-foreground">HMAC-SHA256 Authoritative</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {(
          [
            'all',
            PaymentOrderStatus.PAID,
            PaymentOrderStatus.CREATED,
            PaymentOrderStatus.PARTIALLY_REFUNDED,
            PaymentOrderStatus.REFUNDED,
            PaymentOrderStatus.FAILED,
          ] as const
        ).map((st) => (
          <button
            key={st}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              selectedStatus === st
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setSelectedStatus(st)}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Reconcile Notification */}
      {reconcileResult && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 flex items-center justify-between">
          <span>
            ✓ Reconciled Order <strong className="font-mono">{reconcileResult.orderId}</strong>: Gateway status is{' '}
            <strong className="font-mono">{reconcileResult.gatewayStatus}</strong> (Internal: {reconcileResult.internalStatus}). Synced:{' '}
            {reconcileResult.isSynced ? 'Yes' : 'No'}.
          </span>
          <button className="underline font-bold" onClick={() => setReconcileResult(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Payments Table */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold mb-4">Payment Orders ({filteredItems.length})</h2>
        {filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No payment orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 font-medium">Order ID</th>
                  <th className="py-2.5 font-medium">Gateway Order ID</th>
                  <th className="py-2.5 font-medium">User ID</th>
                  <th className="py-2.5 font-medium">Credits</th>
                  <th className="py-2.5 font-medium">Amount (₹)</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((order) => (
                  <tr key={order.id} className="border-b border-border/60 hover:bg-muted/20">
                    <td className="py-3 font-mono font-medium">{order.id}</td>
                    <td className="py-3 font-mono text-muted-foreground">{order.gatewayOrderId}</td>
                    <td className="py-3 font-mono text-muted-foreground max-w-[120px] truncate">
                      {order.userId}
                    </td>
                    <td className="py-3 font-bold text-foreground">
                      {order.totalCredits} Cr
                      {order.bonusCredits > 0 && (
                        <span className="text-[10px] text-emerald-500 ml-1">
                          (+{order.bonusCredits})
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-bold">₹{(order.amount / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                          order.status === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : order.status === 'partially_refunded'
                            ? 'bg-amber-500/15 text-amber-500'
                            : order.status === 'refunded'
                            ? 'bg-rose-500/15 text-rose-500'
                            : order.status === 'failed'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(order.paidAt ?? order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          Inspect
                        </Button>
                        {canManage &&
                          (order.status === PaymentOrderStatus.PAID ||
                            order.status === PaymentOrderStatus.PARTIALLY_REFUNDED) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRefundModal(order)}
                            >
                              Refund
                            </Button>
                          )}
                        {canManage && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reconcileMutation.isPending}
                            onClick={() => reconcileMutation.mutate(order.id)}
                          >
                            Sync
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold">Payment Details & Ledger Audit</h3>
              <button
                className="text-muted-foreground hover:text-foreground text-sm"
                onClick={() => setSelectedOrderId(null)}
              >
                ✕ Close
              </button>
            </div>

            {detailsQuery.isPending ? (
              <p className="text-sm text-muted-foreground py-6">Loading details…</p>
            ) : detailsQuery.data ? (
              <div className="flex flex-col gap-5">
                {/* Order Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded border border-border p-3 bg-muted/10">
                    <span className="text-[11px] text-muted-foreground">Order ID</span>
                    <p className="font-mono text-xs font-bold mt-1 truncate">
                      {detailsQuery.data.order.id}
                    </p>
                  </div>
                  <div className="rounded border border-border p-3 bg-muted/10">
                    <span className="text-[11px] text-muted-foreground">Status</span>
                    <p className="text-xs font-bold mt-1 uppercase text-emerald-500">
                      {detailsQuery.data.order.status}
                    </p>
                  </div>
                  <div className="rounded border border-border p-3 bg-muted/10">
                    <span className="text-[11px] text-muted-foreground">Amount</span>
                    <p className="text-xs font-bold mt-1">
                      ₹{(detailsQuery.data.order.amount / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded border border-border p-3 bg-muted/10">
                    <span className="text-[11px] text-muted-foreground">Credits Allocated</span>
                    <p className="text-xs font-bold mt-1 text-emerald-500">
                      +{detailsQuery.data.order.totalCredits} Cr
                    </p>
                  </div>
                </div>

                {/* Gateway Transactions */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    Gateway Transaction Attempts ({detailsQuery.data.transactions.length})
                  </h4>
                  {detailsQuery.data.transactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No transaction logs.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {detailsQuery.data.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="rounded border border-border p-3 bg-muted/20 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold">{tx.gatewayPaymentId}</span>
                            <span className="font-semibold uppercase text-emerald-500">{tx.status}</span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Method: {tx.method ?? 'UPI / Card'}</span>
                            <span>{new Date(tx.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Refunds History */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    Refund History ({detailsQuery.data.refunds.length})
                  </h4>
                  {detailsQuery.data.refunds.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No refunds processed for this order.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {detailsQuery.data.refunds.map((rf) => (
                        <div
                          key={rf.id}
                          className="rounded border border-border p-3 bg-rose-500/10 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-rose-500">
                              -₹{(rf.amount / 100).toFixed(2)} ({rf.status.toUpperCase()})
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(rf.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground">Reason: {rf.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Issue Refund</h3>
            <p className="text-xs text-muted-foreground">
              Refund payment for order <span className="font-mono font-bold">{refundOrderId.id}</span>.
              Corresponding credits will be debited from the user wallet automatically.
            </p>

            {refundError && (
              <div className="rounded bg-destructive/15 p-2.5 text-xs text-destructive">
                {refundError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Refund Type</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded py-1.5 text-xs font-semibold ${
                      isFullRefund
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => {
                      setIsFullRefund(true);
                      const rem = refundOrderId.amount - (refundOrderId.refundedAmount || 0);
                      setRefundAmountRupees((rem / 100).toFixed(2));
                    }}
                  >
                    Full Refund (₹
                    {((refundOrderId.amount - (refundOrderId.refundedAmount || 0)) / 100).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded py-1.5 text-xs font-semibold ${
                      !isFullRefund
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setIsFullRefund(false)}
                  >
                    Partial Refund
                  </button>
                </div>
              </div>

              {!isFullRefund && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Amount (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    value={refundAmountRupees}
                    onChange={(e) => setRefundAmountRupees(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Audit Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  placeholder="e.g. Customer reported dissatisfaction with report generation"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefundOrderId(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={refundMutation.isPending}
                onClick={handleExecuteRefund}
              >
                {refundMutation.isPending ? 'Executing…' : 'Confirm Refund'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
