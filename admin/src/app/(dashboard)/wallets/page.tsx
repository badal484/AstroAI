'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminPermission,
  WalletTransactionType,
  type AdminWalletAdjustmentInput,
} from '@astroai/shared-types';
import { Button } from '@/components/ui/button';
import { isForbidden } from '@/lib/apiError';
import {
  adjustAdminWallet,
  fetchAdminUserWallet,
  listAdminWallets,
  reconcileAdminWallet,
  type AdminUserWalletDetails,
  type ReconcileResult,
} from '@/lib/adminWalletApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function WalletsPage() {
  const queryClient = useQueryClient();
  const canManage = useAdminAuthStore((state) =>
    state.hasPermission(AdminPermission.WALLET_MANAGE),
  );

  const [searchUserId, setSearchUserId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<WalletTransactionType>(WalletTransactionType.CREDIT);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Reconcile Modal / Notification
  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null);

  const walletsQuery = useQuery({
    queryKey: ['admin', 'wallets'],
    queryFn: () => listAdminWallets(50),
  });

  const userWalletQuery = useQuery<AdminUserWalletDetails>({
    queryKey: ['admin', 'wallet', selectedUserId],
    queryFn: () => fetchAdminUserWallet(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const adjustMutation = useMutation({
    mutationFn: (input: AdminWalletAdjustmentInput) =>
      adjustAdminWallet(selectedUserId!, input),
    onSuccess: () => {
      setIsAdjustModalOpen(false);
      setAdjustReason('');
      setAdjustError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'wallet', selectedUserId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
    onError: (err: any) => {
      setAdjustError(err?.message || 'Adjustment failed');
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: (userId: string) => reconcileAdminWallet(userId),
    onSuccess: (data) => {
      setReconcileResult(data);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'wallet', selectedUserId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
  });

  function handleOpenAdjustModal(userId: string) {
    setSelectedUserId(userId);
    setAdjustError(null);
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  }

  function handleExecuteAdjustment() {
    if (!selectedUserId) return;
    if (!adjustReason || adjustReason.trim().length < 3) {
      setAdjustError('Reason is mandatory for audit logging (min 3 chars)');
      return;
    }
    if (!adjustAmount || adjustAmount <= 0) {
      setAdjustError('Amount must be a positive integer');
      return;
    }

    adjustMutation.mutate({
      type: adjustType as any,
      amount: adjustAmount,
      reason: adjustReason.trim(),
    });
  }

  if (walletsQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading user wallets…</p>;
  }

  if (walletsQuery.isError) {
    if (isForbidden(walletsQuery.error)) {
      return (
        <p className="text-sm text-destructive">
          You don&apos;t have permission to view wallet financial data.
        </p>
      );
    }
    return <p className="text-sm text-destructive">Failed to load wallets. Please try again.</p>;
  }

  const items = walletsQuery.data.items;
  const filteredItems = searchUserId
    ? items.filter((w) => w.userId.toLowerCase().includes(searchUserId.toLowerCase()))
    : items;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold">Wallet & Ledger Management</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Explore user balances, inspect immutable ledger audit trails, perform authorized manual adjustments, and verify mathematical integrity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by User ID…"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid: Left is Wallets List, Right is Selected User Detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User Wallets Table */}
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-1 flex flex-col gap-3">
          <h2 className="text-base font-semibold">User Wallets ({filteredItems.length})</h2>
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No wallets match your query.</p>
            ) : (
              filteredItems.map((wallet) => (
                <div
                  key={wallet.userId}
                  onClick={() => setSelectedUserId(wallet.userId)}
                  className={`cursor-pointer rounded-md border p-3 transition-colors ${
                    selectedUserId === wallet.userId
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/20 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold truncate max-w-[140px]">
                      {wallet.userId}
                    </span>
                    <span className="text-sm font-bold text-emerald-500">
                      {wallet.balance} Cr
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Avail: {wallet.availableBalance}</span>
                    <span>Held: {wallet.heldBalance}</span>
                    <span>Earned: {wallet.lifetimeEarned}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected User Detail & Ledger Audit */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          {!selectedUserId ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Select a user wallet from the list to view balance details and full immutable ledger history.
              </p>
            </div>
          ) : userWalletQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading wallet history for {selectedUserId}…</p>
          ) : userWalletQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load user wallet details.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {/* User Header & Balance Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-semibold font-mono">{selectedUserId}</h3>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(userWalletQuery.data.balance.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reconcileMutation.isPending}
                        onClick={() => reconcileMutation.mutate(selectedUserId)}
                      >
                        {reconcileMutation.isPending ? 'Verifying…' : 'Reconcile Ledger'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenAdjustModal(selectedUserId)}
                      >
                        Adjust Balance
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground">Total Balance</span>
                  <p className="text-xl font-bold mt-0.5">{userWalletQuery.data.balance.balance} Cr</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground">Available</span>
                  <p className="text-xl font-bold mt-0.5 text-emerald-500">
                    {userWalletQuery.data.balance.availableBalance} Cr
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground">Held / Reserved</span>
                  <p className="text-xl font-bold mt-0.5 text-amber-500">
                    {userWalletQuery.data.balance.heldBalance} Cr
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground">Lifetime Spent</span>
                  <p className="text-xl font-bold mt-0.5">
                    {userWalletQuery.data.balance.lifetimeSpent} Cr
                  </p>
                </div>
              </div>

              {/* Reconcile Alert Banner */}
              {reconcileResult && (
                <div
                  className={`rounded-md p-3 text-xs flex items-center justify-between ${
                    reconcileResult.reconciled
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  }`}
                >
                  <span>
                    {reconcileResult.reconciled
                      ? `✓ Ledger verified: All ${reconcileResult.transactionCount} transactions mathematically match cached balance (${reconcileResult.ledgerBalance} Cr).`
                      : `⚠ Drift corrected: Cached balance was ${reconcileResult.cachedBalance} Cr, corrected to ledger truth (${reconcileResult.ledgerBalance} Cr).`}
                  </span>
                  <button
                    className="underline text-xs font-semibold ml-2"
                    onClick={() => setReconcileResult(null)}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Transaction Ledger Table */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Immutable Transaction Ledger</h4>
                {userWalletQuery.data.transactions.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No transactions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-2 font-medium">Type</th>
                          <th className="py-2 font-medium">Amount</th>
                          <th className="py-2 font-medium">Before → After</th>
                          <th className="py-2 font-medium">Source</th>
                          <th className="py-2 font-medium">Reference</th>
                          <th className="py-2 font-medium">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userWalletQuery.data.transactions.items.map((tx) => (
                          <tr key={tx.id} className="border-b border-border/60">
                            <td className="py-2.5">
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                                  tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'promotional_credit' || tx.type === 'referral_credit'
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : tx.type === 'debit'
                                    ? 'bg-rose-500/15 text-rose-500'
                                    : 'bg-indigo-500/15 text-indigo-500'
                                }`}
                              >
                                {tx.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 font-bold">
                              {tx.type === 'debit' ? `-${tx.amount}` : `+${tx.amount}`} Cr
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {tx.balanceBefore} → {tx.balanceAfter}
                            </td>
                            <td className="py-2.5 capitalize">{tx.source}</td>
                            <td className="py-2.5 font-mono text-[11px] text-muted-foreground">
                              {tx.referenceId ?? '—'}
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Manual Balance Adjustment</h3>
            <p className="text-xs text-muted-foreground">
              Adjust balance for user <span className="font-mono font-bold text-foreground">{selectedUserId}</span>.
              This action is written directly to the immutable audit ledger.
            </p>

            {adjustError && (
              <div className="rounded bg-destructive/15 p-2.5 text-xs text-destructive">
                {adjustError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Action Type</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded py-1.5 text-xs font-semibold ${
                      adjustType === WalletTransactionType.CREDIT
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setAdjustType(WalletTransactionType.CREDIT)}
                  >
                    + Credit User
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded py-1.5 text-xs font-semibold ${
                      adjustType === WalletTransactionType.DEBIT
                        ? 'bg-rose-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setAdjustType(WalletTransactionType.DEBIT)}
                  >
                    - Debit User
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount (Credits)</label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Audit Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  placeholder="e.g. Compensation for dropped call on session #828"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={adjustMutation.isPending}
                onClick={handleExecuteAdjustment}
              >
                {adjustMutation.isPending ? 'Executing…' : 'Confirm Adjustment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
