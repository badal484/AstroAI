'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AuditLogDTO } from '@astroai/shared-types';
import { adminControlApi } from '@/lib/adminControlApi';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [inspectLog, setInspectLog] = useState<AuditLogDTO | null>(null);

  const auditQuery = useQuery({
    queryKey: ['admin', 'auditLogs', search, selectedAction],
    queryFn: () =>
      adminControlApi.listAuditLogs({
        search: search.trim() || undefined,
        action: selectedAction || undefined,
        limit: 100,
      }),
  });

  const logs = auditQuery.data || [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="audit-logs-page">
      <div>
        <h2 className="text-2xl font-black text-white">Tamper-Evident Governance Audit Trail</h2>
        <p className="text-xs text-slate-400">
          Immutable forensic log of all administrative actions, financial interventions, and configuration updates.
        </p>
      </div>

      {/* Search & Action Filter */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by admin email, target ID, or reason keyword..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
        />
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Actions</option>
          <option value="user.suspend">user.suspend</option>
          <option value="user.activate">user.activate</option>
          <option value="wallet.credit_adjust">wallet.credit_adjust</option>
          <option value="wallet.debit_adjust">wallet.debit_adjust</option>
          <option value="feature_flag.toggle">feature_flag.toggle</option>
          <option value="astrology.config_update">astrology.config_update</option>
          <option value="system.maintenance_mode_toggle">system.maintenance_mode_toggle</option>
          <option value="support.ticket_resolve">support.ticket_resolve</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Admin</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Target Resource</th>
                <th className="pb-3">Mandatory Reason</th>
                <th className="pb-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold text-white">{log.adminName}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-mono">
                        {log.adminRole}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-indigo-400">{log.action}</td>
                    <td className="py-3 text-slate-300 font-mono">
                      {log.targetType}:{log.targetId.slice(0, 10)}...
                    </td>
                    <td className="py-3 text-slate-300 max-w-xs truncate">{log.reason}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-[11px] font-medium transition"
                      >
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Audit Event Details</h3>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Action:</span>
                <span className="font-mono text-indigo-400 font-bold">{inspectLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Admin User:</span>
                <span className="text-white">{inspectLog.adminName} ({inspectLog.adminEmail})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">IP & User Agent:</span>
                <span className="font-mono text-slate-300">{inspectLog.ipAddress || 'Internal'}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-400 block mb-1">Administrative Reason:</span>
                <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                  {inspectLog.reason}
                </p>
              </div>

              {inspectLog.afterState && (
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">State Payload / Changes:</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(inspectLog.afterState, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
