import { randomUUID } from 'node:crypto';
import {
  IntentCategory,
  ModelAlias,
  type AIProviderName,
  type AstrologerMessage,
  type SupportedLanguage,
} from '@astroai/shared-types';
import { aiGateway } from '../ai';
import { detectLanguage } from './detection/languageDetector';
import { detectIntent } from './detection/intentDetector';
import { buildAstrologyContext } from './context/astrologyContext';
import { buildConversationContext } from './context/conversationContext';
import { buildUserPreferenceContext } from './context/userPreferenceContext';
import { buildMessages, buildSystemPrompt } from './prompts/systemPrompt';
import { getCrisisResponse } from './safety/crisisResponses';
import { validateResponseSafety } from './safety/outputSafetyValidator';
import { getSafeFallbackResponse } from './safety/safeFallbackResponse';
import { postProcessResponse } from './postProcess/responsePostProcessor';
import { personaService } from './persona/persona.service';

export interface GenerateAstrologerResponseInput {
  userId: string;
  /** Null when no birth profile is linked yet — the astrology context
   * degrades to "unavailable" rather than failing. */
  birthProfileId: string | null;
  /** Prior turns, oldest first. Does not need to be the FULL history —
   * callers (a future chat module) own persistence and windowing beyond
   * what's passed here. */
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
  /** True when this was a fixed crisis-safety template, not an AI-
   * generated response (see `safety/crisisResponses.ts`) — no provider
   * was called at all. */
  isCrisisResponse: boolean;
  meta: {
    requestId: string;
    provider: AIProviderName | null;
    model: string | null;
    usedFallback: boolean;
    /** True if the first generation failed safety validation and had to
     * be regenerated or replaced with a fixed safe fallback. */
    safetyCorrectionApplied: boolean;
  };
}

function lastAssistantMessage(history: AstrologerMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]!.role === 'assistant') return history[i]!.content;
  }
  return null;
}

function aliasForIntent(intent: IntentCategory): ModelAlias {
  return intent === IntentCategory.DAILY_HOROSCOPE ? ModelAlias.FAST_CHAT : ModelAlias.SMART_CHAT;
}

/**
 * The AI astrologer's full pipeline: language + intent detection → safety
 * gate → context assembly → persona-driven generation → safety
 * validation → post-processing. This is deliberately non-streaming: the
 * safety validator needs the complete response before anything reaches
 * the user, so responses are generated in full server-side rather than
 * token-streamed (a future chat module wanting a "typing" UX would reveal
 * this progressively itself, not stream unvalidated provider output).
 */
export async function generateAstrologerResponse(
  input: GenerateAstrologerResponseInput,
): Promise<AstrologerResponseResult> {
  const requestId = input.requestId ?? randomUUID();
  const language = detectLanguage(input.userMessage);
  const intentResult = await detectIntent(input.userMessage, requestId);

  if (intentResult.intent === IntentCategory.CRISIS_SELF_HARM) {
    return {
      responseText: getCrisisResponse(language),
      language,
      intent: IntentCategory.CRISIS_SELF_HARM,
      isCrisisResponse: true,
      meta: {
        requestId,
        provider: null,
        model: null,
        usedFallback: false,
        safetyCorrectionApplied: false,
      },
    };
  }

  const { intent } = intentResult;

  const [persona, astrology] = await Promise.all([
    personaService.getActivePersona(),
    buildAstrologyContext(input.userId, input.birthProfileId),
  ]);
  const conversation = buildConversationContext(
    input.conversationHistory,
    input.conversationSummary ?? null,
  );
  const userPreferences = buildUserPreferenceContext({
    name: input.userName ?? null,
    preferredLanguage: input.preferredLanguage ?? null,
    isFirstMessageInConversation: input.conversationHistory.length === 0,
  });

  const systemPrompt = buildSystemPrompt({
    persona,
    intent,
    language,
    astrology,
    conversation,
    userPreferences,
  });
  const alias = aliasForIntent(intent);

  const firstAttempt = await aiGateway.generateText({
    alias,
    messages: buildMessages(systemPrompt, conversation, input.userMessage),
    requestId,
  });
  let generated = firstAttempt;
  let validation = validateResponseSafety(generated.text);
  let safetyCorrectionApplied = false;

  if (!validation.safe) {
    safetyCorrectionApplied = true;
    const correctedSystemPrompt = `${systemPrompt}\n\nYour previous draft violated these safety rules: ${validation.violations.join(', ')}. Rewrite your answer to the user's last message so it no longer does, while staying just as helpful.`;
    generated = await aiGateway.generateText({
      alias,
      messages: buildMessages(correctedSystemPrompt, conversation, input.userMessage),
      requestId,
    });
    validation = validateResponseSafety(generated.text);
  }

  const responseText = validation.safe
    ? postProcessResponse(generated.text, lastAssistantMessage(input.conversationHistory))
    : getSafeFallbackResponse(language);

  return {
    responseText,
    language,
    intent,
    isCrisisResponse: false,
    meta: {
      requestId,
      provider: generated.meta.provider,
      model: generated.meta.model,
      usedFallback: generated.meta.usedFallback,
      safetyCorrectionApplied,
    },
  };
}
