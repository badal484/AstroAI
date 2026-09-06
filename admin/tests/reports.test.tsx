import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPermission, ReportStatus, ReportType } from '@astroai/shared-types';
import AdminReportsPage from '../src/app/(dashboard)/reports/page';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

const fetchAdminReportsMock = vi.fn();
const fetchAdminReportDetailsMock = vi.fn();
const retryAdminReportMock = vi.fn();
const refundAdminReportMock = vi.fn();

vi.mock('../src/lib/adminReportsApi', () => ({
  fetchAdminReports: (...args: unknown[]) => fetchAdminReportsMock(...args),
  fetchAdminReportDetails: (...args: unknown[]) => fetchAdminReportDetailsMock(...args),
  retryAdminReport: (...args: unknown[]) => retryAdminReportMock(...args),
  refundAdminReport: (...args: unknown[]) => refundAdminReportMock(...args),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Admin Reports Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();

    useAdminAuthStore.setState({
      status: 'authenticated',
      admin: {
        id: 'admin_1',
        email: 'ops@astroai.test',
        name: 'Reports Ops Admin',
        role: 'operations' as any,
        permissions: [AdminPermission.REPORTS_READ, AdminPermission.REPORTS_MANAGE],
      },
    });
  });

  it('renders reports list and KPI metrics cards', async () => {
    fetchAdminReportsMock.mockResolvedValueOnce({
      items: [
        {
          id: 'rep_test_kundli_101',
          userId: 'user_cust_888',
          reportType: ReportType.FULL_KUNDLI,
          primaryBirthProfileId: 'profile_1',
          partnerBirthProfileId: null,
          status: ReportStatus.COMPLETED,
          creditsCharged: 20,
          pdfUrl: '/api/v1/reports/rep_test_kundli_101/pdf',
          failureStage: null,
          failureReason: null,
          retryCount: 0,
          createdAt: '2026-09-02T12:00:00.000Z',
          completedAt: '2026-09-02T12:01:00.000Z',
        },
      ],
      nextCursor: null,
    });

    renderWithQuery(<AdminReportsPage />);

    expect(screen.getByText(/loading reports/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ndli_101')).toBeInTheDocument();
      expect(screen.getAllByText(/full kundli/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('completed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens report inspector modal and displays Ashtakoota compatibility scores', async () => {
    fetchAdminReportsMock.mockResolvedValueOnce({
      items: [
        {
          id: 'rep_comp_inspect_202',
          userId: 'user_cust_777',
          reportType: ReportType.RELATIONSHIP_COMPATIBILITY,
          primaryBirthProfileId: 'profile_a',
          partnerBirthProfileId: 'profile_b',
          status: ReportStatus.COMPLETED,
          creditsCharged: 25,
          pdfUrl: '/api/v1/reports/rep_comp_inspect_202/pdf',
          failureStage: null,
          failureReason: null,
          retryCount: 0,
          createdAt: '2026-09-02T12:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    fetchAdminReportDetailsMock.mockResolvedValueOnce({
      report: {
        id: 'rep_comp_inspect_202',
        userId: 'user_cust_777',
        reportType: ReportType.RELATIONSHIP_COMPATIBILITY,
        status: ReportStatus.COMPLETED,
        creditsCharged: 25,
        idempotencyKey: 'idemp_comp_202',
        pdfUrl: '/api/v1/reports/rep_comp_inspect_202/pdf',
      },
      astrologyData: {},
      compatibilityScore: {
        totalScore: 28,
        maxScore: 36,
        percentage: 78,
        isAuspicious: true,
        categories: [
          { kootaName: 'Nadi', maxScore: 8, obtainedScore: 8, description: 'Madhya - Antya match' },
          { kootaName: 'Bhakoot', maxScore: 7, obtainedScore: 7, description: '1/7 auspicious disposition' },
        ],
        mangalDosha: {
          personA: false,
          personB: false,
          isCompatible: true,
          cancellationDescription: 'No Mangal Dosha present in either chart',
        },
      },
      sections: [
        {
          title: 'Compatibility Synthesis',
          category: 'summary',
          content: 'Ashtakoota Milan score is 28/36 points representing harmonious partnership.',
        },
      ],
    });

    renderWithQuery(<AdminReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Inspect')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inspect'));

    await waitFor(() => {
      expect(screen.getByText(/Report Inspection/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Score: 28 \/ 36/i)).toBeInTheDocument();
      expect(screen.getByText('Nadi')).toBeInTheDocument();
      expect(screen.getByText('8 / 8')).toBeInTheDocument();
      expect(screen.getByText(/Download PDF/i)).toBeInTheDocument();
    });
  });
});
