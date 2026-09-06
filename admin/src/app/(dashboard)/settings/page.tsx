'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminPermission, AdminRole } from '@astroai/shared-types';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { adminControlApi } from '@/lib/adminControlApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAdminAuthStore();

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceMessage] = useState('AstroAI is currently undergoing scheduled celestial alignment maintenance.');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>(AdminRole.SUPPORT);
  const [inviteReason, setInviteReason] = useState('');

  const settingsQuery = useQuery({
    queryKey: ['admin', 'systemSettings'],
    queryFn: adminControlApi.getSystemSettings,
  });

  const adminUsersQuery = useQuery({
    queryKey: ['admin', 'adminUsersList'],
    queryFn: adminControlApi.listAdminUsers,
    enabled: hasPermission(AdminPermission.ADMIN_USERS_MANAGE),
  });

  const maintenanceMutation = useMutation({
    mutationFn: ({ enabled, message, reason }: { enabled: boolean; message: string; reason: string }) =>
      adminControlApi.toggleMaintenanceMode(enabled, message, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'systemSettings'], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'recentAuditLogs'] });
      setIsMaintenanceModalOpen(false);
    },
  });

  const inviteAdminMutation = useMutation({
    mutationFn: (data: { email: string; name: string; role: string; reason: string }) =>
      adminControlApi.createAdminUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recentAuditLogs'] });
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteReason('');
    },
  });

  const settings = settingsQuery.data;
  const adminUsers = adminUsersQuery.data || [];

  if (settingsQuery.isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleMaintenanceConfirm = async (reason: string) => {
    await maintenanceMutation.mutateAsync({
      enabled: !settings.maintenance.enabled,
      message: maintenanceMessage,
      reason,
    });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !inviteReason) return;
    await inviteAdminMutation.mutateAsync({
      email: inviteEmail,
      name: inviteName,
      role: inviteRole,
      reason: inviteReason,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in" data-testid="system-settings-page">
      <div>
        <h2 className="text-2xl font-black text-white">System Settings & Platform Governance</h2>
        <p className="text-xs text-slate-400">
          Configure emergency maintenance mode, global rate limit policies, and administrative account RBAC.
        </p>
      </div>

      {/* Emergency Maintenance Mode */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${settings.maintenance.enabled ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              <h3 className="text-base font-bold text-white">
                Platform Maintenance Mode: {settings.maintenance.enabled ? 'ACTIVE (LOCKED)' : 'INACTIVE (ONLINE)'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              When active, all public API calls and mobile clients receive a 503 Service Unavailable banner with custom message.
            </p>
          </div>

          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
              settings.maintenance.enabled
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30'
            }`}
          >
            {settings.maintenance.enabled ? 'Deactivate Maintenance Mode' : 'Activate Maintenance Mode'}
          </button>
        </div>

        {settings.maintenance.enabled && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
            <strong>Active Notice:</strong> {settings.maintenance.message}
          </div>
        )}
      </div>

      {/* Global Rate Limits & Security Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-3">Global Rate Limiting Policies</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Public Endpoints</span>
              <span className="font-mono text-white font-bold">{settings.globalRateLimits.publicApiRequestsPerMin} req/min</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Auth & Login Endpoints</span>
              <span className="font-mono text-white font-bold">{settings.globalRateLimits.authRequestsPerMin} req/min</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Chat & Astrology Stream</span>
              <span className="font-mono text-white font-bold">{settings.globalRateLimits.chatRequestsPerMin} req/min</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Live Voice Turn Pipeline</span>
              <span className="font-mono text-white font-bold">{settings.globalRateLimits.voiceTurnsPerMin} turns/min</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-3">Security & Session Governance</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Admin Session TTL</span>
              <span className="font-mono text-white font-bold">{settings.security.sessionTimeoutMinutes} minutes</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Max Failed Logins Before Lockout</span>
              <span className="font-mono text-white font-bold">{settings.security.maxLoginAttempts} attempts</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Admin Token Transport</span>
              <span className="font-mono text-emerald-400 font-bold">httpOnly Secure Cookie</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Accounts (RBAC) */}
      {hasPermission(AdminPermission.ADMIN_USERS_MANAGE) && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Administrative Accounts & RBAC Roles</h3>
              <p className="text-xs text-slate-400">Manage internal staff permissions and credentials</p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition shadow-md"
            >
              + Invite Admin User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {adminUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-white">{u.name}</td>
                    <td className="py-3 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-mono">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Mode Confirmation Modal */}
      <ConfirmActionModal
        isOpen={isMaintenanceModalOpen}
        title={`${settings.maintenance.enabled ? 'Deactivate' : 'Activate'} Maintenance Mode`}
        description={
          settings.maintenance.enabled
            ? 'Deactivating maintenance mode will restore normal seeker traffic and transactions.'
            : 'Activating maintenance mode will immediately lock all seeker sessions and display a maintenance notice.'
        }
        riskLevel="danger"
        confirmText={settings.maintenance.enabled ? 'Deactivate Mode' : 'Activate Mode'}
        onConfirm={handleMaintenanceConfirm}
        onClose={() => setIsMaintenanceModalOpen(false)}
      />

      {/* Invite Admin Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Invite New Administrator</h3>
            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@astroai.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Administrative Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value={AdminRole.OPERATIONS}>Operations</option>
                  <option value={AdminRole.FINANCE}>Finance</option>
                  <option value={AdminRole.MARKETING}>Marketing</option>
                  <option value={AdminRole.SUPPORT}>Support</option>
                  <option value={AdminRole.CONTENT}>Content</option>
                  <option value={AdminRole.AI_MANAGER}>AI Manager</option>
                  <option value={AdminRole.ANALYST}>Analyst</option>
                  <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Audit Justification</label>
                <textarea
                  rows={2}
                  required
                  value={inviteReason}
                  onChange={(e) => setInviteReason(e.target.value)}
                  placeholder="Reason for onboarding this admin staff member..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteAdminMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white shadow-md"
                >
                  {inviteAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
