import type {
  CreateReportInput,
  PaginatedResult,
  ReportDetailDTO,
  ReportDTO,
  ReportSummaryDTO,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export const reportApi = {
  /**
   * Purchases and enqueues a new personalized or compatibility report.
   */
  async createReport(input: CreateReportInput): Promise<ReportDTO> {
    return apiRequest<ReportDTO>('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Fetches user's report generation history.
   */
  async listReports(params?: {
    limit?: number;
    cursor?: string;
    status?: string;
  }): Promise<PaginatedResult<ReportSummaryDTO>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.status && params.status !== 'all') query.set('status', params.status);

    return apiRequest<PaginatedResult<ReportSummaryDTO>>(
      `/api/v1/reports?${query.toString()}`,
      { method: 'GET' },
    );
  },

  /**
   * Fetches full report details including deterministic scores, AI sections, and PDF status.
   */
  async getReport(reportId: string): Promise<ReportDetailDTO> {
    return apiRequest<ReportDetailDTO>(`/api/v1/reports/${reportId}`, {
      method: 'GET',
    });
  },

  /**
   * Retries a failed report generation job.
   */
  async retryReport(reportId: string): Promise<{ success: boolean; report: ReportDetailDTO }> {
    return apiRequest<{ success: boolean; report: ReportDetailDTO }>(
      `/api/v1/reports/${reportId}/retry`,
      { method: 'POST' },
    );
  },
};
