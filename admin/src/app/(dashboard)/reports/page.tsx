'use client';

import { useEffect, useState } from 'react';
import type { ReportDetailDTO, ReportSummaryDTO } from '@astroai/shared-types';
import {
  fetchAdminReportDetails,
  fetchAdminReports,
  refundAdminReport,
  retryAdminReport,
} from '../../../lib/adminReportsApi';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportSummaryDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal state
  const [inspectReportId, setInspectReportId] = useState<string | null>(null);
  const [inspectedReport, setInspectedReport] = useState<ReportDetailDTO | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminReports({
        status: statusFilter,
        reportType: typeFilter,
        limit: 50,
      });
      setReports(data.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load astrology reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter, typeFilter]);

  const handleInspect = async (id: string) => {
    setInspectReportId(id);
    setInspectLoading(true);
    try {
      const details = await fetchAdminReportDetails(id);
      setInspectedReport(details);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch report details');
      setInspectReportId(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    if (!confirm('Are you sure you want to retry this report generation pipeline?')) return;
    setActionLoading(true);
    try {
      await retryAdminReport(id);
      alert('Report has been requeued for generation');
      await loadReports();
      if (inspectReportId === id) {
        const updated = await fetchAdminReportDetails(id);
        setInspectedReport(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to retry report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm('Are you sure you want to manually refund credits for this report?')) return;
    setActionLoading(true);
    try {
      const res = await refundAdminReport(id);
      alert(`Successfully refunded ${res.refundedCredits} credits to the user`);
      await loadReports();
      if (inspectReportId === id) {
        const updated = await fetchAdminReportDetails(id);
        setInspectedReport(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to refund report');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === 'completed').length;
  const failedReports = reports.filter((r) => r.status === 'failed').length;
  const totalCredits = reports.reduce((acc, r: any) => acc + (r.creditsCharged || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Astrology Reports & Kundli Generation
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Monitor asynchronous PDF generation, deterministic Ashtakoota compatibility scoring, and automated refunds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadReports}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition shadow-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Reports</span>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalReports}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Completed</span>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedReports}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Failed</span>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{failedReports}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Credits Charged</span>
          <p className="mt-2 text-3xl font-bold text-amber-500">{totalCredits}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex flex-wrap gap-2">
          {['all', 'completed', 'failed', 'queued', 'calculating', 'interpreting', 'generating_pdf'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
                statusFilter === tab
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100"
          >
            <option value="all">All Types</option>
            <option value="full_kundli">Full Kundli</option>
            <option value="relationship_compatibility">Compatibility</option>
            <option value="career_finance">Career & Finance</option>
            <option value="transit_dasha">Transit & Dasha</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
              <tr>
                <th className="px-5 py-3">Report ID</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Credits</th>
                <th className="px-5 py-3">Retries</th>
                <th className="px-5 py-3">Created At</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                    No astrology reports found matching this criteria.
                  </td>
                </tr>
              ) : (
                reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                      {report.id.slice(-8)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">{(report.userId || report.primaryBirthProfileId || '').slice(-6)}</td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                      {report.reportType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          report.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : report.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                            : report.status === 'queued'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400'
                        }`}
                      >
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-amber-500">{report.creditsCharged || 250}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{report.retryCount || 0}</td>
                    <td className="px-5 py-3.5 text-xs">
                      {new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleInspect(report.id)}
                        className="rounded bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                      >
                        Inspect
                      </button>
                      {report.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(report.id)}
                          disabled={actionLoading}
                          className="rounded bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Inspector Modal */}
      {inspectReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Report Inspection: <span className="font-mono">{inspectReportId}</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Deterministic calculations, Ashtakoota matrix, AI interpretations, and PDF download.
                </p>
              </div>
              <button
                onClick={() => {
                  setInspectReportId(null);
                  setInspectedReport(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {inspectLoading || !inspectedReport ? (
              <div className="py-12 text-center text-zinc-500">Loading report data...</div>
            ) : (
              <div className="space-y-6">
                {/* Meta Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                  <div>
                    <span className="text-zinc-500">Status</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase">{inspectedReport.report.status}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Credits Charged</span>
                    <p className="font-semibold text-amber-500">{inspectedReport.report.creditsCharged}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Idempotency Key</span>
                    <p className="font-mono text-zinc-900 dark:text-zinc-100 truncate">
                      {(inspectedReport.report as any).idempotencyKey || inspectedReport.report.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">PDF Document</span>
                    <p>
                      {inspectedReport.report.pdfUrl ? (
                        <a
                          href={inspectedReport.report.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Download PDF 📄
                        </a>
                      ) : (
                        <span className="text-zinc-400">Not generated</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Failure Details (if failed) */}
                {inspectedReport.report.status === 'failed' && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-700 dark:text-red-300">
                        Failed at Stage: {(inspectedReport.report as any).failureStage || 'Unknown'}
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleRetry(inspectedReport.report.id)}
                          disabled={actionLoading}
                          className="rounded bg-red-600 px-3 py-1 text-white font-medium hover:bg-red-500"
                        >
                          Manual Retry
                        </button>
                        <button
                          onClick={() => handleRefund(inspectedReport.report.id)}
                          disabled={actionLoading}
                          className="rounded bg-zinc-800 dark:bg-zinc-700 px-3 py-1 text-white font-medium hover:bg-zinc-600"
                        >
                          Manual Refund
                        </button>
                      </div>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-mono">
                      Reason: {(inspectedReport.report as any).failureReason || 'Pipeline error'}
                    </p>
                  </div>
                )}

                {/* Deterministic Compatibility Ashtakoota Score */}
                {inspectedReport.compatibilityScore && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Deterministic Ashtakoota Milan (36 Points)
                      </h4>
                      <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        Total Score: {inspectedReport.compatibilityScore.totalScore} / 36 ({inspectedReport.compatibilityScore.percentage}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {inspectedReport.compatibilityScore.categories.map((cat: any) => (
                        <div
                          key={cat.kootaName || cat.category || cat.name}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs"
                        >
                          <div className="flex justify-between font-medium">
                            <span className="text-zinc-700 dark:text-zinc-300">{cat.kootaName || cat.category || cat.name}</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {cat.obtainedScore ?? cat.points ?? 0} / {cat.maxScore ?? cat.maxPoints ?? 0}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{cat.description}</p>
                        </div>
                      ))}
                    </div>

                    {((inspectedReport.compatibilityScore as any).mangalDosha || (inspectedReport.compatibilityScore as any).mangalDoshaA !== undefined) && (
                      <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        🔥 Mangal Dosha: Person A ({(inspectedReport.compatibilityScore as any).mangalDosha?.personA ?? (inspectedReport.compatibilityScore as any).mangalDoshaA ? 'Present' : 'None'}), Person B ({(inspectedReport.compatibilityScore as any).mangalDosha?.personB ?? (inspectedReport.compatibilityScore as any).mangalDoshaB ? 'Present' : 'None'})
                      </div>
                    )}
                  </div>
                )}

                {/* AI Interpretation Sections */}
                {inspectedReport.sections && inspectedReport.sections.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Report Sections & Interpretations
                    </h4>
                    <div className="space-y-3">
                      {inspectedReport.sections.map((sec, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                              {sec.title}
                            </h5>
                            <span className="uppercase text-[10px] bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-medium">
                              {sec.category}
                            </span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                            {sec.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
