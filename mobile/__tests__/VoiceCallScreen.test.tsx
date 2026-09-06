import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  VoiceAudioFormat,
  VoiceEndReason,
  VoiceSessionStatus,
} from '@astroai/shared-types';
import { VoiceCallScreen } from '../src/screens/voice/VoiceCallScreen';

const mockStartVoiceSession = jest.fn();
const mockSendVoiceTurn = jest.fn();
const mockSendVoiceHeartbeat = jest.fn();
const mockEndVoiceSession = jest.fn();
const mockFetchWalletBalance = jest.fn();

jest.mock('../src/lib/voiceApi', () => ({
  startVoiceSession: (...args: unknown[]) => mockStartVoiceSession(...args),
  sendVoiceTurn: (...args: unknown[]) => mockSendVoiceTurn(...args),
  sendVoiceHeartbeat: (...args: unknown[]) => mockSendVoiceHeartbeat(...args),
  endVoiceSession: (...args: unknown[]) => mockEndVoiceSession(...args),
}));

jest.mock('../src/lib/walletApi', () => ({
  fetchWalletBalance: () => mockFetchWalletBalance(),
}));

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <VoiceCallScreen astrologerName="Acharya Shastri" />
    </QueryClientProvider>,
  );
}

describe('Mobile VoiceCallScreen Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchWalletBalance.mockResolvedValue({
      userId: 'user_1',
      balance: 100,
      availableBalance: 100,
      heldBalance: 0,
      currency: 'CREDITS',
      updatedAt: '2026-09-02T12:00:00.000Z',
    });

    mockStartVoiceSession.mockResolvedValue({
      id: 'vses_mob_123',
      userId: 'user_1',
      astrologerId: 'vedic-sage-1',
      birthProfileId: null,
      status: VoiceSessionStatus.ACTIVE,
      startedAt: '2026-09-02T12:00:00.000Z',
      lastHeartbeatAt: '2026-09-02T12:00:00.000Z',
      endedAt: null,
      durationSeconds: 0,
      billableSeconds: 0,
      creditsCharged: 0,
      pricingSnapshot: {
        pricingVersion: 1,
        unitPrice: 5,
        netAmount: 5,
      },
      holdId: 'hold_mob_123',
      endReason: null,
      failureReason: null,
      turnCount: 0,
      createdAt: '2026-09-02T12:00:00.000Z',
      updatedAt: '2026-09-02T12:00:00.000Z',
    });

    mockSendVoiceTurn.mockResolvedValue({
      turn: {
        id: 'turn_1',
        turnIndex: 1,
        userTranscription: 'Career & Promotion Outlook',
        assistantText: 'Jupiter in 10th house indicates a strong promotion window.',
        audioFormat: VoiceAudioFormat.MP3,
        latencyMs: { sttMs: 80, llmMs: 220, ttsMs: 140, totalMs: 440 },
        durationSeconds: 3,
        createdAt: '2026-09-02T12:00:15.000Z',
      },
      audioBase64: 'MOCK_AUDIO_BASE64',
      mimeType: 'audio/mpeg',
    });

    mockEndVoiceSession.mockResolvedValue({
      session: {
        id: 'vses_mob_123',
        status: VoiceSessionStatus.COMPLETED,
        durationSeconds: 75,
        billableSeconds: 45,
        creditsCharged: 5,
      },
      durationSeconds: 75,
      billableSeconds: 45,
      creditsCharged: 5,
      availableBalance: 95,
      isFreeTier: false,
    });
  });

  it('renders astrologer name, starts voice session, and displays listening state', async () => {
    await renderScreen();

    expect(await screen.findByText('Acharya Shastri')).toBeTruthy();
    expect(await screen.findByText('Vedic Astrological Voice Consultation')).toBeTruthy();
    expect(await screen.findByText('Listening')).toBeTruthy();
    expect(await screen.findByText('5 Credits/min • First 30s Free')).toBeTruthy();

    expect(mockStartVoiceSession).toHaveBeenCalledWith(
      expect.objectContaining({
        astrologerId: 'vedic-sage-1',
      }),
    );
  });

  it('sends speech turn when user taps a quick question chip', async () => {
    await renderScreen();

    const chip = await screen.findByText('Career Dasha guidance');
    expect(chip).toBeTruthy();

    fireEvent.press(chip);

    expect(
      await screen.findByText('Jupiter in 10th house indicates a strong promotion window.'),
    ).toBeTruthy();

    expect(mockSendVoiceTurn).toHaveBeenCalledWith(
      'vses_mob_123',
      expect.objectContaining({
        audioFormat: 'webm',
      }),
    );
  });

  it('ends call, calculates billing summary, and opens post-call modal', async () => {
    await renderScreen();

    const endBtn = await screen.findByText('End Session');
    expect(endBtn).toBeTruthy();

    fireEvent.press(endBtn);

    expect(await screen.findByText('Consultation Completed')).toBeTruthy();
    expect(await screen.findByText('5 Credits')).toBeTruthy();
    expect(await screen.findByText('95 Credits')).toBeTruthy();

    expect(mockEndVoiceSession).toHaveBeenCalledWith(
      'vses_mob_123',
      expect.objectContaining({
        reason: VoiceEndReason.USER_ENDED,
      }),
    );
  });
});
