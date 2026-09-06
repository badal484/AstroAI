import { randomUUID } from 'node:crypto';
import {
  IntentCategory,
  ModelAlias,
  type AIProviderName,
  type AstrologerMessage,
  type SupportedLanguage,
} from '@astroai/shared-types';
import { aiGateway } from '../ai';
import { intentEngine } from './intent/intentEngine';
import { emotionDetector } from './emotion/emotionDetector';
import { consultationStateMachine } from './consultation/consultationStateMachine';
import { memoryService } from './memory/memoryService';
import { contextBuilder } from './astrology-context/contextBuilder';
import { astrologyReasoningEngine } from './reasoning/astrologyReasoningEngine';
import { responseStrategyEngine } from './strategy/responseStrategyEngine';
import { personaManager } from './persona/personaManager';
import { promptAssembler } from './persona/promptAssembler';
import { responseQualityValidator } from './quality/responseQualityValidator';
import { detectLanguage } from '../astrologer/detection/languageDetector';
import { detectIntent } from '../astrologer/detection/intentDetector';
import { getCrisisResponse } from '../astrologer/safety/crisisResponses';
import { validateResponseSafety } from '../astrologer/safety/outputSafetyValidator';
import { fallbackGenerator } from './quality/fallbackGenerator';
import { CoreIntent } from './intent/intentTypes';
import type { ReadingDepth } from './strategy/strategyTypes';

export interface ExecuteConsultationInput {
  userId: string;
  conversationId?: string;
  birthProfileId: string | null;
  conversationHistory: AstrologerMessage[];
  userMessage: string;
  userName?: string | null;
  preferredLanguage?: SupportedLanguage | null;
  requestId?: string;
}

export interface AstrologerConsultationResult {
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
    strategyAction: string;
    dynamicLength?: ReadingDepth;
    detectedEmotion: string;
    suggestedFollowUps: string[];
  };
}

