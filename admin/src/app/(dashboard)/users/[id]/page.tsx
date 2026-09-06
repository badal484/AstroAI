'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AccountStatus, AdminPermission, UserActionInput } from '@astroai/shared-types';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { adminControlApi } from '@/lib/adminControlApi';
import { maskEmail } from '@/lib/maskData';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function User360DetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAdminAuthStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'orders' | 'reports' | 'voice'>('overview');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    riskLevel: 'danger' | 'warning' | 'financial';
    confirmText: string;
    action: 'suspend' | 'activate' | 'delete' | 'adjust_wallet';
    amountCredits?: number;
  }>({
    isOpen: false,
    title: '',
    description: '',
    riskLevel: 'warning',
    confirmText: 'Confirm',
    action: 'suspend',
  });

  const [adjustAmountInput, setAdjustAmountInput] = useState<string>('50');

  const userQuery = useQuery({
    queryKey: ['admin', 'user360', params.id],
    queryFn: () => adminControlApi.getUser360(params.id),
  });

  const actionMutation = useMutation({
    mutationFn: (input: UserActionInput) => adminControlApi.executeUserAction(params.id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'user360', params.id], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recentAuditLogs'] });
    },
  });

  const user360 = userQuery.data;
  const hasPiiAccess = hasPermission(AdminPermission.ADMIN_USERS_MANAGE) || hasPermission(AdminPermission.USERS_MANAGE);

  if (userQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user360) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Seeker not found.</p>
        <Link href="/users" className="text-indigo-400 mt-2 inline-block font-semibold">
          ← Back to Users
        </Link>
      </div>
    );
  }

  const { user, birthProfile, wallet, stats, recentTransactions, recentOrders, recentReports, recentVoiceSessions } =
    user360;

  const statusBadge =
    user.status === AccountStatus.ACTIVE
      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
      : user.status === AccountStatus.SUSPENDED
        ? 'bg-amber-950 text-amber-400 border-amber-800'
        : 'bg-red-950 text-red-400 border-red-800';

  const handleActionConfirm = async (reason: string) => {
    await actionMutation.mutateAsync({
      action: modalConfig.action,
      reason,
      amountCredits: modalConfig.amountCredits,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="user-360-page">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/users')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            ←
          </button>
          <div>
            <h2 className="text-2xl font-black text-white">{user.name || 'Unnamed Seeker'}</h2>
            <p className="text-xs font-mono text-slate-400">ID: {user.id}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {user.status === AccountStatus.ACTIVE ? (
            <button
              onClick={() =>
                setModalConfig({
                  isOpen: true,
                  title: 'Suspend Seeker Account',
                  description:
                    'Suspending this account will immediately revoke all active sessions and block token authentication.',
                  riskLevel: 'warning',
                  confirmText: 'Suspend Account',
                  action: 'suspend',
                })
              }
              className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-xs font-semibold text-amber-300 transition"
            >
              Suspend Account
            </button>
          ) : user.status === AccountStatus.SUSPENDED ? (
            <button
              onClick={() =>
                setModalConfig({
                  isOpen: true,
                  title: 'Reactivate Seeker Account',
                  description: 'Reactivating this account restores login privileges and wallet access.',
                  riskLevel: 'warning',
                  confirmText: 'Reactivate Account',
                  action: 'activate',
                })
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-xs font-semibold text-emerald-300 transition"
            >
              Reactivate Account
            </button>
          ) : null}

          <button
            onClick={() =>
              setModalConfig({
                isOpen: true,
                title: 'Delete Seeker Account',
                description:
                  'Permanently mark account as deleted (soft delete). Seeker will no longer be able to log in.',
                riskLevel: 'danger',
                confirmText: 'Delete Account',
                action: 'delete',
              })
            }
            className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-xs font-semibold text-red-300 transition"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Seeker Profile Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Status</span>
          <div className="mt-1 flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge}`}>
              {user.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
          <p className="mt-1 text-sm font-medium text-white truncate">
            {maskEmail(user.email, hasPiiAccess)}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wallet Balance</span>
          <p className="mt-1 text-base font-black text-amber-400 font-mono">
            {wallet.availableBalance} Credits
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joined Platform</span>
          <p className="mt-1 text-sm text-slate-300 font-mono">
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        {(
          [
            { id: 'overview', label: 'Overview & Kundli' },
            { id: 'wallet', label: 'Wallet & Ledger' },
            { id: 'orders', label: `Orders (${recentOrders.length})` },
            { id: 'reports', label: `Reports (${recentReports.length})` },
            { id: 'voice', label: `Voice Sessions (${recentVoiceSessions.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 transition border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Kundli */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <h3 className="text-base font-bold text-white mb-4">Primary Birth Profile (Kundli)</h3>
            {birthProfile ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Full Name</span>
                  <span className="text-white font-medium">{birthProfile.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Date of Birth</span>
                  <span className="text-white font-mono">{birthProfile.dateOfBirth}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Time of Birth</span>
                  <span className="text-white font-mono">{birthProfile.timeOfBirth}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Place of Birth</span>
                  <span className="text-white">{birthProfile.placeOfBirth.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Coordinates & Timezone</span>
                  <span className="text-slate-300 font-mono">
                    {birthProfile.placeOfBirth.latitude.toFixed(2)}°, {birthProfile.placeOfBirth.longitude.toFixed(2)}° ({birthProfile.placeOfBirth.timezone})
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No birth profile registered yet.</p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <h3 className="text-base font-bold text-white mb-4">Seeker Engagement Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Total Spent</span>
                <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                  ₹{(stats.totalSpentPaise / 100).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Paid Orders</span>
                <p className="text-lg font-bold text-white mt-1 font-mono">{stats.totalOrders}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Reports Completed</span>
                <p className="text-lg font-bold text-white mt-1 font-mono">{stats.totalReports}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Voice Minutes</span>
                <p className="text-lg font-bold text-white mt-1 font-mono">{stats.totalVoiceMinutes} mins</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Wallet & Ledger */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Manual Balance Adjustment</h3>
              <p className="text-xs text-slate-400">Credit or debit wallet balance with administrative audit logging</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={adjustAmountInput}
                onChange={(e) => setAdjustAmountInput(e.target.value)}
                placeholder="Credits"
                className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
              <button
                onClick={() => {
                  const amt = parseInt(adjustAmountInput, 10);
                  if (!amt || amt <= 0) return;
                  setModalConfig({
                    isOpen: true,
                    title: `Credit ${amt} Credits to User`,
                    description: `This will immediately add ${amt} credits to the seeker's available balance.`,
                    riskLevel: 'financial',
                    confirmText: 'Add Credits',
                    action: 'adjust_wallet',
                    amountCredits: amt,
                  });
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition"
              >
                + Credit Balance
              </button>
              <button
                onClick={() => {
                  const amt = parseInt(adjustAmountInput, 10);
                  if (!amt || amt <= 0) return;
                  setModalConfig({
                    isOpen: true,
                    title: `Debit ${amt} Credits from User`,
                    description: `This will deduct ${amt} credits from the seeker's balance.`,
                    riskLevel: 'financial',
                    confirmText: 'Deduct Credits',
                    action: 'adjust_wallet',
                    amountCredits: -amt,
                  });
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-semibold text-white transition"
              >
                - Debit Balance
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <h3 className="text-base font-bold text-white mb-4">Recent Wallet Ledger Entries</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Balance After</th>
                  <th className="pb-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="py-3 font-mono uppercase">{tx.type}</td>
                    <td className={`py-3 font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="py-3 font-mono text-slate-300">{tx.balanceAfter}</td>
                    <td className="py-3 text-slate-300">{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Orders */}
      {activeTab === 'orders' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-4">Payment Order History</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Credits</th>
                <th className="pb-3">Promo Code</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40">
                  <td className="py-3 font-mono text-slate-300">{o.id}</td>
                  <td className="py-3 font-mono text-emerald-400 font-bold">₹{(o.amount / 100).toFixed(2)}</td>
                  <td className="py-3 font-mono text-amber-400 font-bold">{o.credits}</td>
                  <td className="py-3 font-mono text-indigo-400">{o.promoCode || '—'}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px]">
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 font-mono">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmActionModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        riskLevel={modalConfig.riskLevel}
        confirmText={modalConfig.confirmText}
        onConfirm={handleActionConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
