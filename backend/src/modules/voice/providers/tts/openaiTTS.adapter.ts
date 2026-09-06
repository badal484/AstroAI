import { TTSProviderName, VoiceAudioFormat } from '@astroai/shared-types';
import { env } from '../../../../config/env';
import { VoiceTTSFailedError } from '../../../../shared/errors';
import { logger } from '../../../../shared/logger';
import type { TTSOptions, TTSProviderAdapter, TTSResult } from '../../voice.types';

export class OpenAITTSAdapter implements TTSProviderAdapter {
  readonly providerName = TTSProviderName.OPENAI_TTS;

  get isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  }

  async synthesize(
    text: string,
    options?: TTSOptions,
  ): Promise<TTSResult> {
    if (!this.isConfigured) {
      throw new VoiceTTSFailedError('OpenAI TTS is not configured (missing OPENAI_API_KEY)');
    }

    const start = Date.now();
    try {
      const voice = options?.voiceId || 'onyx'; // warm, wise voice suitable for astrologer

      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice,
          speed: options?.speed ?? 1.0,
          response_format: 'mp3',
        }),
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        logger.error({ status: res.status, errJson }, 'OpenAI TTS request failed');
        throw new VoiceTTSFailedError('OpenAI speech synthesis failed', errJson as Record<string, unknown>);
      }

      const arrayBuf = await res.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);
      const estimatedDuration = Math.max(1, Math.round(text.split(/\s+/).length / 2.8));

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
      logger.error({ err }, 'OpenAI TTS network error');
      throw new VoiceTTSFailedError(err.message || 'OpenAI speech synthesis network error');
    }
  }
}

export const openaiTTSAdapter = new OpenAITTSAdapter();
