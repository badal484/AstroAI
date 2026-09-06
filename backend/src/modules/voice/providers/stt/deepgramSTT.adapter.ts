import { STTProviderName, type VoiceAudioFormat } from '@astroai/shared-types';
import { env } from '../../../../config/env';
import { VoiceSTTFailedError } from '../../../../shared/errors';
import { logger } from '../../../../shared/logger';
import type { STTOptions, STTProviderAdapter, STTResult } from '../../voice.types';

export class DeepgramSTTAdapter implements STTProviderAdapter {
  readonly providerName = STTProviderName.DEEPGRAM;

  get isConfigured(): boolean {
    return Boolean(env.DEEPGRAM_API_KEY);
  }

  async transcribe(
    audioBuffer: Buffer,
    format: VoiceAudioFormat,
    options?: STTOptions,
  ): Promise<STTResult> {
    if (!this.isConfigured) {
      throw new VoiceSTTFailedError('Deepgram STT is not configured (missing DEEPGRAM_API_KEY)');
    }

    const start = Date.now();
    try {
      const mime =
        format === 'wav'
          ? 'audio/wav'
          : format === 'webm'
          ? 'audio/webm'
          : 'audio/mpeg';

      const query = new URLSearchParams({
        model: 'nova-2',
        smart_format: 'true',
        punctuate: 'true',
      });
      if (options?.language) {
        query.set('language', options.language);
      }

      const res = await fetch(`https://api.deepgram.com/v1/listen?${query.toString()}`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
          'Content-Type': mime,
        },
        body: audioBuffer,
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        logger.error({ status: res.status, errJson }, 'Deepgram STT request failed');
        throw new VoiceSTTFailedError('Deepgram transcription failed', errJson as Record<string, unknown>);
      }

      const data = (await res.json()) as any;
      const transcript =
        data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
      const durationSeconds = data.metadata?.duration;

      return {
        text: transcript.trim(),
        language: options?.language,
        durationSeconds,
        provider: this.providerName,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof VoiceSTTFailedError) throw err;
      logger.error({ err }, 'Deepgram STT network error');
      throw new VoiceSTTFailedError(err.message || 'Deepgram transcription network error');
    }
  }
}

export const deepgramSTTAdapter = new DeepgramSTTAdapter();
