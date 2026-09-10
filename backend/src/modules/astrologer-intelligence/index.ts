import { randomUUID } from 'node:crypto';
import {
  AIProviderName,
  IntentCategory,
  ModelAlias,
  SupportedLanguage,
  type AstrologerMessage,
} from '@astroai/shared-types';
import { logger } from '../../shared/logger';
import { aiGateway } from '../ai';
import { messageNormalizer } from './normalizer/messageNormalizer';
import { conversationStateManager } from './context/conversationStateManager';
import { messageRelationEngine } from './relation/messageRelationEngine';
import { contextualClarificationEngine } from './clarification/contextualClarificationEngine';
import { responseRepetitionGuard } from './quality/responseRepetitionGuard';
import { genericResponseDetector } from './quality/genericResponseDetector';
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
import { responseQualityGate } from './quality/responseQualityGate';
import { getCrisisResponse } from '../astrologer/safety/crisisResponses';
import { validateResponseSafety } from '../astrologer/safety/outputSafetyValidator';
import { fallbackGenerator } from './quality/fallbackGenerator';
import { responseSelfHealer } from './quality/responseSelfHealer';
import { interactiveWidgetEngine } from './widget/interactiveWidgetEngine';
import { CoreIntent } from './intent/intentTypes';
import type { ReadingDepth } from './strategy/strategyTypes';
import type { InteractiveWidget, QuickReplyChip, GuruPersonaId } from '@astroai/shared-types';

export interface ExecuteConsultationInput {
  userId: string;
  conversationId?: string;
  birthProfileId: string | null;
  personaId?: GuruPersonaId | null;
  conversationHistory: AstrologerMessage[];
  userMessage: string;
  userName?: string | null;
  preferredLanguage?: SupportedLanguage | null;
  requestId?: string;
  onChunk?: (delta: string) => void;
}

export interface AstrologerConsultationResult {
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

  // 1. Message Normalization & Preprocessing (Hinglish, typos, concatenations)
  const normalizedInput = messageNormalizer.normalize(input.userMessage);

  // 2. Conversation State & Context Tracking
  const convState = conversationStateManager.deriveState(
    input.conversationHistory,
    input.preferredLanguage,
    {
      birthProfileAvailable: input.birthProfileId !== null,
      userProfileAvailable: !!input.userName,
    },
  );

  // 3. Language Resolution: Match detected language of user's message, falling back to session language
  let language: SupportedLanguage;
  if (normalizedInput.detectedLanguage === 'hi') {
    language = SupportedLanguage.HINDI;
  } else if (normalizedInput.detectedLanguage === 'en') {
    language = SupportedLanguage.ENGLISH;
  } else if (normalizedInput.detectedLanguage === 'hinglish') {
    language = SupportedLanguage.HINGLISH;
  } else if (convState.language === 'hi') {
    language = SupportedLanguage.HINDI;
  } else if (convState.language === 'hinglish') {
    language = SupportedLanguage.HINGLISH;
  } else if (input.preferredLanguage) {
    language = input.preferredLanguage;
  } else {
    language = SupportedLanguage.ENGLISH;
  }

  // 4. Message Relation Classification
  const relation = messageRelationEngine.classify(normalizedInput, convState);

  // 5. Fast Multi-Intent & Emotion Detection
  const intents = intentEngine.detectIntents(normalizedInput.normalized);
  const emotion = emotionDetector.detectEmotion(normalizedInput.normalized);

