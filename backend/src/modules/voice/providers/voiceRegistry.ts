import {
  STTProviderName,
  TTSProviderName,
} from '@astroai/shared-types';
import { VoiceProviderUnavailableError } from '../../../shared/errors';
import { logger } from '../../../shared/logger';
import type {
  STTProviderAdapter,
  TTSProviderAdapter,
} from '../voice.types';
import { deepgramSTTAdapter } from './stt/deepgramSTT.adapter';
import { mockSTTAdapter } from './stt/mockSTT.adapter';
import { whisperSTTAdapter } from './stt/whisperSTT.adapter';
import { elevenlabsTTSAdapter } from './tts/elevenlabsTTS.adapter';
import { mockTTSAdapter } from './tts/mockTTS.adapter';
import { openaiTTSAdapter } from './tts/openaiTTS.adapter';

class VoiceRegistry {
  private sttAdapters: Map<STTProviderName, STTProviderAdapter> = new Map();
  private ttsAdapters: Map<TTSProviderName, TTSProviderAdapter> = new Map();

  private sttCandidateOrder: STTProviderName[] = [
    STTProviderName.OPENAI_WHISPER,
    STTProviderName.DEEPGRAM,
    STTProviderName.MOCK_STT,
  ];

  private ttsCandidateOrder: TTSProviderName[] = [
    TTSProviderName.ELEVENLABS,
    TTSProviderName.OPENAI_TTS,
    TTSProviderName.MOCK_TTS,
  ];

  constructor() {
    this.registerSTT(whisperSTTAdapter);
    this.registerSTT(deepgramSTTAdapter);
    this.registerSTT(mockSTTAdapter);

    this.registerTTS(elevenlabsTTSAdapter);
    this.registerTTS(openaiTTSAdapter);
    this.registerTTS(mockTTSAdapter);
  }

  registerSTT(adapter: STTProviderAdapter): void {
    this.sttAdapters.set(adapter.providerName, adapter);
  }

  registerTTS(adapter: TTSProviderAdapter): void {
    this.ttsAdapters.set(adapter.providerName, adapter);
  }

  getSTTAdapter(providerName: STTProviderName): STTProviderAdapter | undefined {
    return this.sttAdapters.get(providerName);
  }

  getTTSAdapter(providerName: TTSProviderName): TTSProviderAdapter | undefined {
    return this.ttsAdapters.get(providerName);
  }

  setRoutingCandidates(
    sttCandidates?: STTProviderName[],
    ttsCandidates?: TTSProviderName[],
  ): void {
    if (sttCandidates && sttCandidates.length > 0) {
      this.sttCandidateOrder = [...sttCandidates];
    }
    if (ttsCandidates && ttsCandidates.length > 0) {
      this.ttsCandidateOrder = [...ttsCandidates];
    }
  }

  getRoutingCandidates(): { stt: STTProviderName[]; tts: TTSProviderName[] } {
    return {
      stt: [...this.sttCandidateOrder],
      tts: [...this.ttsCandidateOrder],
    };
  }

  /**
   * Executes STT with automatic fallback candidate progression.
   */
  async transcribeWithFallback(
    audioBuffer: Buffer,
    format: any,
    options?: any,
  ) {
    const errors: Array<{ provider: string; error: string }> = [];

    for (const name of this.sttCandidateOrder) {
      const adapter = this.sttAdapters.get(name);
      if (!adapter || !adapter.isConfigured) {
        continue;
      }

      try {
        return await adapter.transcribe(audioBuffer, format, options);
      } catch (err: any) {
        logger.warn({ provider: name, err }, 'STT provider candidate failed; attempting fallback');
        errors.push({ provider: name, error: err?.message || String(err) });
      }
    }

    // Always fallback to MockSTT in testing or if all configured fail
    const mock = this.sttAdapters.get(STTProviderName.MOCK_STT);
    if (mock) {
      return mock.transcribe(audioBuffer, format, options);
    }

    throw new VoiceProviderUnavailableError('All STT providers failed or unconfigured');
  }

  /**
   * Executes TTS with automatic fallback candidate progression.
   */
  async synthesizeWithFallback(
    text: string,
    options?: any,
  ) {
    const errors: Array<{ provider: string; error: string }> = [];

    for (const name of this.ttsCandidateOrder) {
      const adapter = this.ttsAdapters.get(name);
      if (!adapter || !adapter.isConfigured) {
        continue;
      }

      try {
        return await adapter.synthesize(text, options);
      } catch (err: any) {
        logger.warn({ provider: name, err }, 'TTS provider candidate failed; attempting fallback');
        errors.push({ provider: name, error: err?.message || String(err) });
      }
    }

    // Always fallback to MockTTS in testing or if all configured fail
    const mock = this.ttsAdapters.get(TTSProviderName.MOCK_TTS);
    if (mock) {
      return mock.synthesize(text, options);
    }

    throw new VoiceProviderUnavailableError('All TTS providers failed or unconfigured');
  }
}

export const voiceRegistry = new VoiceRegistry();
