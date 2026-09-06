import { STTProviderName, type VoiceAudioFormat } from '@astroai/shared-types';
import type { STTOptions, STTProviderAdapter, STTResult } from '../../voice.types';

export class MockSTTAdapter implements STTProviderAdapter {
  readonly providerName = STTProviderName.MOCK_STT;
  readonly isConfigured = true;

  private mockTranscription: string | null = null;
  private shouldFail = false;

  setMockResponse(text: string | null, shouldFail = false): void {
    this.mockTranscription = text;
    this.shouldFail = shouldFail;
  }

  async transcribe(
    audioBuffer: Buffer,
    _format: VoiceAudioFormat,
    options?: STTOptions,
  ): Promise<STTResult> {
    if (this.shouldFail) {
      throw new Error('Simulated mock STT transcription failure');
    }

    // Default simulated transcription if none explicitly set
    const text =
      this.mockTranscription ??
      (audioBuffer.length > 0
        ? 'Namaste Guruji, can you tell me about my career and financial outlook?'
        : 'Hello');

    return {
      text,
      language: options?.language ?? 'en',
      durationSeconds: Math.max(1, Math.round(audioBuffer.length / 16000)),
      provider: this.providerName,
      latencyMs: 45,
    };
  }
}

export const mockSTTAdapter = new MockSTTAdapter();