  // 6. Crisis Safety Gate
  if (intents.primary === CoreIntent.CRISIS_SELF_HARM) {
    const crisisText = getCrisisResponse(language);
    if (input.onChunk) {
      input.onChunk(crisisText);
    }
    return {
      responseText: crisisText,
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
  else if (intents.primary === CoreIntent.FAMILY_MATTERS) finalIntent = IntentCategory.FAMILY;
  else if (intents.primary === CoreIntent.COMPOUND_MARRIAGE_CAREER) finalIntent = IntentCategory.CAREER;
  else if (
    intents.primary === CoreIntent.MARRIAGE_TIMING ||
    intents.primary === CoreIntent.MARRIAGE_PROSPECTS ||
    intents.primary === CoreIntent.PARTNER_CHARACTERISTICS
  )
    finalIntent = IntentCategory.MARRIAGE;
  else if (
    intents.primary === CoreIntent.CAREER_GENERAL ||
    intents.primary === CoreIntent.CAREER_TIMING ||
    intents.primary === CoreIntent.CAREER_DECISION ||
    intents.primary === CoreIntent.JOB_CHANGE ||
    intents.primary === CoreIntent.PROMOTION_GROWTH ||
    intents.primary === CoreIntent.BUSINESS_VENTURE
  )
    finalIntent = IntentCategory.CAREER;
  else if (
    intents.primary === CoreIntent.FINANCE_GENERAL ||
    intents.primary === CoreIntent.WEALTH_TIMING ||
    intents.primary === CoreIntent.DEBT_EXPENSES ||
    intents.primary === CoreIntent.INVESTMENT_GUIDANCE ||
    intents.primary === CoreIntent.PROPERTY_VEHICLE
  )
    finalIntent = IntentCategory.MONEY;
  else if (intents.primary === CoreIntent.RELATIONSHIP_CURRENT_SITUATION || intents.primary === CoreIntent.LOVE_LIFE)
    finalIntent = IntentCategory.LOVE;
  else if (intents.primary === CoreIntent.RELATIONSHIP_COMPATIBILITY)
    finalIntent = IntentCategory.COMPATIBILITY;
  else if (intents.primary === CoreIntent.DAILY_HOROSCOPE || intents.primary === CoreIntent.DAILY_LUCKY_FACT)
    finalIntent = IntentCategory.DAILY_HOROSCOPE;
  else if (
    intents.primary === CoreIntent.AMBIGUOUS_EMOTION ||
    (intents.primary === CoreIntent.CASUAL_CHAT && /^(hmm|what do you think|kya lagta)/i.test(normalizedInput.normalized))
  )
    finalIntent = IntentCategory.UNCLEAR;
  else if (intents.primary === CoreIntent.INAPPROPRIATE_OR_SEXUAL)
    finalIntent = IntentCategory.UNSAFE;
  else {
    finalIntent = IntentCategory.GENERAL_ASTROLOGY;
  }

  // 7. Consultation State Machine
  const consultationState = consultationStateMachine.resolveNextState(
    input.conversationHistory.length,
    intents,
    input.birthProfileId !== null,
    convState.lastAssistantMessage,
  );

  // 8. Response Strategy Engine
  const strategy = responseStrategyEngine.determineStrategy(
    intents,
    emotion,
    consultationState,
    input.conversationHistory.length,
    language,
    normalizedInput.normalized,
  );

  // 9. Memory & Context Retrieval (Parallelized)
  const [persona, memory, astrology] = await Promise.all([
    personaManager.getActivePersona(),
    memoryService.getRelevantMemory(input.userId, intents.primary),
    contextBuilder.buildAstrologyContext(input.userId, input.birthProfileId, intents.primary),
  ]);

  // 10. Astrology Reasoning
  const reasoning = astrologyReasoningEngine.reason(astrology);

  // 11. Prompt Assembly
  const systemPrompt = promptAssembler.buildSystemPrompt({
    persona,
    personaId: input.personaId ?? undefined,
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
    relation,
    state: convState,
  });

  const messages = promptAssembler.buildMessages(
    systemPrompt,
    input.conversationHistory,
    input.userMessage,
  );

  const alias =
    finalIntent === IntentCategory.DAILY_HOROSCOPE ? ModelAlias.FAST_CHAT : ModelAlias.SMART_CHAT;

  // 12. Generation via AI Gateway (with safety validation, repetition guard, and Acharya fallback)
  let responseText = '';
  let usedFallback = false;
  let safetyCorrectionApplied = false;
  let provider: AIProviderName | null = null;
  let model: string | null = null;

  try {
    if (input.onChunk) {
      try {
        for await (const chunk of aiGateway.streamText({ alias, messages, requestId })) {
          if (chunk.delta) {
            responseText += chunk.delta;
            input.onChunk(chunk.delta);
          }
        }
        provider = AIProviderName.GEMINI;
        model = 'gemini-3.6-flash';
      } catch {
        const genResult = await aiGateway.generateText({
          alias,
          messages,
          requestId,
        });
        provider = genResult.meta.provider;
        model = genResult.meta.model;
        usedFallback = genResult.meta.usedFallback;
        responseText = genResult.text;
        if (input.onChunk && responseText) {
          input.onChunk(responseText);
        }
      }
    } else {
      const firstAttempt = await aiGateway.generateText({
        alias,
        messages,
        requestId,
      });

      provider = firstAttempt.meta.provider;
      model = firstAttempt.meta.model;
      usedFallback = firstAttempt.meta.usedFallback;
      responseText = firstAttempt.text;
    }

    let validation = validateResponseSafety(responseText);
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

    if (input.onChunk && responseText) {
      const words = responseText.split(' ');
      for (let i = 0; i < words.length; i++) {
        const isLast = i === words.length - 1;
        input.onChunk(words[i] + (isLast ? '' : ' '));
        if (!isLast) await new Promise((r) => setTimeout(r, 25));
      }
    }
  }

  // 12.5 Self-Healing & Natural Prose Harmonization
  responseText = responseSelfHealer.heal(responseText, {
    turnIndex: input.conversationHistory.length,
    userMessage: input.userMessage,
    isHinglish: language === SupportedLanguage.HINGLISH,
    isHindi: language === SupportedLanguage.HINDI,
  });

  // 13. Quality & Output Validator (Topic consistency & formatting)
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

  responseText = responseSelfHealer.heal(responseText, {
    turnIndex: input.conversationHistory.length,
    userMessage: input.userMessage,
    isHinglish: language === SupportedLanguage.HINGLISH,
    isHindi: language === SupportedLanguage.HINDI,
  });

  // 13.5 Quality Gate (Platitude pruning, template opening removal, unsolicited remedy strip)
  const qualityGateResult = responseQualityGate.inspectAndHeal({
    text: responseText,
    userMessage: input.userMessage,
    turnIndex: input.conversationHistory.length,
    isAstrologyExpected:
      intents.astrologyRelevance === 'REQUIRED' ||
      intents.astrologyRelevance === 'EXPLICITLY_REQUESTED' ||
      intents.astrologyRelevance === 'STRONGLY_RELEVANT' ||
      intents.astrologyRelevance === 'USEFUL',
  });
  responseText = qualityGateResult.healedText;

  // 14. Response Repetition Guard & Genericity Guard
  const userMessageChanged =
    convState.lastUserMessage !== null &&
    convState.lastUserMessage.trim().toLowerCase() !== input.userMessage.trim().toLowerCase();

  const repetitionCheck = responseRepetitionGuard.check(
    responseText,
    convState.recentAssistantResponses,
    userMessageChanged,
  );

  const genericityCheck = genericResponseDetector.detect(responseText, input.userMessage);

  if (repetitionCheck.isDuplicate || (usedFallback && genericityCheck.isGeneric)) {
    const clarification = contextualClarificationEngine.generateClarification(
      normalizedInput,
      convState,
    );
    responseText = clarification.question;
    usedFallback = true;
  }

  // 15. Decision Logging for Internal Observability (Item 36 in Specification)
  logger.info(
    {
      requestId,
      conversationId: input.conversationId,
      rawMessage: input.userMessage,
      normalizedMessage: normalizedInput.normalized,
      detectedLanguage: language,
      messageRelation: relation.relation,
      activeTopic: convState.currentTopic,
      detectedIntent: intents.primary,
      intentConfidence: intents.confidence,
      astrologyRelevance: intents.astrologyRelevance,
      astrologyActive: convState.astrologyActive,
      responseStrategy: strategy.action,
      usedFallback,
    },
    'Astrologer conversation intelligence decision logged',
  );

  // 16. Asynchronous Memory & Reading Summary Persistence
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

  // 17. Synthesize Interactive Widgets, Quick-Reply Chips, and Voice Note Metadata
  const widgetOutput = interactiveWidgetEngine.synthesize({
    userMessage: input.userMessage,
    intent: intents.primary,
    language,
    astrology,
  });

  return {
    responseText,
    language,
    intent: finalIntent,
    isCrisisResponse: false,
    followUpChips,
    quickReplyChips: widgetOutput.quickReplyChips,
    interactiveWidget: widgetOutput.interactiveWidget,
    audioDurationSeconds: widgetOutput.audioDurationSeconds,
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
export * from './normalizer/messageNormalizer';
export * from './context/conversationStateManager';
export * from './relation/messageRelationEngine';
export * from './clarification/contextualClarificationEngine';
export * from './quality/responseRepetitionGuard';
export * from './quality/genericResponseDetector';
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
export * from './quality/responseContextValidator';
export * from './quality/astrologerResponseEvaluator';
export * from './quality/adversarialConsultationEvaluator';
export * from './quality/fallbackGenerator';
export * from './quality/responseSelfHealer';
