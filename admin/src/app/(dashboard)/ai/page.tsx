'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminControlApi } from '@/lib/adminControlApi';

export default function AIControlPage() {
  const [activeTab, setActiveTab] = useState<'providers' | 'routing' | 'personas' | 'prompts' | 'languages'>('providers');

  const aiQuery = useQuery({
    queryKey: ['admin', 'aiConfig'],
    queryFn: adminControlApi.getAIConfig,
  });

  const config = aiQuery.data;

  if (aiQuery.isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#D4A347] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="ai-control-page">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">AI Operations & Model Routing</h2>
        <p className="text-xs text-slate-400">
          Configure multi-provider failover chains, Acharya Vashishta persona parameters, and latency benchmarks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
        {(
          [
            { id: 'providers', label: `Providers & Health (${config.providers.length})` },
            { id: 'routing', label: 'Model Routing Matrix' },
            { id: 'personas', label: `Astrologer Personas (${config.personas.length})` },
            { id: 'prompts', label: 'System Prompts & Safeguards' },
            { id: 'languages', label: `Supported Languages (${config.languages.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 transition border-b-2 ${
              activeTab === tab.id
                ? 'border-[#D4A347] text-[#E9C16C] font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Providers & Health */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.providers.map((p) => (
            <div key={p.id} className="p-5 rounded-lg bg-[#121827] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase text-[#D4A347] font-semibold">{p.type}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono">
                  {p.healthStatus.toUpperCase()}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{p.name}</h3>
              <p className="text-xs text-slate-400 mb-3 font-mono">Provider: {p.provider}</p>

              <div className="space-y-1.5 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Latency:</span>
                  <span className="font-mono text-white font-medium">{p.latencyMs} ms</span>
                </div>
                {p.costPer1kTokensPaise && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cost / 1k Tokens:</span>
                    <span className="font-mono text-emerald-400 font-medium">₹{(p.costPer1kTokensPaise / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority Tier:</span>
                  <span className="font-mono text-[#D4A347] font-medium">Priority #{p.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Model Routing */}
      {activeTab === 'routing' && (
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
          <h3 className="text-sm font-semibold text-white mb-3">Task-Specific Model Routing & Fallback Chains</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 font-semibold">Task Domain</th>
                  <th className="pb-2.5 font-semibold">Primary Model</th>
                  <th className="pb-2.5 font-semibold">Fallback Model</th>
                  <th className="pb-2.5 font-semibold">Temperature</th>
                  <th className="pb-2.5 font-semibold">Max Tokens</th>
                  <th className="pb-2.5 font-semibold">Timeout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {config.routingRules.map((r) => (
                  <tr key={r.task} className="hover:bg-[#161D2F]">
                    <td className="py-2.5 font-mono font-medium text-white uppercase">{r.task.replace('_', ' ')}</td>
                    <td className="py-2.5 font-mono text-emerald-400 font-medium">{r.primaryModel}</td>
                    <td className="py-2.5 font-mono text-[#D4A347]">{r.fallbackModel}</td>
                    <td className="py-2.5 font-mono text-slate-300">{r.temperature}</td>
                    <td className="py-2.5 font-mono text-slate-300">{r.maxTokens}</td>
                    <td className="py-2.5 font-mono text-slate-400">{r.timeoutMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Personas */}
      {activeTab === 'personas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.personas.map((persona) => (
            <div key={persona.id} className="p-5 rounded-lg bg-[#121827] border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded bg-[#1B2236] border border-[#D4A347]/30 text-[#E9C16C] text-xs font-medium">
                  {persona.specialty}
                </span>
                <span className="text-xs text-[#D4A347] font-mono font-semibold">{persona.experienceYears} Years Exp</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{persona.name}</h3>
              <p className="text-xs text-slate-300 mb-3"><span className="text-slate-400 font-medium">Tone:</span> {persona.tone}</p>
              <div className="text-xs text-slate-400 bg-[#161D2F] p-3 rounded border border-slate-800 font-mono">
                {persona.systemPromptAdditions}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Prompts */}
      {activeTab === 'prompts' && (
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Astrologer Intelligence Safeguards & Safety Rules</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#161D2F] rounded border border-slate-800 text-slate-300 space-y-1">
              <p className="font-semibold text-[#D4A347]">Vedic Astrology Grounding Directive</p>
              <p className="text-slate-400 leading-relaxed font-mono">
                Acharya Vashishta must always ground interpretations in deterministic Dasha, Transit, and Bhava placement factors calculated by the astrology engine. No hallucinatory planetary combinations.
              </p>
            </div>
            <div className="p-3 bg-[#161D2F] rounded border border-slate-800 text-slate-300 space-y-1">
              <p className="font-semibold text-[#D4A347]">Fatalistic & Health Deflection Safeguard</p>
              <p className="text-slate-400 leading-relaxed font-mono">
                Absolute refusal to predict exact death, medical diagnoses, or definitive disastrous outcomes. Redirect seeker calmly toward remedies, karmic awareness, and medical professionals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Languages */}
      {activeTab === 'languages' && (
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
          <h3 className="text-sm font-semibold text-white mb-3">Multilingual Consultation Engine</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {config.languages.map((lang) => (
              <div key={lang.code} className="p-3 bg-[#161D2F] rounded border border-slate-800 text-xs">
                <p className="font-semibold text-white">{lang.name}</p>
                <p className="text-slate-400 font-mono text-[11px]">{lang.code.toUpperCase()} • Native script</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
