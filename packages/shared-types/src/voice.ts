import { z } from 'zod';
import type { PricingSnapshot } from './wallet';

/**
 * Status lifecycle of a voice session.
 */
export const VoiceSessionStatus = {
  INITIATING: 'initiating',
  ACTIVE: 'active',
  INTERRUPTED: 'interrupted',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type VoiceSessionStatus =
  (typeof VoiceSessionStatus)[keyof typeof VoiceSessionStatus];

/**
 * Participant role in a voice conversation turn.
 */
export const VoiceTurnRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;
export type VoiceTurnRole =
  (typeof VoiceTurnRole)[keyof typeof VoiceTurnRole];

/**
 * Supported STT (Speech-to-Text) providers.
 */
export const STTProviderName = {
  OPENAI_WHISPER: 'openai_whisper',
  DEEPGRAM: 'deepgram',
  MOCK_STT: 'mock_stt',
} as const;
export type STTProviderName =
  (typeof STTProviderName)[keyof typeof STTProviderName];

/**
 * Supported TTS (Text-to-Speech) providers.
 */
export const TTSProviderName = {
  ELEVENLABS: 'elevenlabs',
  OPENAI_TTS: 'openai_tts',
  MOCK_TTS: 'mock_tts',
} as const;
export type TTSProviderName =
  (typeof TTSProviderName)[keyof typeof TTSProviderName];

/**
 * Audio encoding format for voice transport.
 */
export const VoiceAudioFormat = {
  MP3: 'mp3',
  WAV: 'wav',
  PCM: 'pcm',
  WEBM: 'webm',
} as const;
export type VoiceAudioFormat =
  (typeof VoiceAudioFormat)[keyof typeof VoiceAudioFormat];

/**
 * Reason a voice session was terminated.
 */
export const VoiceEndReason = {
  USER_ENDED: 'user_ended',
  TIMEOUT: 'timeout',
  BALANCE_EXHAUSTED: 'balance_exhausted',
  PROVIDER_ERROR: 'provider_error',
  INTERRUPTED: 'interrupted',
} as const;
export type VoiceEndReason =
  (typeof VoiceEndReason)[keyof typeof VoiceEndReason];

/**
 * Schema to initiate a voice call session.
 */
export const startVoiceSessionSchema = z.object({
  astrologerId: z.string().min(1, 'astrologerId is required'),
  birthProfileId: z.string().nullable().optional(),
  language: z.enum(['en', 'hi', 'te', 'ta', 'kn', 'bn', 'mr', 'gu']).optional(),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
});
export type StartVoiceSessionInput = z.infer<typeof startVoiceSessionSchema>;

/**
 * Schema for an audio turn sent by the client.
 * The audio payload can be passed as base64-encoded string or handled via multipart.
 */
export const voiceTurnInputSchema = z.object({
  audioBase64: z.string().min(1, 'audioBase64 is required'),
  audioFormat: z.nativeEnum(VoiceAudioFormat).default(VoiceAudioFormat.WEBM),
  language: z.enum(['en', 'hi', 'te', 'ta', 'kn', 'bn', 'mr', 'gu']).optional(),
  clientTurnId: z.string().optional(),
});
export type VoiceTurnInput = z.infer<typeof voiceTurnInputSchema>;

/**
 * Schema to end a voice session.
 */
export const endVoiceSessionSchema = z.object({
  reason: z.nativeEnum(VoiceEndReason).default(VoiceEndReason.USER_ENDED),
  clientDurationSeconds: z.number().int().nonnegative().optional(),
});
export type EndVoiceSessionInput = z.infer<typeof endVoiceSessionSchema>;

/**
 * Schema for voice session heartbeats.
 */
export const voiceHeartbeatSchema = z.object({
  currentDurationSeconds: z.number().int().nonnegative(),
});
export type VoiceHeartbeatInput = z.infer<typeof voiceHeartbeatSchema>;

/**
 * DTO for an individual voice turn in the session.
 */
export interface VoiceTurnDTO {
  id: string;
  turnIndex: number;
  userTranscription: string;
  assistantText: string;
  audioUrl?: string | null;
  audioBase64?: string | null;
  audioFormat: VoiceAudioFormat;
  latencyMs: {
    sttMs: number;
    llmMs: number;
    ttsMs: number;
    totalMs: number;
  };
  durationSeconds: number;
  createdAt: string;
}

/**
 * DTO for a Voice Session.
 */
export interface VoiceSessionDTO {
  id: string;
  userId: string;
  astrologerId: string;
  birthProfileId: string | null;
  status: VoiceSessionStatus;
  startedAt: string;
  lastHeartbeatAt: string;
  endedAt: string | null;
  durationSeconds: number;
  billableSeconds: number;
  creditsCharged: number;
  pricingSnapshot: PricingSnapshot;
  holdId: string | null;
  endReason: VoiceEndReason | null;
  failureReason: string | null;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary DTO returned when a voice call finishes.
 */
export interface VoiceSessionSummaryDTO {
  session: VoiceSessionDTO;
  durationSeconds: number;
  billableSeconds: number;
  creditsCharged: number;
  availableBalance: number;
  isFreeTier: boolean;
}

/**
 * Configuration DTO for STT/TTS routing.
 */
export interface VoiceConfigDTO {
  activeSTTProvider: STTProviderName;
  activeTTSProvider: TTSProviderName;
  sttCandidates: STTProviderName[];
  ttsCandidates: TTSProviderName[];
  defaultVoiceId: string;
}
