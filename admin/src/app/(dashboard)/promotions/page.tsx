'use client';

import {
  CreatePromotionInput,
  PromotionAnalyticsDTO,
  PromotionAudienceSegment,
  PromotionDiscountType,
  PromotionDTO,
  PromotionStatus,
  PromotionTarget,
  PromotionType,
  ReferralRecordDTO,
} from '@astroai/shared-types';
import { useEffect, useState } from 'react';
import { adminPromotionsApi } from '../../../lib/adminPromotionsApi';

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'promos' | 'referrals' | 'analytics'>('promos');
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecordDTO[]>([]);
  const [analytics, setAnalytics] = useState<PromotionAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePromotionInput>({
    code: '',
    name: '',
    description: '',
    type: PromotionType.PROMO_CODE,
    discountType: PromotionDiscountType.PERCENTAGE,
    discountValue: 20,
    target: PromotionTarget.ALL,
    targetIds: [],
    audienceSegment: PromotionAudienceSegment.ALL_USERS,
    rules: {
      minPurchaseAmount: 0,
      maxDiscountAmount: null,
      totalUsageLimit: null,
      perUserLimit: 1,
      newUserOnly: false,
      existingUserOnly: false,
    },
    isActive: true,
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [promosRes, analyticsRes, referralsRes] = await Promise.all([
        adminPromotionsApi.listPromotions(),
        adminPromotionsApi.getAnalytics(),
        adminPromotionsApi.listReferrals(),
      ]);
      setPromotions(promosRes.items);
      setAnalytics(analyticsRes);
      setReferrals(referralsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load promotions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminPromotionsApi.createPromotion(createForm);
      setShowCreateModal(false);
      setCreateForm({
        code: '',
        name: '',
        description: '',
        type: PromotionType.PROMO_CODE,
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 20,
        target: PromotionTarget.ALL,
        targetIds: [],
        audienceSegment: PromotionAudienceSegment.ALL_USERS,
        rules: {
          minPurchaseAmount: 0,
          maxDiscountAmount: null,
          totalUsageLimit: null,
          perUserLimit: 1,
          newUserOnly: false,
          existingUserOnly: false,
        },
        isActive: true,
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create promotion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (promo: PromotionDTO) => {
    try {
      const nextStatus =
        promo.status === PromotionStatus.ACTIVE
          ? PromotionStatus.PAUSED
          : PromotionStatus.ACTIVE;
      await adminPromotionsApi.updateStatus(promo.id, nextStatus);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update promotion status');
    }
  };

  const filteredPromos = promotions.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🎁 Marketing & Promotions</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage promo codes, welcome offers, referral rewards, and track ROI without manipulative marketing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold rounded-lg text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>+ Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-300 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Redemptions</span>
          <div className="mt-2 text-2xl font-bold text-white">
            {analytics?.totalRedemptions.toLocaleString() || 0}
          </div>
          <div className="mt-1 text-xs text-amber-400/90 font-medium">Platform wide</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Gross Revenue</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            ₹{(((analytics?.totalGrossRevenue || 0) / 100)).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-medium">Influenced by offers</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Discount Cost</span>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            ₹{(((analytics?.totalDiscountCost || 0) / 100)).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-medium">Discounts & bonuses</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Campaign ROI</span>
          <div className="mt-2 text-2xl font-bold text-cyan-400">
            {analytics?.overallROI ? `${analytics.overallROI}x` : '—'}
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-medium">Net revenue / cost</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Conversion Rate</span>
          <div className="mt-2 text-2xl font-bold text-indigo-400">
            {analytics?.conversionRate ? `${analytics.conversionRate}%` : '—'}
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-medium">Redemptions / views</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('promos')}
          className={`pb-3 transition-colors ${
            activeTab === 'promos'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🏷️ Promo Codes & Coupons ({promotions.length})
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`pb-3 transition-colors ${
            activeTab === 'referrals'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          👥 Referral Program ({referrals.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors ${
            activeTab === 'analytics'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          📊 Campaign ROI & Analytics
        </button>
      </div>

      {/* Tab 1: Promo Codes & Coupons */}
      {activeTab === 'promos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-xs uppercase font-medium text-zinc-400">
                  <tr>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Name & Type</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Target & Audience</th>
                    <th className="py-3.5 px-4">Usage / Limits</th>
                    <th className="py-3.5 px-4">Revenue</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">
                        Loading promotions...
                      </td>
                    </tr>
                  ) : filteredPromos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">
                        No promotions found.
                      </td>
                    </tr>
                  ) : (
                    filteredPromos.map((promo) => (
                      <tr key={promo.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          {promo.code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white">{promo.name}</div>
                          <div className="text-xs text-zinc-500 uppercase">{promo.type}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-emerald-400">
                            {promo.discountType === 'percentage'
                              ? `${promo.discountValue}% OFF`
                              : promo.discountType === 'credit_bonus'
                                ? `+${promo.discountValue} Credits`
                                : `₹${(promo.discountValue / 100).toFixed(0)} OFF`}
                          </span>
                          {promo.rules.maxDiscountAmount && (
                            <div className="text-xs text-zinc-500">
                              Cap: ₹{(promo.rules.maxDiscountAmount / 100).toFixed(0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="text-zinc-300">{promo.target.toUpperCase()}</div>
                          <div className="text-zinc-500">{promo.audienceSegment.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-white">
                            {promo.stats.redemptions}{' '}
                            {promo.rules.totalUsageLimit ? `/ ${promo.rules.totalUsageLimit}` : '(No limit)'}
                          </div>
                          <div className="text-zinc-500">{promo.rules.perUserLimit}/user limit</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          ₹{((promo.stats.revenueGenerated / 100)).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              promo.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : promo.status === 'paused'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {promo.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(promo)}
                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-md transition-colors"
                          >
                            {promo.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Referral Program */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">🤝 Cosmic Referrals Overview</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Referrer earns <span className="text-amber-400 font-semibold">25 credits</span> on friend's first purchase. Referee gets <span className="text-amber-400 font-semibold">25 credits</span> welcome bonus.
              </p>
            </div>
            <div className="flex gap-4 text-sm font-semibold">
              <div className="px-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                <span className="text-xs text-zinc-400 block font-normal">Total Referrals</span>
                <span className="text-white">{referrals.length}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-emerald-400/80 block font-normal">Rewarded</span>
                <span className="text-emerald-400">{referrals.filter((r) => r.status === 'rewarded').length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-xs uppercase font-medium text-zinc-400">
                  <tr>
                    <th className="py-3.5 px-4">Referrer Code</th>
                    <th className="py-3.5 px-4">Referrer User ID</th>
                    <th className="py-3.5 px-4">Referee User ID</th>
                    <th className="py-3.5 px-4">Rewards</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Abuse Signals</th>
                    <th className="py-3.5 px-4 text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No referral records found.
                      </td>
                    </tr>
                  ) : (
                    referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                          {ref.referrerCode}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">
                          {ref.referrerId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">
                          {ref.refereeId}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-emerald-400">
                          +{ref.referrerRewardCredits} Credits
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              ref.status === 'rewarded'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : ref.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {ref.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {ref.abuseSignals && ref.abuseSignals.length > 0 ? (
                            <span className="text-rose-400 font-semibold">{ref.abuseSignals.join(', ')}</span>
                          ) : (
                            <span className="text-zinc-500">None ✅</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-500 text-right">
                          {new Date(ref.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Analytics & ROI */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5">
            <h3 className="text-base font-semibold text-white mb-4">🏆 Top Performing Promotions & ROI</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-xs uppercase font-medium text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Gross Revenue</th>
                    <th className="py-3 px-4">Discount Cost</th>
                    <th className="py-3 px-4">Net Contribution</th>
                    <th className="py-3 px-4 text-right">ROI Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {!analytics || analytics.topPromotions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-500">
                        No campaign redemptions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    analytics.topPromotions.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{item.code}</td>
                        <td className="py-3 px-4 text-white">{item.name}</td>
                        <td className="py-3 px-4">{item.redemptions}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">
                          ₹{((item.revenueGenerated / 100)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-rose-400 font-semibold">
                          ₹{((item.discountCost / 100)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          ₹{(((item.revenueGenerated - item.discountCost) / 100)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-cyan-400">
                          {item.roi}x
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Promo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">Create New Promotional Offer</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.code}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. FESTIVAL25"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono uppercase focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Offer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Diwali Cosmic Blessings"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Description (Ethical & Non-Manipulative)
                </label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Empowering and uplifting description of cosmic guidance"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Campaign Type
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, type: e.target.value as PromotionType })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  >
                    <option value={PromotionType.PROMO_CODE}>Promo Code</option>
                    <option value={PromotionType.COUPON}>Coupon</option>
                    <option value={PromotionType.WELCOME_OFFER}>Welcome Offer</option>
                    <option value={PromotionType.FIRST_PURCHASE_OFFER}>First Purchase</option>
                    <option value={PromotionType.SEASONAL_CAMPAIGN}>Seasonal Campaign</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Discount Type
                  </label>
                  <select
                    value={createForm.discountType}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        discountType: e.target.value as PromotionDiscountType,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  >
                    <option value={PromotionDiscountType.PERCENTAGE}>Percentage (%)</option>
                    <option value={PromotionDiscountType.FIXED_AMOUNT}>Fixed Amount (₹)</option>
                    <option value={PromotionDiscountType.CREDIT_BONUS}>Bonus Credits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Value {createForm.discountType === 'percentage' ? '(%)' : createForm.discountType === 'credit_bonus' ? '(Credits)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createForm.discountValue}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        discountValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Applicable Target
                  </label>
                  <select
                    value={createForm.target}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, target: e.target.value as PromotionTarget })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  >
                    <option value={PromotionTarget.ALL}>All Services & Packs</option>
                    <option value={PromotionTarget.CREDIT_PACK}>Credit Packs Only</option>
                    <option value={PromotionTarget.REPORT}>Astrology Reports</option>
                    <option value={PromotionTarget.VOICE_SESSION}>Voice Sessions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Audience Segment
                  </label>
                  <select
                    value={createForm.audienceSegment}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        audienceSegment: e.target.value as PromotionAudienceSegment,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  >
                    <option value={PromotionAudienceSegment.ALL_USERS}>All Seekers</option>
                    <option value={PromotionAudienceSegment.NEW_USERS_ONLY}>New Seekers Only</option>
                    <option value={PromotionAudienceSegment.EXISTING_USERS_ONLY}>Existing Members</option>
                    <option value={PromotionAudienceSegment.INACTIVE_USERS}>Inactive Seekers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Min Purchase (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={(createForm.rules.minPurchaseAmount / 100).toFixed(0)}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        rules: {
                          ...createForm.rules,
                          minPurchaseAmount: Number(e.target.value) * 100,
                        },
                      })
                    }
                    placeholder="0 for none"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      createForm.rules.maxDiscountAmount
                        ? (createForm.rules.maxDiscountAmount / 100).toFixed(0)
                        : ''
                    }
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        rules: {
                          ...createForm.rules,
                          maxDiscountAmount: e.target.value ? Number(e.target.value) * 100 : null,
                        },
                      })
                    }
                    placeholder="Optional cap"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={createForm.rules.newUserOnly}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        rules: { ...createForm.rules, newUserOnly: e.target.checked },
                      })
                    }
                    className="rounded bg-zinc-950 border-zinc-800 text-amber-500"
                  />
                  New Users Only
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={createForm.isActive}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, isActive: e.target.checked })
                    }
                    className="rounded bg-zinc-950 border-zinc-800 text-amber-500"
                  />
                  Activate Immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold text-sm rounded-lg shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
