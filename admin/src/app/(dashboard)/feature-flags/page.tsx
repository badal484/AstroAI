'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FeatureFlagDTO } from '@astroai/shared-types';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { adminControlApi } from '@/lib/adminControlApi';

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlagDTO | null>(null);

  const flagsQuery = useQuery({
    queryKey: ['admin', 'featureFlags'],
    queryFn: adminControlApi.listFeatureFlags,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled, reason }: { key: string; enabled: boolean; reason: string }) =>
      adminControlApi.toggleFeatureFlag(key, enabled, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'featureFlags'], (old: FeatureFlagDTO[] | undefined) =>
        old ? old.map((f) => (f.key === data.key ? data : f)) : [data],
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'recentAuditLogs'] });
    },
  });

  const flags = flagsQuery.data || [];

  const handleToggleConfirm = async (reason: string) => {
    if (!selectedFlag) return;
    await toggleMutation.mutateAsync({
      key: selectedFlag.key,
      enabled: !selectedFlag.enabled,
      reason,
    });
    setSelectedFlag(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="feature-flags-page">
      <div>
        <h2 className="text-2xl font-black text-white">Dynamic Feature Flags & Rollouts</h2>
        <p className="text-xs text-slate-400">
          Control progressive feature releases, beta experimentation, and emergency circuit breakers across clients.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3">Flag Key</th>
                <th className="pb-3">Name & Description</th>
                <th className="pb-3">Rollout</th>
                <th className="pb-3">Target Segments</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Toggle Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {flags.map((flag) => (
                <tr key={flag.key} className="hover:bg-slate-800/40">
                  <td className="py-4 font-mono font-bold text-white">{flag.key}</td>
                  <td className="py-4 max-w-sm">
                    <p className="font-semibold text-slate-200">{flag.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{flag.description}</p>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-700">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${flag.rolloutPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-300 font-semibold">{flag.rolloutPercentage}%</span>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-slate-400">
                    {flag.targetUserSegments.join(', ') || 'All'}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        flag.enabled
                          ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                          : 'bg-slate-950 border-slate-700 text-slate-400'
                      }`}
                    >
                      {flag.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setSelectedFlag(flag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        flag.enabled
                          ? 'bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300'
                          : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                      }`}
                    >
                      {flag.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedFlag && (
        <ConfirmActionModal
          isOpen={!!selectedFlag}
          title={`${selectedFlag.enabled ? 'Disable' : 'Enable'} Feature Flag "${selectedFlag.name}"`}
          description={`Toggling this flag will immediately change availability for ${selectedFlag.rolloutPercentage}% of users in production.`}
          riskLevel={selectedFlag.enabled ? 'warning' : 'financial'}
          confirmText={selectedFlag.enabled ? 'Disable Flag' : 'Enable Flag'}
          onConfirm={handleToggleConfirm}
          onClose={() => setSelectedFlag(null)}
        />
      )}
    </div>
  );
}
