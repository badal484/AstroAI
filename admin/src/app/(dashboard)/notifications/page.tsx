'use client';

import { useEffect, useState } from 'react';
import {
  AudienceSegment,
  CampaignStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  type CreateCampaignInput,
  type CreateNotificationTemplateInput,
  type NotificationCampaignDTO,
  type NotificationLogDTO,
  type NotificationStatsDTO,
  type NotificationTemplateDTO,
} from '@astroai/shared-types';
import {
  createNotificationCampaign,
  createNotificationTemplate,
  executeNotificationCampaign,
  fetchNotificationCampaigns,
  fetchNotificationLogs,
  fetchNotificationStats,
  fetchNotificationTemplates,
  pauseNotificationCampaign,
  resumeNotificationCampaign,
  updateNotificationTemplate,
} from '../../../lib/adminNotificationsApi';

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'logs'>('campaigns');
  const [stats, setStats] = useState<NotificationStatsDTO | null>(null);
  const [campaigns, setCampaigns] = useState<NotificationCampaignDTO[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateDTO[]>([]);
  const [logs, setLogs] = useState<NotificationLogDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logChannelFilter, setLogChannelFilter] = useState<string>('all');

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateDTO | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Campaign Form State
  const [campName, setCampName] = useState<string>('');
  const [campTemplateCode, setCampTemplateCode] = useState<string>('');
  const [campSegment, setCampSegment] = useState<AudienceSegment>(AudienceSegment.ALL_USERS);
  const [campChannel, setCampChannel] = useState<NotificationChannel>(NotificationChannel.PUSH);

  // Template Form State
  const [tplCode, setTplCode] = useState<string>('');
  const [tplName, setTplName] = useState<string>('');
  const [tplEventType, setTplEventType] = useState<NotificationEventType>(
    NotificationEventType.PROMOTIONAL_CAMPAIGN,
  );
  const [tplCategory, setTplCategory] = useState<NotificationCategory>(NotificationCategory.MARKETING);
  const [tplTitleEn, setTplTitleEn] = useState<string>('');
  const [tplBodyEn, setTplBodyEn] = useState<string>('');
  const [tplTitleHi, setTplTitleHi] = useState<string>('');
  const [tplBodyHi, setTplBodyHi] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, campsData, tplsData, logsData] = await Promise.all([
        fetchNotificationStats(),
        fetchNotificationCampaigns(),
        fetchNotificationTemplates(),
        fetchNotificationLogs({
          status: logStatusFilter,
          channel: logChannelFilter,
          limit: 50,
        }),
      ]);
      setStats(statsData);
      setCampaigns(campsData);
      setTemplates(tplsData);
      setLogs(logsData.items);
      if (tplsData.length > 0 && !campTemplateCode) {
        setCampTemplateCode(tplsData[0].templateCode);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications platform data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [logStatusFilter, logChannelFilter]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !campTemplateCode) return;
    setActionLoading(true);
    try {
      const input: CreateCampaignInput = {
        name: campName,
        templateCode: campTemplateCode,
        audienceSegment: campSegment,
        channels: [campChannel],
      };
      await createNotificationCampaign(input);
      setShowCampaignModal(false);
      setCampName('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to execute and deliver this campaign now?')) return;
    setActionLoading(true);
    try {
      await executeNotificationCampaign(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to execute campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await pauseNotificationCampaign(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to pause campaign');
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await resumeNotificationCampaign(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resume campaign');
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const input: CreateNotificationTemplateInput = {
        templateCode: tplCode,
        name: tplName,
        eventType: tplEventType,
        category: tplCategory,
        channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        locales: {
          en: { title: tplTitleEn, body: tplBodyEn },
          hi: { title: tplTitleHi || tplTitleEn, body: tplBodyHi || tplBodyEn },
        },
        variables: ['name', 'discount', 'credits'],
        isActive: true,
      };

      if (editingTemplate) {
        await updateNotificationTemplate(editingTemplate.id, input);
      } else {
        await createNotificationTemplate(input);
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    } finally {
      setActionLoading(false);
    }
  };

  const openNewTemplateModal = () => {
    setEditingTemplate(null);
    setTplCode('');
    setTplName('');
    setTplEventType(NotificationEventType.PROMOTIONAL_CAMPAIGN);
    setTplCategory(NotificationCategory.MARKETING);
    setTplTitleEn('');
    setTplBodyEn('');
    setTplTitleHi('');
    setTplBodyHi('');
    setShowTemplateModal(true);
  };

  const openEditTemplateModal = (tpl: NotificationTemplateDTO) => {
    setEditingTemplate(tpl);
    setTplCode(tpl.templateCode);
    setTplName(tpl.name);
    setTplEventType(tpl.eventType);
    setTplCategory(tpl.category);
    setTplTitleEn(tpl.locales.en?.title || '');
    setTplBodyEn(tpl.locales.en?.body || '');
    setTplTitleHi(tpl.locales.hi?.title || '');
    setTplBodyHi(tpl.locales.hi?.body || '');
    setShowTemplateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notification Platform</h1>
          <p className="text-sm text-slate-400 mt-1">
            Event-driven multi-channel delivery, anti-spam protections, localized templates & marketing campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNewTemplateModal}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            + New Template
          </button>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
          >
            + Create Campaign
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-xs text-indigo-400 font-mono animate-pulse">
          Refreshing notification platform metrics & logs...
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Delivered</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.totalDelivered}</p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.totalSent > 0 ? Math.round((stats.totalDelivered / stats.totalSent) * 100) : 100}% delivery rate
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suppressed (Anti-Spam)</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">{stats.totalSuppressed}</p>
            <p className="mt-1 text-xs text-slate-400">Quiet hours, caps & opt-outs</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Push Channel</p>
            <p className="mt-2 text-2xl font-bold text-cyan-400">{stats.byChannel?.push || 0}</p>
            <p className="mt-1 text-xs text-slate-400">Mobile device dispatches</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Channel</p>
            <p className="mt-2 text-2xl font-bold text-indigo-400">{stats.byChannel?.email || 0}</p>
            <p className="mt-1 text-xs text-slate-400">HTML email receipts & alerts</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'campaigns'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Marketing Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'templates'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Notification Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'logs'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Delivery Tracking Logs
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
              No marketing campaigns created yet. Click "+ Create Campaign" to target user segments.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-5 py-3">Audience Segment</th>
                    <th className="px-5 py-3">Template & Channel</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Delivery Stats</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4 font-medium text-white">
                        <div>{camp.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{camp.id.slice(-8)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700">
                          {camp.audienceSegment.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-mono text-indigo-300">{camp.templateCode}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{camp.channels.join(', ')}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                            camp.status === CampaignStatus.COMPLETED
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : camp.status === CampaignStatus.RUNNING
                              ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800 animate-pulse'
                              : camp.status === CampaignStatus.PAUSED
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {camp.stats ? (
                          <div className="space-y-0.5">
                            <div>Targeted: <span className="font-semibold text-white">{camp.stats.totalTargeted}</span></div>
                            <div className="text-emerald-400">Delivered: {camp.stats.delivered}</div>
                            <div className="text-amber-400">Suppressed: {camp.stats.suppressed}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Not executed yet</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {camp.status !== CampaignStatus.COMPLETED && (
                          <div className="flex items-center justify-end gap-2">
                            {camp.status === CampaignStatus.PAUSED ? (
                              <button
                                onClick={() => handleResumeCampaign(camp.id)}
                                className="px-3 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                              >
                                Resume
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePauseCampaign(camp.id)}
                                className="px-3 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                              >
                                Pause
                              </button>
                            )}
                            <button
                              onClick={() => handleExecuteCampaign(camp.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                            >
                              Execute Now
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-indigo-400 font-semibold">{tpl.templateCode}</span>
                    <h3 className="text-base font-semibold text-white mt-0.5">{tpl.name}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{tpl.description || 'System event template'}</p>

                {/* English Content */}
                <div className="mt-3 rounded-lg bg-slate-950/70 p-3 border border-slate-800 text-xs">
                  <div className="font-semibold text-indigo-300">🇬🇧 English: {tpl.locales.en?.title}</div>
                  <div className="text-slate-300 mt-1">{tpl.locales.en?.body}</div>
                </div>

                {/* Hindi Content */}
                {tpl.locales.hi && (
                  <div className="mt-2 rounded-lg bg-slate-950/70 p-3 border border-slate-800 text-xs">
                    <div className="font-semibold text-amber-300">🇮🇳 Hindi: {tpl.locales.hi?.title}</div>
                    <div className="text-slate-300 mt-1">{tpl.locales.hi?.body}</div>
                  </div>
                )}

                {/* Tokens */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tpl.variables?.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 text-[11px] rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-mono"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>Channels: {tpl.channels.join(', ')}</div>
                <button
                  onClick={() => openEditTemplateModal(tpl)}
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Edit Template →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value={NotificationDeliveryStatus.DELIVERED}>Delivered</option>
                <option value={NotificationDeliveryStatus.DEFERRED_QUIET_HOURS}>Deferred (Quiet Hours)</option>
                <option value={NotificationDeliveryStatus.SUPPRESSED_FREQUENCY_CAP}>Suppressed (Frequency Cap)</option>
                <option value={NotificationDeliveryStatus.SUPPRESSED_OPT_OUT}>Suppressed (Opt Out)</option>
                <option value={NotificationDeliveryStatus.SUPPRESSED_DUPLICATE}>Suppressed (Duplicate)</option>
                <option value={NotificationDeliveryStatus.FAILED}>Failed</option>
              </select>
              <select
                value={logChannelFilter}
                onChange={(e) => setLogChannelFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
              >
                <option value="all">All Channels</option>
                <option value={NotificationChannel.PUSH}>Push Notification</option>
                <option value={NotificationChannel.EMAIL}>Email</option>
              </select>
            </div>
            <button
              onClick={loadData}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Recipient & Event</th>
                  <th className="px-5 py-3">Title & Message</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition text-xs">
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 font-mono">
                      <div className="text-white">{log.recipient}</div>
                      <div className="text-slate-400 text-[11px]">{log.eventType}</div>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <div className="font-semibold text-white truncate">{log.title}</div>
                      <div className="text-slate-400 truncate mt-0.5">{log.body}</div>
                    </td>
                    <td className="px-5 py-3 uppercase text-slate-400">{log.channel}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          log.status === NotificationDeliveryStatus.DELIVERED
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : log.status === NotificationDeliveryStatus.DEFERRED_QUIET_HOURS
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                            : log.status.startsWith('suppressed')
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 max-w-xs truncate">
                      {log.failedReason || (log.deliveredAt ? `Delivered at ${new Date(log.deliveredAt).toLocaleTimeString()}` : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Create Marketing Campaign</h2>
            <p className="text-xs text-slate-400 mt-1">
              Broadcast personalized notifications to a targeted audience segment.
            </p>

            <form onSubmit={handleCreateCampaign} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navratri Special Consultation Offer"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audience Segment</label>
                <select
                  value={campSegment}
                  onChange={(e) => setCampSegment(e.target.value as AudienceSegment)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value={AudienceSegment.ALL_USERS}>All Registered Users</option>
                  <option value={AudienceSegment.COMPLETED_PROFILE}>Users with Completed Kundli</option>
                  <option value={AudienceSegment.LOW_BALANCE}>Low Balance Users (≤ 5 Credits)</option>
                  <option value={AudienceSegment.INACTIVE_7_DAYS}>Inactive Users (&gt; 7 Days)</option>
                  <option value={AudienceSegment.HAS_PURCHASED}>Paying Users (Purchased Credits)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Template</label>
                <select
                  value={campTemplateCode}
                  onChange={(e) => setCampTemplateCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono text-xs"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.templateCode}>
                      {t.templateCode} - {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Channel</label>
                <select
                  value={campChannel}
                  onChange={(e) => setCampChannel(e.target.value as NotificationChannel)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value={NotificationChannel.PUSH}>Push Notification</option>
                  <option value={NotificationChannel.EMAIL}>Email</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl my-8">
            <h2 className="text-lg font-bold text-white">
              {editingTemplate ? 'Edit Notification Template' : 'New Notification Template'}
            </h2>

            <form onSubmit={handleSaveTemplate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Template Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    placeholder="e.g. SPECIAL_PROMO"
                    value={tplCode}
                    onChange={(e) => setTplCode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value as NotificationCategory)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={NotificationCategory.MARKETING}>Marketing</option>
                    <option value={NotificationCategory.LIFECYCLE}>Lifecycle</option>
                    <option value={NotificationCategory.HOROSCOPE}>Horoscope</option>
                    <option value={NotificationCategory.CONSULTATION}>Consultation</option>
                    <option value={NotificationCategory.TRANSACTIONAL}>Transactional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festive Offer"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* English Locale */}
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-indigo-400">🇬🇧 English Content</div>
                <input
                  type="text"
                  required
                  placeholder="Title (e.g. Special Offer for {{name}}! 🎉)"
                  value={tplTitleEn}
                  onChange={(e) => setTplTitleEn(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <textarea
                  required
                  rows={2}
                  placeholder="Body (e.g. Claim {{discount}}% bonus credits today.)"
                  value={tplBodyEn}
                  onChange={(e) => setTplBodyEn(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Hindi Locale */}
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-amber-400">🇮🇳 Hindi Content (Optional)</div>
                <input
                  type="text"
                  placeholder="Title in Hindi"
                  value={tplTitleHi}
                  onChange={(e) => setTplTitleHi(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Body in Hindi"
                  value={tplBodyHi}
                  onChange={(e) => setTplBodyHi(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
