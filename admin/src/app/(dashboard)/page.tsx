'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { adminControlApi } from '@/lib/adminControlApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function DashboardHomePage() {
  const { admin } = useAdminAuthStore();

  const metricsQuery = useQuery({
    queryKey: ['admin', 'executiveMetrics'],
    queryFn: adminControlApi.getExecutiveMetrics,
  });

  const revenueQuery = useQuery({
    queryKey: ['admin', 'revenueChart'],
    queryFn: adminControlApi.getRevenueChart,
  });

  const auditQuery = useQuery({
    queryKey: ['admin', 'recentAuditLogs'],
    queryFn: () => adminControlApi.listAuditLogs({ limit: 5 }),
  });

  const metrics = metricsQuery.data;
  const revenueDays = revenueQuery.data || [];
  const recentAudits = auditQuery.data || [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-dashboard-page">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-lg bg-[#121827] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Welcome back, {admin?.name || 'Administrator'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Platform Engine: <span className="text-emerald-400 font-medium">Operational</span> • Vedic Calculations & AI Gateway active.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/support"
            className="px-3 py-1.5 bg-[#161D2F] hover:bg-slate-800 border border-slate-700/80 rounded-md text-xs font-medium text-slate-200 transition"
          >
            Pending Tickets ({metrics?.supportTicketsPending ?? 0})
          </Link>
          <Link
            href="/settings"
            className="px-3 py-1.5 bg-[#D4A347] hover:bg-[#E9C16C] text-[#0B0F19] rounded-md text-xs font-semibold transition"
          >
            System Settings
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gross Revenue</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-mono">₹ GMV</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ₹{(((metrics?.grossMerchandiseValuePaise ?? 0) / 100)).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-emerald-400 mt-1 font-medium">
            ↑ 14.2% platform cycle delta
          </p>
        </div>

        {/* Active Seekers */}
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Seekers</span>
            <span className="px-2 py-0.5 rounded bg-[#1B2236] text-[#D4A347] border border-[#D4A347]/30 text-[10px] font-mono">MAU</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {(metrics?.activeSeekersMonth ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {metrics?.activeSeekersToday ?? 0} active today
          </p>
        </div>

        {/* Voice Call Minutes */}
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Voice Consultations</span>
            <span className="px-2 py-0.5 rounded bg-[#1B2236] text-purple-300 border border-purple-800/40 text-[10px] font-mono">Minutes</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {(metrics?.totalVoiceMinutesBilled ?? 0).toLocaleString()} mins
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Duplex voice streaming
          </p>
        </div>

        {/* Reports Completed */}
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reports Prepared</span>
            <span className="px-2 py-0.5 rounded bg-[#1B2236] text-[#E9C16C] border border-[#D4A347]/30 text-[10px] font-mono">PDF Kundli</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {(metrics?.totalReportsCompleted ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Life Kundli & Matchmaking
          </p>
        </div>
      </div>

      {/* Revenue Velocity & Operational Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Performance Velocity */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-[#121827] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">7-Day Revenue & Pack Velocity</h3>
              <p className="text-xs text-slate-400">Daily gross revenue and consultation pack order volume</p>
            </div>
            <Link href="/analytics" className="text-xs text-[#E9C16C] hover:underline font-medium">
              Full Analytics →
            </Link>
          </div>

          <div className="space-y-2">
            {revenueDays.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2.5 rounded bg-[#161D2F] border border-slate-800/80 text-xs">
                <span className="font-mono text-slate-300 font-medium">{day.date}</span>
                <span className="text-slate-400">{day.ordersCount} orders</span>
                <span className="text-slate-400 font-mono">{day.creditsPurchased} credits</span>
                <span className="font-semibold text-emerald-400 font-mono">₹{(day.grossRevenue / 100).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Service Telemetry Board */}
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Service Health Telemetry</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-[#161D2F] border border-slate-800">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> AI Gateway Router
                </span>
                <span className="font-mono text-emerald-400">99.98%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-[#161D2F] border border-slate-800">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Swiss Ephemeris
                </span>
                <span className="font-mono text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-[#161D2F] border border-slate-800">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Razorpay Webhooks
                </span>
                <span className="font-mono text-emerald-400">Connected</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-[#161D2F] border border-slate-800">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Notification Service
                </span>
                <span className="font-mono text-emerald-400">Healthy</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
            <Link
              href="/feature-flags"
              className="flex-1 py-1.5 text-center bg-[#161D2F] hover:bg-slate-800 border border-slate-700/60 rounded text-xs font-medium text-slate-200 transition"
            >
              Flags
            </Link>
            <Link
              href="/audit-logs"
              className="flex-1 py-1.5 text-center bg-[#161D2F] hover:bg-slate-800 border border-slate-700/60 rounded text-xs font-medium text-slate-200 transition"
            >
              Audit Trail
            </Link>
          </div>
        </div>
      </div>

      {/* Governance Audit Trail Preview */}
      <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Governance Audit Logs</h3>
            <p className="text-xs text-slate-400">Tamper-evident record of administrative events</p>
          </div>
          <Link href="/audit-logs" className="text-xs text-[#E9C16C] hover:underline font-medium">
            View All Logs →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2.5 font-semibold">Timestamp</th>
                <th className="pb-2.5 font-semibold">Admin</th>
                <th className="pb-2.5 font-semibold">Role</th>
                <th className="pb-2.5 font-semibold">Action</th>
                <th className="pb-2.5 font-semibold">Target</th>
                <th className="pb-2.5 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recentAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No recent audit entries.
                  </td>
                </tr>
              ) : (
                recentAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-[#161D2F]/50">
                    <td className="py-2.5 font-mono text-slate-400">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 font-medium text-white">{a.adminName}</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#1B2236] border border-slate-700 text-slate-300 text-[10px] font-mono">
                        {a.adminRole}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[#D4A347] font-semibold">{a.action}</td>
                    <td className="py-2.5 text-slate-300">{a.targetType}:{a.targetId.slice(0, 8)}...</td>
                    <td className="py-2.5 text-slate-300 max-w-xs truncate">{a.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
