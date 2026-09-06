'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminControlApi } from '@/lib/adminControlApi';

export default function ContentCMSPage() {
  const [activeTab, setActiveTab] = useState<'horoscopes' | 'articles' | 'remedies'>('horoscopes');

  const horoscopesQuery = useQuery({
    queryKey: ['admin', 'content', 'horoscopes'],
    queryFn: adminControlApi.listHoroscopes,
  });

  const articlesQuery = useQuery({
    queryKey: ['admin', 'content', 'articles'],
    queryFn: adminControlApi.listArticles,
  });

  const remediesQuery = useQuery({
    queryKey: ['admin', 'content', 'remedies'],
    queryFn: adminControlApi.listRemedies,
  });

  const horoscopes = horoscopesQuery.data || [];
  const articles = articlesQuery.data || [];
  const remedies = remediesQuery.data || [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="content-cms-page">
      <div>
        <h2 className="text-2xl font-black text-white">Content CMS & Knowledge Base</h2>
        <p className="text-xs text-slate-400">
          Manage daily/weekly Rashiphal horoscopes, Vedic wisdom articles, and astrological remedies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        {(
          [
            { id: 'horoscopes', label: `Daily Horoscopes (${horoscopes.length})` },
            { id: 'articles', label: `Vedic Articles (${articles.length})` },
            { id: 'remedies', label: `Remedies & Gems (${remedies.length})` },
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

      {/* Tab 1: Horoscopes */}
      {activeTab === 'horoscopes' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Rashiphal Directory</h3>
            <span className="text-xs text-slate-400">Auto-synced with planetary ephemeris</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Rashi</th>
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Overview Summary</th>
                  <th className="pb-3">Lucky Props</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {horoscopes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No horoscopes currently listed.
                    </td>
                  </tr>
                ) : (
                  horoscopes.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-white">{h.rashi}</td>
                      <td className="py-3 font-mono uppercase text-indigo-400">{h.period}</td>
                      <td className="py-3 font-mono text-slate-300">{h.date}</td>
                      <td className="py-3 text-slate-300 max-w-sm truncate">{h.overview}</td>
                      <td className="py-3 text-slate-400 font-mono">
                        #{h.luckyNumber} • {h.luckyColor}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                          PUBLISHED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Articles */}
      {activeTab === 'articles' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-4">Vedic Astrology Publications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.length === 0 ? (
              <p className="text-xs text-slate-500 col-span-2">No articles published yet.</p>
            ) : (
              articles.map((art) => (
                <div key={art.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] uppercase font-bold">
                      {art.category}
                    </span>
                    <span className="text-slate-500 font-mono">{art.readingTimeMinutes} min read</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{art.title}</h4>
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{art.summary}</p>
                  <div className="flex justify-between items-center text-slate-500 text-[10px] border-t border-slate-800 pt-2">
                    <span>By {art.author}</span>
                    <span className="text-emerald-400 font-semibold">Published</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Remedies */}
      {activeTab === 'remedies' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-4">Vedic Remedy & Gemstone Catalog</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {remedies.length === 0 ? (
              <p className="text-xs text-slate-500 col-span-3">No remedies registered.</p>
            ) : (
              remedies.map((rem) => (
                <div key={rem.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] uppercase font-bold">
                    {rem.type}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2 mb-1">{rem.name}</h4>
                  <p className="text-slate-300 mb-2"><strong>Planet:</strong> {rem.deityPlanet}</p>
                  <p className="text-slate-400 text-xs mb-2"><strong>Benefit:</strong> {rem.benefits}</p>
                  <p className="text-[10px] text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/40">
                    ⚠️ {rem.caution}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
