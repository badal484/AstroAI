'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminPermission,
  BillingUnit,
  PricingConfigStatus,
  RoundingRule,
  type CreatePricingConfigInput,
  type CreditPack,
  type ReportItemPricing,
} from '@astroai/shared-types';
import { Button } from '@/components/ui/button';
import { isForbidden } from '@/lib/apiError';
import {
  createPricingVersion,
  fetchActivePricing,
  fetchPricingVersions,
} from '@/lib/adminPricingApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function PricingPage() {
  const queryClient = useQueryClient();
  const canManage = useAdminAuthStore((state) =>
    state.hasPermission(AdminPermission.PRICING_MANAGE),
  );

  const [activeTab, setActiveTab] = useState<'current' | 'editor' | 'history'>('current');

  const activePricingQuery = useQuery({
    queryKey: ['admin', 'pricing', 'active'],
    queryFn: fetchActivePricing,
  });

  const versionsQuery = useQuery({
    queryKey: ['admin', 'pricing', 'versions'],
    queryFn: () => fetchPricingVersions(20),
    enabled: activeTab === 'history',
  });

  // Editor State
  const [creditsPerMessage, setCreditsPerMessage] = useState<number>(1);
  const [freeDailyMessages, setFreeDailyMessages] = useState<number>(3);
  const [freeSignupMessages, setFreeSignupMessages] = useState<number>(5);
  const [freeCreditsOnSignup, setFreeCreditsOnSignup] = useState<number>(10);
  const [firstPurchaseDiscount, setFirstPurchaseDiscount] = useState<number>(20);

  const [voiceBillingUnit, setVoiceBillingUnit] = useState<BillingUnit>(BillingUnit.MINUTE);
  const [voiceCreditsPerUnit, setVoiceCreditsPerUnit] = useState<number>(5);
  const [voiceMinCharge, setVoiceMinCharge] = useState<number>(5);
  const [voiceFreeSeconds, setVoiceFreeSeconds] = useState<number>(30);
  const [voiceRoundingRule, setVoiceRoundingRule] = useState<RoundingRule>(RoundingRule.CEIL);
  const [voiceMaxDuration, setVoiceMaxDuration] = useState<number>(3600);

  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [reports, setReports] = useState<ReportItemPricing[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [publishError, setPublishError] = useState<string | null>(null);

  // Initialize editor with current active config
  function populateEditor() {
    if (!activePricingQuery.data) return;
    const cfg = activePricingQuery.data;
    setCreditsPerMessage(cfg.chat.creditsPerMessage);
    setFreeDailyMessages(cfg.chat.freeMessagesPerDay);
    setFreeSignupMessages(cfg.chat.freeMessagesOnSignup);
    setFreeCreditsOnSignup(cfg.freeCreditsOnSignup);
    setFirstPurchaseDiscount(cfg.firstPurchaseDiscountPercent);

    setVoiceBillingUnit(cfg.voice.billingUnit);
    setVoiceCreditsPerUnit(cfg.voice.creditsPerUnit);
    setVoiceMinCharge(cfg.voice.minimumChargeCredits);
    setVoiceFreeSeconds(cfg.voice.freeInitialSeconds);
    setVoiceRoundingRule(cfg.voice.roundingRule);
    setVoiceMaxDuration(cfg.voice.maxSessionDurationSeconds);

    setCreditPacks(JSON.parse(JSON.stringify(cfg.creditPacks)));
    setReports(JSON.parse(JSON.stringify(cfg.reports)));
    setNotes(`Update based on version ${cfg.version}`);
    setActiveTab('editor');
  }

  const publishMutation = useMutation({
    mutationFn: (input: CreatePricingConfigInput) => createPricingVersion(input),
    onSuccess: () => {
      setPublishError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'pricing'] });
      setActiveTab('current');
    },
    onError: (err: any) => {
      setPublishError(err?.message || 'Failed to publish new pricing version');
    },
  });

  function handlePublish() {
    setPublishError(null);
    const input: CreatePricingConfigInput = {
      status: PricingConfigStatus.ACTIVE,
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      freeCreditsOnSignup,
      firstPurchaseDiscountPercent: firstPurchaseDiscount,
      creditPacks,
      chat: {
        creditsPerMessage,
        freeMessagesPerDay: freeDailyMessages,
        freeMessagesOnSignup: freeSignupMessages,
      },
      voice: {
        billingUnit: voiceBillingUnit,
        creditsPerUnit: voiceCreditsPerUnit,
        minimumChargeCredits: voiceMinCharge,
        freeInitialSeconds: voiceFreeSeconds,
        roundingRule: voiceRoundingRule,
        maxSessionDurationSeconds: voiceMaxDuration,
      },
      reports,
      subscriptions: activePricingQuery.data?.subscriptions ?? [],
      notes: notes || 'Updated pricing configuration',
    };

    publishMutation.mutate(input);
  }

  function handleUpdatePack(index: number, field: keyof CreditPack, value: any) {
    const updated = [...creditPacks];
    updated[index] = { ...updated[index], [field]: value };
    setCreditPacks(updated);
  }

  function handleUpdateReport(index: number, field: keyof ReportItemPricing, value: any) {
    const updated = [...reports];
    updated[index] = { ...updated[index], [field]: value };
    setReports(updated);
  }

  if (activePricingQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading pricing configuration…</p>;
  }

  if (activePricingQuery.isError) {
    if (isForbidden(activePricingQuery.error)) {
      return (
        <p className="text-sm text-destructive">
          You don&apos;t have permission to view pricing configurations.
        </p>
      );
    }
    return <p className="text-sm text-destructive">Failed to load pricing. Please try again.</p>;
  }

  const activeConfig = activePricingQuery.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Pricing & Rates Control Center</h1>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
              v{activeConfig.version} Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure rates, billing units, packs, reports, and discounts. Historical transactions retain
            exact rates at transaction time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && activeTab !== 'editor' && (
            <Button onClick={populateEditor}>Create New Version</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'current'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('current')}
        >
          Active Rates
        </button>
        {canManage && (
          <button
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => {
              if (creditPacks.length === 0) populateEditor();
              else setActiveTab('editor');
            }}
          >
            Version Editor
          </button>
        )}
        <button
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Version History
        </button>
      </div>

      {/* TAB 1: ACTIVE RATES */}
      {activeTab === 'current' && (
        <div className="flex flex-col gap-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-xs font-medium text-muted-foreground">Chat Message</span>
              <p className="mt-1 text-2xl font-bold">{activeConfig.chat.creditsPerMessage} Credits</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeConfig.chat.freeMessagesPerDay} free msgs/day • {activeConfig.chat.freeMessagesOnSignup} signup bonus
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-xs font-medium text-muted-foreground">Voice Calling</span>
              <p className="mt-1 text-2xl font-bold">{activeConfig.voice.creditsPerUnit} Cr / {activeConfig.voice.billingUnit}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                First {activeConfig.voice.freeInitialSeconds}s free • Min charge: {activeConfig.voice.minimumChargeCredits} Cr ({activeConfig.voice.roundingRule})
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-xs font-medium text-muted-foreground">Signup Free Credits</span>
              <p className="mt-1 text-2xl font-bold">{activeConfig.freeCreditsOnSignup} Credits</p>
              <p className="mt-1 text-xs text-muted-foreground">
                First purchase discount: {activeConfig.firstPurchaseDiscountPercent}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-xs font-medium text-muted-foreground">Active Since</span>
              <p className="mt-1 text-lg font-semibold">
                {new Date(activeConfig.effectiveFrom).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeConfig.notes || 'Production rates'}
              </p>
            </div>
          </div>

          {/* Credit Packs */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3">Credit Packs Store</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {activeConfig.creditPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="flex flex-col justify-between rounded-md border border-border bg-muted/40 p-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{pack.name}</h3>
                      {pack.badge && (
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          {pack.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{pack.description}</p>
                    <div className="mt-3">
                      <span className="text-2xl font-bold">{pack.credits}</span>
                      {pack.bonusCredits > 0 && (
                        <span className="text-sm font-semibold text-emerald-500 ml-1.5">
                          +{pack.bonusCredits} Bonus
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-1">Credits</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-lg font-bold">₹{(pack.priceAmount / 100).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{pack.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reports Pricing Matrix */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3">Vedic Astrological Reports Pricing</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 font-medium">Report Type</th>
                  <th className="py-2 font-medium">Title</th>
                  <th className="py-2 font-medium">Base Credits</th>
                  <th className="py-2 font-medium">Catalog Discount</th>
                  <th className="py-2 font-medium">Final Price</th>
                </tr>
              </thead>
              <tbody>
                {activeConfig.reports.map((rep) => {
                  const discountAmt = Math.floor((rep.credits * rep.discountPercent) / 100);
                  const finalCr = Math.max(1, rep.credits - discountAmt);
                  return (
                    <tr key={rep.reportType} className="border-b border-border">
                      <td className="py-2.5 font-mono text-xs">{rep.reportType}</td>
                      <td className="py-2.5 font-medium">{rep.title}</td>
                      <td className="py-2.5">{rep.credits} Cr</td>
                      <td className="py-2.5">
                        {rep.discountPercent > 0 ? (
                          <span className="text-emerald-500 font-medium">
                            {rep.discountPercent}% OFF
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 font-semibold">{finalCr} Credits</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VERSION EDITOR */}
      {activeTab === 'editor' && canManage && (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold mb-4">Create & Publish Pricing Version</h2>
            <p className="text-xs text-muted-foreground mb-4">
              All modifications create an immutable next version (v{activeConfig.version + 1}).
              Existing past ledger records will preserve their exact historical snapshots.
            </p>

            {publishError && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {publishError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Chat Settings */}
              <div className="rounded-md border border-border p-4 flex flex-col gap-3">
                <h3 className="font-semibold text-sm">Chat Messaging Rates</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Credits per message</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    value={creditsPerMessage}
                    onChange={(e) => setCreditsPerMessage(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Free messages per day</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    value={freeDailyMessages}
                    onChange={(e) => setFreeDailyMessages(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Free signup bonus messages</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    value={freeSignupMessages}
                    onChange={(e) => setFreeSignupMessages(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              {/* Voice Settings */}
              <div className="rounded-md border border-border p-4 flex flex-col gap-3">
                <h3 className="font-semibold text-sm">Voice Billing Rates & Rules</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Billing Unit</label>
                    <select
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                      value={voiceBillingUnit}
                      onChange={(e) => setVoiceBillingUnit(e.target.value as BillingUnit)}
                    >
                      <option value={BillingUnit.MINUTE}>per Minute</option>
                      <option value={BillingUnit.THIRTY_SECONDS}>per 30 Seconds</option>
                      <option value={BillingUnit.SECOND}>per Second</option>
                      <option value={BillingUnit.UNIT}>per Unit</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Credits per Unit</label>
                    <input
                      type="number"
                      min="1"
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                      value={voiceCreditsPerUnit}
                      onChange={(e) => setVoiceCreditsPerUnit(parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Min Charge (Credits)</label>
                    <input
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                      value={voiceMinCharge}
                      onChange={(e) => setVoiceMinCharge(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Free Initial Seconds</label>
                    <input
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                      value={voiceFreeSeconds}
                      onChange={(e) => setVoiceFreeSeconds(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Rounding Rule</label>
                  <select
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    value={voiceRoundingRule}
                    onChange={(e) => setVoiceRoundingRule(e.target.value as RoundingRule)}
                  >
                    <option value={RoundingRule.CEIL}>Ceil (Round up to full unit)</option>
                    <option value={RoundingRule.FLOOR}>Floor (Round down)</option>
                    <option value={RoundingRule.NEAREST}>Nearest</option>
                  </select>
                </div>
              </div>

              {/* General Bonuses */}
              <div className="rounded-md border border-border p-4 flex flex-col gap-3">
                <h3 className="font-semibold text-sm">Signup & Promotional Discounts</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Free Credits on Account Signup</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    value={freeCreditsOnSignup}
                    onChange={(e) => setFreeCreditsOnSignup(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">First Purchase Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    value={firstPurchaseDiscount}
                    onChange={(e) => setFirstPurchaseDiscount(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              {/* Change Note */}
              <div className="rounded-md border border-border p-4 flex flex-col gap-3">
                <h3 className="font-semibold text-sm">Version Release Notes</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Audit Reason / Description</label>
                  <textarea
                    rows={4}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    placeholder="e.g. Adjusted holiday discount rates and voice per-second billing"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Credit Packs Editor */}
            <div className="mt-6 rounded-md border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Credit Packs Configuration</h3>
              <div className="flex flex-col gap-3">
                {creditPacks.map((pack, idx) => (
                  <div key={pack.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center rounded border border-border p-2 bg-muted/20">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Pack Name</span>
                      <input
                        type="text"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={pack.name}
                        onChange={(e) => handleUpdatePack(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Base Credits</span>
                      <input
                        type="number"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={pack.credits}
                        onChange={(e) => handleUpdatePack(idx, 'credits', parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Bonus Credits</span>
                      <input
                        type="number"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={pack.bonusCredits}
                        onChange={(e) => handleUpdatePack(idx, 'bonusCredits', parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Price (₹ INR)</span>
                      <input
                        type="number"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={pack.priceAmount / 100}
                        onChange={(e) => handleUpdatePack(idx, 'priceAmount', Math.round(parseFloat(e.target.value || '0') * 100))}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Badge (optional)</span>
                      <input
                        type="text"
                        placeholder="Popular"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={pack.badge ?? ''}
                        onChange={(e) => handleUpdatePack(idx, 'badge', e.target.value || null)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reports Editor */}
            <div className="mt-6 rounded-md border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Reports Pricing Configuration</h3>
              <div className="flex flex-col gap-3">
                {reports.map((rep, idx) => (
                  <div key={rep.reportType} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center rounded border border-border p-2 bg-muted/20">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Report Type</span>
                      <p className="text-xs font-mono font-medium">{rep.reportType}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Title</span>
                      <input
                        type="text"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={rep.title}
                        onChange={(e) => handleUpdateReport(idx, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Base Credits</span>
                      <input
                        type="number"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={rep.credits}
                        onChange={(e) => handleUpdateReport(idx, 'credits', parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Catalog Discount %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                        value={rep.discountPercent}
                        onChange={(e) => handleUpdateReport(idx, 'discountPercent', parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setActiveTab('current')}>
                Cancel
              </Button>
              <Button
                disabled={publishMutation.isPending}
                onClick={handlePublish}
              >
                {publishMutation.isPending ? 'Publishing Version…' : 'Publish & Activate Version'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VERSION HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold mb-3">Historical Pricing Versions</h2>
          {versionsQuery.isPending && (
            <p className="text-sm text-muted-foreground">Loading versions…</p>
          )}
          {versionsQuery.data && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 font-medium">Version</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Effective From</th>
                  <th className="py-2 font-medium">Effective To</th>
                  <th className="py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {versionsQuery.data.items.map((ver) => (
                  <tr key={ver.version} className="border-b border-border">
                    <td className="py-2.5 font-bold">v{ver.version}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          ver.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ver.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs">
                      {new Date(ver.effectiveFrom).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-xs">
                      {ver.effectiveTo ? new Date(ver.effectiveTo).toLocaleString() : 'Present'}
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">{ver.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
