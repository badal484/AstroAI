import type {
  STTProviderName,
  TTSProviderName,
  VoiceAudioFormat,
} from '@astroai/shared-types';

export interface STTOptions {
  language?: string;
  prompt?: string;
}

export interface STTResult {
  text: string;
  language?: string;
  durationSeconds?: number;
  provider: STTProviderName;
  latencyMs: number;
}

export interface STTProviderAdapter {
  readonly providerName: STTProviderName;
  readonly isConfigured: boolean;
  transcribe(
    audioBuffer: Buffer,
    format: VoiceAudioFormat,
    options?: STTOptions,
  ): Promise<STTResult>;
}

export interface TTSOptions {
  voiceId?: string;
  speed?: number;
  language?: string;
}

export interface TTSResult {
  audioBuffer: Buffer;
  mimeType: string;
  audioFormat: VoiceAudioFormat;
  durationSeconds: number;
  provider: TTSProviderName;
  latencyMs: number;
}

export interface TTSProviderAdapter {
  readonly providerName: TTSProviderName;
  readonly isConfigured: boolean;
  synthesize(
    text: string,
    options?: TTSOptions,
  ): Promise<TTSResult>;
}
