import { TTSProviderName, VoiceAudioFormat } from '@astroai/shared-types';
import type { TTSOptions, TTSProviderAdapter, TTSResult } from '../../voice.types';

export class MockTTSAdapter implements TTSProviderAdapter {
  readonly providerName = TTSProviderName.MOCK_TTS;
  readonly isConfigured = true;

  private shouldFail = false;

  setShouldFail(val: boolean): void {
    this.shouldFail = val;
  }

  async synthesize(
    text: string,
    _options?: TTSOptions,
  ): Promise<TTSResult> {
    if (this.shouldFail) {
      throw new Error('Simulated mock TTS synthesis failure');
    }

    // Generate dummy audio buffer
    const audioBuffer = Buffer.from(`MOCK_AUDIO_DATA_FOR_${text.slice(0, 30)}`);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.max(1, Math.round(wordCount / 2.5));

    return {
      audioBuffer,
      mimeType: 'audio/mpeg',
      audioFormat: VoiceAudioFormat.MP3,
      durationSeconds: estimatedDuration,
      provider: this.providerName,
      latencyMs: 50,
    };
  }
}

export const mockTTSAdapter = new MockTTSAdapter();
