import { describe, expect, it } from 'vitest';
import { STTProviderName, VoiceAudioFormat } from '@astroai/shared-types';
import { mockSTTAdapter } from '../../../src/modules/voice/providers/stt/mockSTT.adapter';
import { voiceRegistry } from '../../../src/modules/voice/providers/voiceRegistry';

describe('Voice STT Provider Unit Tests', () => {
  it('transcribes audio buffer using mock STT adapter', async () => {
    const audioBuf = Buffer.from('TEST_AUDIO_STREAM_DATA_123');
    mockSTTAdapter.setMockResponse('Will I find success in business this year?');

    const result = await mockSTTAdapter.transcribe(audioBuf, VoiceAudioFormat.WEBM, {
      language: 'en',
    });

    expect(result.text).toBe('Will I find success in business this year?');
    expect(result.provider).toBe(STTProviderName.MOCK_STT);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.durationSeconds).toBeGreaterThan(0);
  });

  it('handles STT fallback when primary provider is unconfigured or fails', async () => {
    const audioBuf = Buffer.from('TEST_AUDIO_STREAM_DATA_456');
    mockSTTAdapter.setMockResponse('Namaste, please read my planetary alignments');

    const result = await voiceRegistry.transcribeWithFallback(audioBuf, VoiceAudioFormat.MP3);

    expect(result.text).toBe('Namaste, please read my planetary alignments');
    expect(result.provider).toBeTruthy();
  });
});
