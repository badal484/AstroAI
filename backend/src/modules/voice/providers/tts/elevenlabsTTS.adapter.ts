import { TTSProviderName, VoiceAudioFormat } from '@astroai/shared-types';
import { env } from '../../../../config/env';
import { VoiceTTSFailedError } from '../../../../shared/errors';
import { logger } from '../../../../shared/logger';
import type { TTSOptions, TTSProviderAdapter, TTSResult } from '../../voice.types';

export class ElevenLabsTTSAdapter implements TTSProviderAdapter {
  readonly providerName = TTSProviderName.ELEVENLABS;

  get isConfigured(): boolean {
    return Boolean(env.ELEVENLABS_API_KEY);
  }

  async synthesize(
    text: string,
    options?: TTSOptions,
  ): Promise<TTSResult> {
    if (!this.isConfigured) {
      throw new VoiceTTSFailedError('ElevenLabs TTS is not configured (missing ELEVENLABS_API_KEY)');
    }

    const start = Date.now();
    try {
      const voiceId = options?.voiceId || env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // default Rachel / Vedic persona

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            speed: options?.speed ?? 1.0,
          },
        }),
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        logger.error({ status: res.status, errJson }, 'ElevenLabs TTS request failed');
        throw new VoiceTTSFailedError('ElevenLabs synthesis failed', errJson as Record<string, unknown>);
      }

      const arrayBuf = await res.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);
      const estimatedDuration = Math.max(1, Math.round(text.split(/\s+/).length / 2.5));

      return {
        audioBuffer,
        mimeType: 'audio/mpeg',
        audioFormat: VoiceAudioFormat.MP3,
        durationSeconds: estimatedDuration,
        provider: this.providerName,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof VoiceTTSFailedError) throw err;
      logger.error({ err }, 'ElevenLabs TTS network error');
      throw new VoiceTTSFailedError(err.message || 'ElevenLabs synthesis network error');
    }
  }
}

export const elevenlabsTTSAdapter = new ElevenLabsTTSAdapter();
