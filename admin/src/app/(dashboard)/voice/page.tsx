'use client';

import { useEffect, useState } from 'react';
import type { VoiceSessionDTO, VoiceTurnDTO } from '@astroai/shared-types';
import {
  fetchAdminVoiceConfig,
  fetchAdminVoiceSessionDetails,
  fetchAdminVoiceSessions,
  updateAdminVoiceConfig,
} from '../../../lib/adminVoiceApi';

export default function AdminVoicePage() {
  const [sessions, setSessions] = useState<VoiceSessionDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal state
  const [inspectSessionId, setInspectSessionId] = useState<string | null>(null);
  const [inspectedSession, setInspectedSession] = useState<{
    session: VoiceSessionDTO;
    turns: VoiceTurnDTO[];
  } | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);

  // Routing config state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [routingConfig, setRoutingConfig] = useState<{ stt: string[]; tts: string[] } | null>(null);
  const [configSaving, setConfigSaving] = useState<boolean>(false);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminVoiceSessions({ status: statusFilter, limit: 50 });
      setSessions(data.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load voice sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [statusFilter]);

  const handleInspect = async (id: string) => {
    setInspectSessionId(id);
    setInspectLoading(true);
    try {
      const details = await fetchAdminVoiceSessionDetails(id);
      setInspectedSession(details);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch session details');
      setInspectSessionId(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleOpenConfig = async () => {
    setShowConfigModal(true);
    try {
      const config = await fetchAdminVoiceConfig();
      setRoutingConfig(config);
    } catch (err: any) {
      alert(err.message || 'Failed to load routing config');
    }
  };

  const handleSaveConfig = async () => {
    if (!routingConfig) return;
    setConfigSaving(true);
    try {
      await updateAdminVoiceConfig({
        sttCandidates: routingConfig.stt,
        ttsCandidates: routingConfig.tts,
      });
      alert('Voice provider routing updated successfully');
      setShowConfigModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update voice config');
    } finally {
      setConfigSaving(false);
    }
  };

  // Aggregated metrics
  const totalCalls = sessions.length;
  const totalDurationMinutes = Math.round(
    sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60,
  );
  const totalCreditsBilled = sessions.reduce((acc, s) => acc + (s.creditsCharged || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Voice Consultations & Latency
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Inspect real-time STT-LLM-TTS voice calls, financial billing holds, and provider latencies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenConfig}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-sm"
          >
            ⚙️ Provider Routing
          </button>
          <button
            onClick={loadSessions}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition shadow-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Voice Sessions</span>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalCalls}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Duration (Minutes)</span>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalDurationMinutes}m</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Credits Billed</span>
          <p className="mt-2 text-3xl font-bold text-amber-500">{totalCreditsBilled}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        {['all', 'active', 'completed', 'failed', 'interrupted'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition ${
              statusFilter === tab
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Voice Sessions Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
              <tr>
                <th className="px-5 py-3">Session ID</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Astrologer</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Billable</th>
                <th className="px-5 py-3">Credits</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Started At</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-zinc-500">
                    Loading voice sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-zinc-500">
                    No voice sessions found matching this filter.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                      {session.id.slice(-8)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">{session.userId.slice(-6)}</td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {session.astrologerId}
                    </td>
                    <td className="px-5 py-3.5">{session.durationSeconds}s</td>
                    <td className="px-5 py-3.5">{session.billableSeconds}s</td>
                    <td className="px-5 py-3.5 font-semibold text-amber-500">{session.creditsCharged}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          session.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : session.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                            : session.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleInspect(session.id)}
                        className="rounded bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Inspector Modal */}
      {inspectSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Voice Session Inspection: <span className="font-mono">{inspectSessionId}</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Audio turns, speech transcripts, financial hold settlement, and latency metrics.
                </p>
              </div>
              <button
                onClick={() => {
                  setInspectSessionId(null);
                  setInspectedSession(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {inspectLoading || !inspectedSession ? (
              <div className="py-12 text-center text-zinc-500">Loading call details & turns...</div>
            ) : (
              <div className="space-y-6">
                {/* Session Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                  <div>
                    <span className="text-zinc-500">Status</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{inspectedSession.session.status}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Duration</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{inspectedSession.session.durationSeconds}s</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Credits Charged</span>
                    <p className="font-semibold text-amber-500">{inspectedSession.session.creditsCharged}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Hold ID</span>
                    <p className="font-mono text-zinc-900 dark:text-zinc-100">{inspectedSession.session.holdId ?? 'None'}</p>
                  </div>
                </div>

                {/* Turns List */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                    Audio Turns ({inspectedSession.turns.length})
                  </h4>
                  {inspectedSession.turns.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No audio turns were exchanged in this session.</p>
                  ) : (
                    <div className="space-y-3">
                      {inspectedSession.turns.map((turn, idx) => (
                        <div
                          key={turn.id || idx}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs"
                        >
                          <div className="flex items-center justify-between text-zinc-500">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Turn #{turn.turnIndex}</span>
                            <span className="font-mono">
                              STT: {turn.latencyMs.sttMs}ms | LLM: {turn.latencyMs.llmMs}ms | TTS: {turn.latencyMs.ttsMs}ms | Total: {turn.latencyMs.totalMs}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-medium">User: </span>
                            <span className="text-zinc-900 dark:text-zinc-100">{turn.userTranscription}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-medium">Astrologer: </span>
                            <span className="text-zinc-900 dark:text-zinc-100">{turn.assistantText}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider Routing Config Modal */}
      {showConfigModal && routingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Voice Provider Routing Order
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  STT Candidate Priority
                </label>
                <input
                  type="text"
                  value={routingConfig.stt.join(', ')}
                  onChange={(e) =>
                    setRoutingConfig({
                      ...routingConfig,
                      stt: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 font-mono"
                  placeholder="openai_whisper, deepgram, mock_stt"
                />
                <p className="text-zinc-500 mt-1">Available: openai_whisper, deepgram, mock_stt</p>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  TTS Candidate Priority
                </label>
                <input
                  type="text"
                  value={routingConfig.tts.join(', ')}
                  onChange={(e) =>
                    setRoutingConfig({
                      ...routingConfig,
                      tts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 font-mono"
                  placeholder="elevenlabs, openai_tts, mock_tts"
                />
                <p className="text-zinc-500 mt-1">Available: elevenlabs, openai_tts, mock_tts</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={configSaving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500"
              >
                {configSaving ? 'Saving...' : 'Save Routing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
