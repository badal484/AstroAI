import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPermission, VoiceAudioFormat, VoiceSessionStatus } from '@astroai/shared-types';
import AdminVoicePage from '../src/app/(dashboard)/voice/page';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

const fetchAdminVoiceSessionsMock = vi.fn();
const fetchAdminVoiceSessionDetailsMock = vi.fn();
const fetchAdminVoiceConfigMock = vi.fn();
const updateAdminVoiceConfigMock = vi.fn();

vi.mock('../src/lib/adminVoiceApi', () => ({
  fetchAdminVoiceSessions: (...args: unknown[]) => fetchAdminVoiceSessionsMock(...args),
  fetchAdminVoiceSessionDetails: (...args: unknown[]) => fetchAdminVoiceSessionDetailsMock(...args),
  fetchAdminVoiceConfig: (...args: unknown[]) => fetchAdminVoiceConfigMock(...args),
  updateAdminVoiceConfig: (...args: unknown[]) => updateAdminVoiceConfigMock(...args),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Admin VoicePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAdminAuthStore.setState({
      status: 'authenticated',
      admin: {
        id: 'admin_1',
        email: 'ops@astroai.test',
        name: 'Ops Admin',
        role: 'operations' as any,
        permissions: [AdminPermission.VOICE_READ, AdminPermission.VOICE_MANAGE],
      },
    });
  });

  it('renders voice consultation sessions table and metrics correctly', async () => {
    fetchAdminVoiceSessionsMock.mockResolvedValueOnce({
      items: [
        {
          id: 'vses_test_1010101',
          userId: 'user_cust_888',
          astrologerId: 'vedic-sage-1',
          birthProfileId: null,
          status: VoiceSessionStatus.COMPLETED,
          startedAt: '2026-09-02T12:00:00.000Z',
          lastHeartbeatAt: '2026-09-02T12:02:00.000Z',
          endedAt: '2026-09-02T12:02:00.000Z',
          durationSeconds: 120,
          billableSeconds: 90,
          creditsCharged: 10,
          pricingSnapshot: {
            pricingVersion: 1,
            unitPrice: 5,
            netAmount: 5,
          },
          holdId: 'hold_999',
          endReason: null,
          failureReason: null,
          turnCount: 2,
          createdAt: '2026-09-02T12:00:00.000Z',
          updatedAt: '2026-09-02T12:02:00.000Z',
        },
      ],
      nextCursor: null,
    });

    renderWithQuery(<AdminVoicePage />);

    expect(screen.getByText(/loading voice sessions/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('_1010101')).toBeInTheDocument();
      expect(screen.getByText('vedic-sage-1')).toBeInTheDocument();
      expect(screen.getByText('120s')).toBeInTheDocument();
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens session inspector modal and displays audio turns and latency metrics', async () => {
    fetchAdminVoiceSessionsMock.mockResolvedValueOnce({
      items: [
        {
          id: 'vses_inspect_999',
          userId: 'user_cust_777',
          astrologerId: 'vedic-sage-1',
          status: VoiceSessionStatus.COMPLETED,
          startedAt: '2026-09-02T12:00:00.000Z',
          lastHeartbeatAt: '2026-09-02T12:01:00.000Z',
          endedAt: '2026-09-02T12:01:00.000Z',
          durationSeconds: 60,
          billableSeconds: 30,
          creditsCharged: 5,
          pricingSnapshot: {
            pricingVersion: 1,
            unitPrice: 5,
            netAmount: 5,
          },
          holdId: 'hold_777',
          createdAt: '2026-09-02T12:00:00.000Z',
          updatedAt: '2026-09-02T12:01:00.000Z',
        },
      ],
      nextCursor: null,
    });

    fetchAdminVoiceSessionDetailsMock.mockResolvedValueOnce({
      session: {
        id: 'vses_inspect_999',
        userId: 'user_cust_777',
        astrologerId: 'vedic-sage-1',
        status: VoiceSessionStatus.COMPLETED,
        durationSeconds: 60,
        creditsCharged: 5,
        holdId: 'hold_777',
      },
      turns: [
        {
          id: 'turn_1',
          turnIndex: 1,
          userTranscription: 'When is my best career phase?',
          assistantText: 'Jupiter in your 10th house indicates strong career progression.',
          audioFormat: VoiceAudioFormat.MP3,
          latencyMs: {
            sttMs: 120,
            llmMs: 350,
            ttsMs: 180,
            totalMs: 650,
          },
          durationSeconds: 4,
          createdAt: '2026-09-02T12:00:30.000Z',
        },
      ],
    });

    renderWithQuery(<AdminVoicePage />);

    await waitFor(() => {
      expect(screen.getByText('Inspect')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inspect'));

    await waitFor(() => {
      expect(screen.getByText(/Voice Session Inspection/i)).toBeInTheDocument();
      expect(screen.getByText('When is my best career phase?')).toBeInTheDocument();
      expect(screen.getByText(/Jupiter in your 10th house indicates strong career progression/i)).toBeInTheDocument();
    });
  });
});
