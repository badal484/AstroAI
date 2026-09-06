import { STTProviderName, type VoiceAudioFormat } from '@astroai/shared-types';
import { env } from '../../../../config/env';
import { VoiceSTTFailedError } from '../../../../shared/errors';
import { logger } from '../../../../shared/logger';
import type { STTOptions, STTProviderAdapter, STTResult } from '../../voice.types';

export class WhisperSTTAdapter implements STTProviderAdapter {
  readonly providerName = STTProviderName.OPENAI_WHISPER;

  get isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  }

  async transcribe(
    audioBuffer: Buffer,
    format: VoiceAudioFormat,
    options?: STTOptions,
  ): Promise<STTResult> {
    if (!this.isConfigured) {
      throw new VoiceSTTFailedError('OpenAI Whisper STT is not configured (missing OPENAI_API_KEY)');
    }

    const start = Date.now();
    try {
      const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
      const filename = `audio.${format === 'webm' ? 'webm' : format === 'wav' ? 'wav' : 'mp3'}`;
      const mime = format === 'wav' ? 'audio/wav' : format === 'webm' ? 'audio/webm' : 'audio/mpeg';

      // Build multipart/form-data payload
      const parts: Buffer[] = [];
      
      // model field
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`,
        ),
      );

      // optional language field
      if (options?.language) {
        parts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${options.language}\r\n`,
          ),
        );
      }

      // file field
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`,
        ),
      );
      parts.push(audioBuffer);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

      const payload = Buffer.concat(parts);

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: payload,
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        logger.error({ status: res.status, errJson }, 'Whisper STT request failed');
        throw new VoiceSTTFailedError('Whisper transcription failed', errJson as Record<string, unknown>);
      }

      const data = (await res.json()) as { text: string; language?: string; duration?: number };
      return {
        text: data.text.trim(),
        language: data.language ?? options?.language,
        durationSeconds: data.duration,
        provider: this.providerName,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof VoiceSTTFailedError) throw err;
      logger.error({ err }, 'Whisper STT network or processing error');
      throw new VoiceSTTFailedError(err.message || 'Whisper transcription network error');
    }
  }
}

export const whisperSTTAdapter = new WhisperSTTAdapter();