export async function executeAstrologerConsultation(
  input: ExecuteConsultationInput,
): Promise<AstrologerConsultationResult> {
  const requestId = input.requestId ?? randomUUID();

  // 1. Language Detection
  const language = input.preferredLanguage ?? detectLanguage(input.userMessage);

  // 2. Fast Multi-Intent & Emotion Detection
  const intents = intentEngine.detectIntents(input.userMessage);
  const emotion = emotionDetector.detectEmotion(input.userMessage);

  // 3. Crisis Safety Gate
  if (intents.primary === CoreIntent.CRISIS_SELF_HARM) {
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
        strategyAction: 'SAFETY_GUARD',
        detectedEmotion: emotion.state,
        suggestedFollowUps: [],
      },
    };
  }

  // Resolve legacy intent mapping
  let finalIntent: IntentCategory;
  if (intents.primary === CoreIntent.UNSAFE_PREDICTION) finalIntent = IntentCategory.UNSAFE;
  else if (intents.primary === CoreIntent.MEDICAL_QUERY) finalIntent = IntentCategory.MEDICAL;
  else if (intents.primary === CoreIntent.COMPOUND_MARRIAGE_CAREER) finalIntent = IntentCategory.CAREER;
  else if (intents.primary === CoreIntent.MARRIAGE_TIMING || intents.primary === CoreIntent.MARRIAGE_PROSPECTS || intents.primary === CoreIntent.PARTNER_CHARACTERISTICS) finalIntent = IntentCategory.MARRIAGE;
  else if (intents.primary === CoreIntent.CAREER_GENERAL || intents.primary === CoreIntent.CAREER_TIMING || intents.primary === CoreIntent.CAREER_DECISION || intents.primary === CoreIntent.JOB_CHANGE || intents.primary === CoreIntent.PROMOTION_GROWTH || intents.primary === CoreIntent.BUSINESS_VENTURE) finalIntent = IntentCategory.CAREER;
  else if (intents.primary === CoreIntent.FINANCE_GENERAL || intents.primary === CoreIntent.WEALTH_TIMING || intents.primary === CoreIntent.DEBT_EXPENSES || intents.primary === CoreIntent.INVESTMENT_GUIDANCE || intents.primary === CoreIntent.PROPERTY_VEHICLE) finalIntent = IntentCategory.MONEY;
  else if (intents.primary === CoreIntent.RELATIONSHIP_CURRENT_SITUATION || intents.primary === CoreIntent.LOVE_LIFE) finalIntent = IntentCategory.LOVE;
  else if (intents.primary === CoreIntent.RELATIONSHIP_COMPATIBILITY) finalIntent = IntentCategory.COMPATIBILITY;
  else if (intents.primary === CoreIntent.DAILY_HOROSCOPE || intents.primary === CoreIntent.DAILY_LUCKY_FACT) finalIntent = IntentCategory.DAILY_HOROSCOPE;
  else {
    try {
      const detected = await detectIntent(input.userMessage, requestId);
      finalIntent = detected.intent;
    } catch {
      finalIntent = IntentCategory.GENERAL_ASTROLOGY;
    }
  }

  // 5. Consultation State Machine
  const priorAssistant = input.conversationHistory
    .slice()
    .reverse()
    .find((m) => m.role === 'assistant')?.content ?? null;

  const consultationState = consultationStateMachine.resolveNextState(
    input.conversationHistory.length,
    intents,
    input.birthProfileId !== null,
    priorAssistant,
  );

  // 6. Response Strategy Engine
  const strategy = responseStrategyEngine.determineStrategy(
    intents,
    emotion,
    consultationState,
    input.conversationHistory.length,
    language,
    input.userMessage,
  );

  // 7. Memory & Context Retrieval (Parallelized)
  const [persona, memory, astrology] = await Promise.all([
    personaManager.getActivePersona(),
    memoryService.getRelevantMemory(input.userId, intents.primary),
    contextBuilder.buildAstrologyContext(input.userId, input.birthProfileId, intents.primary),
  ]);

  // 8. Astrology Reasoning
  const reasoning = astrologyReasoningEngine.reason(astrology);

  // 9. Prompt Assembly
  const systemPrompt = promptAssembler.buildSystemPrompt({
    persona,
    language,
    intents,
    legacyIntent: finalIntent as Exclude<IntentCategory, 'crisis_self_harm'>,
    emotion,
    strategy,
    astrology,
    reasoning,
    memory,
    conversationHistory: input.conversationHistory,
    userMessage: input.userMessage,
    userName: input.userName,
  });

  const messages = promptAssembler.buildMessages(
    systemPrompt,
    input.conversationHistory,
    input.userMessage,
  );

  const alias =
    finalIntent === IntentCategory.DAILY_HOROSCOPE ? ModelAlias.FAST_CHAT : ModelAlias.SMART_CHAT;

  // 10. Generation via AI Gateway (with two-pass safety correction and Acharya fallback)
  let responseText = '';
  let usedFallback = false;
  let safetyCorrectionApplied = false;
  let provider: AIProviderName | null = null;
  let model: string | null = null;

  try {
    const firstAttempt = await aiGateway.generateText({
      alias,
      messages,
      requestId,
    });

    provider = firstAttempt.meta.provider;
    model = firstAttempt.meta.model;
    usedFallback = firstAttempt.meta.usedFallback;

    let validation = validateResponseSafety(firstAttempt.text);
    if (!validation.safe) {
      safetyCorrectionApplied = true;
      const correctedSystemPrompt = `${systemPrompt}\n\nYour previous draft violated these safety rules: ${validation.violations.join(', ')}. Rewrite your answer to the user's last message so it no longer does, while staying just as helpful.`;

      try {
        const secondAttempt = await aiGateway.generateText({
          alias,
          messages: promptAssembler.buildMessages(correctedSystemPrompt, input.conversationHistory, input.userMessage),
          requestId,
        });
        validation = validateResponseSafety(secondAttempt.text);
        if (validation.safe) {
          responseText = secondAttempt.text;
        } else {
          responseText = fallbackGenerator.generate({
            intents,
            emotion,
            strategy,
            astrology,
            language,
            userMessage: input.userMessage,
          });
          usedFallback = true;
        }
      } catch {
        responseText = fallbackGenerator.generate({
          intents,
          emotion,
          strategy,
          astrology,
          language,
          userMessage: input.userMessage,
        });
        usedFallback = true;
      }
    } else {
      responseText = firstAttempt.text;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      throw error;
    }
    // Graceful Vedic fallback on external LLM rate limits / network outages in dev/prod
    usedFallback = true;
    responseText = fallbackGenerator.generate({
      intents,
      emotion,
      strategy,
      astrology,
      language,
      userMessage: input.userMessage,
    });
  }

  // 11. Quality & Output Validator (Topic consistency & formatting)
  const quality = responseQualityValidator.validate(responseText, intents.primary, astrology);
  if (!quality.topicConsistent) {
    responseText = fallbackGenerator.generate({
      intents,
      emotion,
      strategy,
      astrology,
      language,
      userMessage: input.userMessage,
    });
    usedFallback = true;
  } else if (quality.correctedText) {
    responseText = quality.correctedText;
  }

  // 12. Asynchronous Memory & Reading Summary Persistence
  void memoryService.extractAndSaveFacts(input.userId, input.userMessage, input.conversationId);

  if (input.conversationId && astrology.available) {
    void memoryService.recordReadingSummary(
      input.userId,
      input.conversationId,
      reasoning.topic,
      responseText.slice(0, 200) + '...',
      reasoning.primaryFactors.map((f) => f.factor),
      strategy.suggestedFollowUpTopics,
    );
  }

  const followUpChips = strategy.suggestedFollowUpTopics;

  return {
    responseText,
    language,
    intent: finalIntent,
    isCrisisResponse: false,
    followUpChips,
    meta: {
      requestId,
      provider,
      model,
      usedFallback,
      safetyCorrectionApplied,
      strategyAction: strategy.action,
      dynamicLength: strategy.depth,
      detectedEmotion: emotion.state,
      suggestedFollowUps: strategy.suggestedFollowUpTopics,
    },
  };
}

// Re-export domain sub-modules for direct testing
export * from './intent/intentTypes';
export * from './intent/intentEngine';
export * from './emotion/emotionTypes';
export * from './emotion/emotionDetector';
export * from './consultation/consultationStateTypes';
export * from './consultation/consultationStateMachine';
export * from './memory/memoryTypes';
export * from './memory/memoryService';
export * from './memory/factExtractor';
export * from './astrology-context/contextBuilder';
export * from './astrology-context/topicMappings';
export * from './reasoning/reasoningTypes';
export * from './reasoning/timingEngine';
export * from './reasoning/astrologyReasoningEngine';
export * from './strategy/strategyTypes';
export * from './strategy/responseStrategyEngine';
export * from './strategy/followUpStrategy';
export * from './quality/responseQualityValidator';
export * from './quality/astrologerResponseEvaluator';
export * from './quality/fallbackGenerator';
