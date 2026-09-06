import { describe, expect, it } from 'vitest';
import { TTSProviderName, VoiceAudioFormat } from '@astroai/shared-types';
import { mockTTSAdapter } from '../../../src/modules/voice/providers/tts/mockTTS.adapter';
import { voiceRegistry } from '../../../src/modules/voice/providers/voiceRegistry';

describe('Voice TTS Provider Unit Tests', () => {
  it('synthesizes speech audio buffer from text', async () => {
    const text = 'According to your birth chart, Jupiter is strongly positioned in the 10th house.';
    const result = await mockTTSAdapter.synthesize(text, { speed: 1.0 });

    expect(result.audioBuffer).toBeInstanceOf(Buffer);
    expect(result.audioBuffer.length).toBeGreaterThan(0);
    expect(result.audioFormat).toBe(VoiceAudioFormat.MP3);
    expect(result.provider).toBe(TTSProviderName.MOCK_TTS);
    expect(result.durationSeconds).toBeGreaterThan(0);
  });

  it('handles TTS fallback seamlessly', async () => {
    const text = 'Saturn transit indicates positive discipline and steady career growth.';
    const result = await voiceRegistry.synthesizeWithFallback(text);

    expect(result.audioBuffer).toBeInstanceOf(Buffer);
    expect(result.audioBuffer.length).toBeGreaterThan(0);
    expect(result.provider).toBeTruthy();
  });
});
