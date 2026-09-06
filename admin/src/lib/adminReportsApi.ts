import type {
  PaginatedResult,
  ReportDetailDTO,
  ReportSummaryDTO,
} from '@astroai/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchAdminReports(params?: {
  limit?: number;
  cursor?: string;
  status?: string;
  reportType?: string;
  userId?: string;
}): Promise<PaginatedResult<ReportSummaryDTO>> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.reportType && params.reportType !== 'all') query.set('reportType', params.reportType);
  if (params?.userId) query.set('userId', params.userId);

  const res = await fetch(`${API_BASE}/admin/reports?${query.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch reports');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchAdminReportDetails(reportId: string): Promise<ReportDetailDTO> {
  const res = await fetch(`${API_BASE}/admin/reports/${reportId}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch report details');
  }

  const json = await res.json();
  return json.data;
}

export async function retryAdminReport(reportId: string): Promise<{ success: boolean; report: ReportDetailDTO }> {
  const res = await fetch(`${API_BASE}/admin/reports/${reportId}/retry`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to retry report');
  }

  const json = await res.json();
  return json.data;
}

export async function refundAdminReport(reportId: string): Promise<{ success: boolean; refundedCredits: number }> {
  const res = await fetch(`${API_BASE}/admin/reports/${reportId}/refund`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to refund report');
  }

  const json = await res.json();
  return json.data;
}
