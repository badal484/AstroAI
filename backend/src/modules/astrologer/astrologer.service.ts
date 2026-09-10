import {
  type IntentCategory,
  type AIProviderName,
  type AstrologerMessage,
  type SupportedLanguage,
  type QuickReplyChip,
  type InteractiveWidget,
  type GuruPersonaId,
} from '@astroai/shared-types';
import { executeAstrologerConsultation } from '../astrologer-intelligence';

export interface GenerateAstrologerResponseInput {
  userId: string;
  conversationId?: string;
  birthProfileId: string | null;
  personaId?: GuruPersonaId | null;
  conversationHistory: AstrologerMessage[];
  conversationSummary?: string | null;
  userMessage: string;
  userName?: string | null;
  preferredLanguage?: SupportedLanguage | null;
  requestId?: string;
  onChunk?: (delta: string) => void;
}

export interface AstrologerResponseResult {
  responseText: string;
  language: SupportedLanguage;
  intent: IntentCategory;
  isCrisisResponse: boolean;
  followUpChips?: string[];
  quickReplyChips?: QuickReplyChip[];
  interactiveWidget?: InteractiveWidget | null;
  audioDurationSeconds?: number | null;
  meta: {
    requestId: string;
    provider: AIProviderName | null;
    model: string | null;
    usedFallback: boolean;
    safetyCorrectionApplied: boolean;
  };
}

/**
 * Astrologer Service bridge delegating to the modular
 * Astrologer Intelligence Consultation Engine.
 */
export async function generateAstrologerResponse(
  input: GenerateAstrologerResponseInput,
): Promise<AstrologerResponseResult> {
  const result = await executeAstrologerConsultation({
    userId: input.userId,
    conversationId: input.conversationId,
    birthProfileId: input.birthProfileId,
    personaId: input.personaId,
    conversationHistory: input.conversationHistory,
    userMessage: input.userMessage,
    userName: input.userName,
    preferredLanguage: input.preferredLanguage,
    requestId: input.requestId,
    onChunk: input.onChunk,
  });

  return {
    responseText: result.responseText,
    language: result.language,
    intent: result.intent,
    isCrisisResponse: result.isCrisisResponse,
    followUpChips: result.followUpChips,
    quickReplyChips: result.quickReplyChips,
    interactiveWidget: result.interactiveWidget,
    audioDurationSeconds: result.audioDurationSeconds,
    meta: {
      requestId: result.meta.requestId,
      provider: result.meta.provider,
      model: result.meta.model,
      usedFallback: result.meta.usedFallback,
      safetyCorrectionApplied: result.meta.safetyCorrectionApplied,
    },
  };
}
