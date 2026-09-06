import {
  type IntentCategory,
  type AIProviderName,
  type AstrologerMessage,
  type SupportedLanguage,
} from '@astroai/shared-types';
import { executeAstrologerConsultation } from '../astrologer-intelligence';

export interface GenerateAstrologerResponseInput {
  userId: string;
  conversationId?: string;
  birthProfileId: string | null;
  conversationHistory: AstrologerMessage[];
  conversationSummary?: string | null;
  userMessage: string;
  userName?: string | null;
  preferredLanguage?: SupportedLanguage | null;
  requestId?: string;
}

export interface AstrologerResponseResult {
  responseText: string;
  language: SupportedLanguage;
  intent: IntentCategory;
  isCrisisResponse: boolean;
  followUpChips?: string[];
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
    conversationHistory: input.conversationHistory,
    userMessage: input.userMessage,
    userName: input.userName,
    preferredLanguage: input.preferredLanguage,
    requestId: input.requestId,
  });

  return {
    responseText: result.responseText,
    language: result.language,
    intent: result.intent,
    isCrisisResponse: result.isCrisisResponse,
    followUpChips: result.followUpChips,
    meta: {
      requestId: result.meta.requestId,
      provider: result.meta.provider,
      model: result.meta.model,
      usedFallback: result.meta.usedFallback,
      safetyCorrectionApplied: result.meta.safetyCorrectionApplied,
    },
  };
}
