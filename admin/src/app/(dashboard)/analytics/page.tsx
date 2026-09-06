'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminControlApi } from '@/lib/adminControlApi';

export default function AnalyticsHubPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'product' | 'financial' | 'ai' | 'events'>('product');
  const [eventCategory, setEventCategory] = useState<string>('all');
  const [eventOffset, setEventOffset] = useState<number>(0);

  const productQuery = useQuery({
    queryKey: ['admin', 'analytics', 'product', timeRange],
    queryFn: () => adminControlApi.getProductAnalytics(timeRange),
  });

  const financialQuery = useQuery({
    queryKey: ['admin', 'analytics', 'financial', timeRange],
    queryFn: () => adminControlApi.getFinancialAnalytics(timeRange),
  });

  const aiQuery = useQuery({
    queryKey: ['admin', 'analytics', 'ai', timeRange],
    queryFn: () => adminControlApi.getAITechnicalAnalytics(timeRange),
  });

  const eventsQuery = useQuery({
    queryKey: ['admin', 'analytics', 'events', eventCategory, eventOffset],
    queryFn: () =>
      adminControlApi.getAnalyticsEvents({
        category: eventCategory,
        limit: 15,
        offset: eventOffset,
      }),
  });

  const isLoading =
    productQuery.isLoading || financialQuery.isLoading || aiQuery.isLoading;

  const productData = productQuery.data;
  const financialData = financialQuery.data;
  const aiData = aiQuery.data;
  const eventsData = eventsQuery.data;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="analytics-hub-page">
      {/* Header & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Platform Intelligence & Analytics</h2>
          <p className="text-xs text-slate-400">
            Multi-dimensional insights across Product Growth, Unit Economics, AI Gateway and System Reliability.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner self-start sm:self-auto">
          {(['7d', '30d', '90d', '1y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeRange === r
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Category Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('product')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'product'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🚀</span> Product & Growth Funnels
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'financial'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>💳</span> Financial & Unit Economics
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🤖</span> AI Gateway & Technical Reliability
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'events'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📜</span> Diagnostic Events Log
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: PRODUCT & GROWTH ANALYTICS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'product' && productData && (
            <div className="space-y-6 animate-fade-in" data-testid="product-analytics-tab">
              {/* Product KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registrations</span>
                  <p className="text-2xl font-black text-white mt-2 font-mono">
                    {productData.activationFunnel.totalRegistrations.toLocaleString()}
                  </p>
                  <span className="text-xs text-emerald-400 mt-1 block font-medium">In selected time range</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DAU / MAU Stickiness</span>
                  <p className="text-2xl font-black text-indigo-400 mt-2 font-mono">
                    {productData.activeUsers.stickinessPercent}%
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {productData.activeUsers.dau} DAU • {productData.activeUsers.mau} MAU
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activation Rate</span>
                  <p className="text-2xl font-black text-amber-400 mt-2 font-mono">
                    {productData.activationFunnel.profileCompleted.conversionRate}%
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {productData.activationFunnel.profileCompleted.count} Birth Profiles Created
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">30-Day Churn Rate</span>
                  <p className="text-2xl font-black text-rose-400 mt-2 font-mono">
                    {productData.churn.churnRatePercent}%
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {productData.churn.churnedUsersCount} Inactive seekers
                  </span>
                </div>
              </div>

              {/* Activation Funnel Stages */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                <h3 className="text-base font-bold text-white mb-2">Seeker Activation & Conversion Funnel</h3>
                <p className="text-xs text-slate-400 mb-6">Step-by-step conversion from account creation to first purchase</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400">1. Signed Up</span>
                    <p className="text-xl font-bold text-white mt-1">{productData.activationFunnel.totalRegistrations}</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div className="bg-indigo-500 h-full w-full" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">100% baseline</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400">2. Birth Kundli Completed</span>
                    <p className="text-xl font-bold text-white mt-1">{productData.activationFunnel.profileCompleted.count}</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full"
                        style={{ width: `${Math.min(productData.activationFunnel.profileCompleted.conversionRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-cyan-400 mt-2 block">
                      {productData.activationFunnel.profileCompleted.conversionRate}% conversion
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400">3. First Chat Turn</span>
                    <p className="text-xl font-bold text-white mt-1">{productData.activationFunnel.firstChatStarted.count}</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${Math.min(productData.activationFunnel.firstChatStarted.conversionRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-amber-400 mt-2 block">
                      {productData.activationFunnel.firstChatStarted.conversionRate}% conversion
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400">4. First Purchase Paid</span>
                    <p className="text-xl font-bold text-white mt-1">{productData.activationFunnel.firstPurchaseCompleted.count}</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(productData.activationFunnel.firstPurchaseCompleted.conversionRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-2 block">
                      {productData.activationFunnel.firstPurchaseCompleted.conversionRate}% conversion
                    </span>
                  </div>
                </div>
              </div>

              {/* Cohort Retention Table */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                <h3 className="text-base font-bold text-white mb-4">Cohort Return & Retention Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="pb-3">Cohort Date</th>
                        <th className="pb-3">Seekers</th>
                        <th className="pb-3">Day 1 Return</th>
                        <th className="pb-3">Day 7 Return</th>
                        <th className="pb-3">Day 14 Return</th>
                        <th className="pb-3">Day 30 Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {productData.retentionCohorts.map((c: any) => (
                        <tr key={c.cohortDate} className="hover:bg-slate-800/40">
                          <td className="py-3 text-white font-bold">{c.cohortDate}</td>
                          <td className="py-3 text-slate-300">{c.initialUsers}</td>
                          <td className="py-3 text-emerald-400 font-bold">{c.day1Percent}%</td>
                          <td className="py-3 text-indigo-400 font-bold">{c.day7Percent}%</td>
                          <td className="py-3 text-amber-400 font-bold">{c.day14Percent}%</td>
                          <td className="py-3 text-purple-400 font-bold">{c.day30Percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FINANCIAL & UNIT ECONOMICS ANALYTICS                                */}
          {/* ========================================================================= */}
          {activeTab === 'financial' && financialData && (
            <div className="space-y-6 animate-fade-in" data-testid="financial-analytics-tab">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Merchandise Value</span>
                  <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                    ₹{(financialData.overview.gmvPaise / 100).toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Net: ₹{(financialData.overview.netRevenuePaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Revenue Per User (ARPU)</span>
                  <p className="text-2xl font-black text-indigo-400 mt-2 font-mono">
                    ₹{Math.round(financialData.unitEconomics.arpuPaise / 100)}
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    ARPPU: ₹{Math.round(financialData.unitEconomics.arppuPaise / 100)}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wallet Credits Flow</span>
                  <p className="text-2xl font-black text-amber-400 mt-2 font-mono">
                    {financialData.walletUsage.totalCreditsPurchased.toLocaleString()}
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {financialData.walletUsage.totalCreditsConsumed.toLocaleString()} consumed
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid Orders Count</span>
                  <p className="text-2xl font-black text-purple-400 mt-2 font-mono">
                    {financialData.overview.totalPaidOrders}
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    AOV: ₹{Math.round(financialData.unitEconomics.averageOrderValuePaise / 100)}
                  </span>
                </div>
              </div>

              {/* Service Breakdown & Voice Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <h3 className="text-base font-bold text-white mb-4">Revenue Breakdown by Service Category</h3>
                  <div className="space-y-4">
                    {financialData.serviceBreakdown.map((s: any) => (
                      <div key={s.service} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-white capitalize">{s.service.replace('_', ' ')}</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            ₹{(s.revenuePaise / 100).toLocaleString('en-IN')} ({s.sharePercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${s.sharePercent}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">{s.ordersCount} transactions</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white">Live Voice Unit Economics</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Total Billed Minutes</span>
                      <span className="font-mono text-white font-bold">{financialData.voice.totalMinutesBilled} mins</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Total Calls Completed</span>
                      <span className="font-mono text-white font-bold">{financialData.voice.totalCalls}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Provider Infrastructure Cost</span>
                      <span className="font-mono text-rose-400 font-bold">₹{Math.round(financialData.voice.providerCostPaise / 100)}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Voice Gross Margin</span>
                      <span className="font-mono text-emerald-400 font-bold">{financialData.voice.grossMarginPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing & Attribution Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">🏷️ Coupons & Promotions ROI</h4>
                  <p className="text-xl font-black text-emerald-400 font-mono">
                    {financialData.marketingAttribution.promotions.roiMultiplier}x ROI
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div>Redemptions: <span className="font-bold">{financialData.marketingAttribution.promotions.redemptionsCount}</span></div>
                    <div>Discount Given: <span className="font-mono">₹{Math.round(financialData.marketingAttribution.promotions.discountCostPaise / 100)}</span></div>
                    <div>Attributed GMV: <span className="font-mono text-emerald-400 font-bold">₹{Math.round(financialData.marketingAttribution.promotions.attributedGmvPaise / 100)}</span></div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">🤝 Referral Network Growth</h4>
                  <p className="text-xl font-black text-indigo-400 font-mono">
                    {financialData.marketingAttribution.referrals.refereesClaimed} Referees
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div>Invites Dispatched: <span className="font-bold">{financialData.marketingAttribution.referrals.invitesSent}</span></div>
                    <div>Purchases Triggered: <span className="font-bold">{financialData.marketingAttribution.referrals.qualifyingPurchases}</span></div>
                    <div>Reward Credits: <span className="font-mono text-amber-400 font-bold">{financialData.marketingAttribution.referrals.rewardsIssuedCredits} cr</span></div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">🔔 Notification Engagement</h4>
                  <p className="text-xl font-black text-purple-400 font-mono">
                    {financialData.marketingAttribution.notifications.openRatePercent}% Open Rate
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div>Broadcasts Sent: <span className="font-bold">{financialData.marketingAttribution.notifications.totalSent}</span></div>
                    <div>Conversion Rate: <span className="font-bold">{financialData.marketingAttribution.notifications.conversionRatePercent}%</span></div>
                    <div>Attributed GMV: <span className="font-mono text-emerald-400 font-bold">₹{Math.round(financialData.marketingAttribution.notifications.attributedGmvPaise / 100)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: AI GATEWAY & TECHNICAL RELIABILITY                                  */}
          {/* ========================================================================= */}
          {activeTab === 'ai' && aiData && (
            <div className="space-y-6 animate-fade-in" data-testid="ai-analytics-tab">
              {/* AI KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total AI Requests</span>
                  <p className="text-2xl font-black text-white mt-2 font-mono">{aiData.overview.totalRequests.toLocaleString()}</p>
                  <span className="text-xs text-emerald-400 mt-1 block font-medium">{aiData.overview.successRatePercent}% Success rate</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tokens Processed</span>
                  <p className="text-2xl font-black text-indigo-400 mt-2 font-mono">{aiData.tokens.totalTokens.toLocaleString()}</p>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {aiData.tokens.promptTokens.toLocaleString()} prompt • {aiData.tokens.completionTokens.toLocaleString()} comp
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated AI Cost</span>
                  <p className="text-2xl font-black text-amber-400 mt-2 font-mono">
                    ₹{(aiData.cost.totalCostPaise / 100).toFixed(2)}
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">${aiData.cost.totalCostUsd.toFixed(4)} USD</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fallback Rate</span>
                  <p className="text-2xl font-black text-cyan-400 mt-2 font-mono">{aiData.reliability.fallbackRatePercent}%</p>
                  <span className="text-xs text-slate-400 mt-1 block">{aiData.reliability.fallbackCount} router fallbacks</span>
                </div>
              </div>

              {/* Latency Percentiles & Cost Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <h3 className="text-base font-bold text-white mb-4">⏱️ Gateway Latency Distribution (p50 / p95 / p99)</h3>
                  <div className="grid grid-cols-4 gap-3 text-center mb-6">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">AVG</span>
                      <span className="text-base font-mono font-bold text-white">{aiData.latencies.overall.averageMs} ms</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">P50</span>
                      <span className="text-base font-mono font-bold text-emerald-400">{aiData.latencies.overall.p50Ms} ms</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">P95</span>
                      <span className="text-base font-mono font-bold text-amber-400">{aiData.latencies.overall.p95Ms} ms</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">P99</span>
                      <span className="text-base font-mono font-bold text-rose-400">{aiData.latencies.overall.p99Ms} ms</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Latencies by Task</h4>
                  <div className="space-y-2">
                    {aiData.latencies.byTask.map((t: any) => (
                      <div key={t.task} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <span className="font-bold text-white capitalize">{t.task}</span>
                        <div className="font-mono text-slate-400 space-x-3">
                          <span>p50: <b className="text-emerald-400">{t.p50Ms}ms</b></span>
                          <span>p95: <b className="text-amber-400">{t.p95Ms}ms</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                  <h3 className="text-base font-bold text-white mb-4">🏢 Token Consumption & Cost by Provider</h3>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="pb-3">Provider</th>
                        <th className="pb-3">Requests</th>
                        <th className="pb-3">Tokens</th>
                        <th className="pb-3">Cost (USD)</th>
                        <th className="pb-3">Cost (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {aiData.cost.costByProvider.map((p: any) => (
                        <tr key={p.provider} className="hover:bg-slate-800/40">
                          <td className="py-3 font-bold text-white capitalize">{p.provider}</td>
                          <td className="py-3 text-slate-300">{p.requests}</td>
                          <td className="py-3 text-slate-300">{p.totalTokens.toLocaleString()}</td>
                          <td className="py-3 text-amber-400">${p.costUsd}</td>
                          <td className="py-3 font-bold text-emerald-400">₹{(p.costPaise / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {aiData.reliability.failuresByCategory.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Error Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiData.reliability.failuresByCategory.map((f: any) => (
                          <span key={f.category} className="px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-xs font-mono">
                            {f.category}: {f.count} ({f.percentage}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DIAGNOSTIC EVENT LOGS (PRIVACY SAFE)                                */}
          {/* ========================================================================= */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-fade-in" data-testid="events-tab">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'product', 'financial', 'ai_gateway', 'notification', 'system'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setEventCategory(cat);
                        setEventOffset(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                        eventCategory === cat
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Showing {eventsData?.items.length || 0} of {eventsData?.total || 0} diagnostic records
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="pb-3">Timestamp</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Event Name</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3">Entity Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {eventsData?.items.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-800/40">
                          <td className="py-3 text-slate-400">{new Date(e.createdAt).toLocaleTimeString()}</td>
                          <td className="py-3 font-semibold text-slate-300 uppercase text-[10px]">{e.category}</td>
                          <td className="py-3 font-bold text-white">{e.eventName}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                e.status === 'success'
                                  ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                                  : e.status === 'warning'
                                  ? 'bg-amber-950 border-amber-800 text-amber-300'
                                  : 'bg-rose-950 border-rose-800 text-rose-300'
                              }`}
                            >
                              {e.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{e.durationMs ? `${e.durationMs}ms` : '—'}</td>
                          <td className="py-3 text-indigo-400 truncate max-w-[120px]">{e.entityId || '—'}</td>
                        </tr>
                      ))}
                      {(!eventsData || eventsData.items.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No diagnostic system events found for this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {eventsData && eventsData.total > 15 && (
                  <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                    <button
                      disabled={eventOffset === 0}
                      onClick={() => setEventOffset((prev) => Math.max(0, prev - 15))}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold transition"
                    >
                      ← Previous
                    </button>
                    <span className="text-slate-400 font-mono">
                      Page {Math.floor(eventOffset / 15) + 1} of {Math.ceil(eventsData.total / 15)}
                    </span>
                    <button
                      disabled={eventOffset + 15 >= eventsData.total}
                      onClick={() => setEventOffset((prev) => prev + 15)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold transition"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
