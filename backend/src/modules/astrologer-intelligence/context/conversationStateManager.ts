import type { AstrologerMessage } from '@astroai/shared-types';
import type { ConversationTopic, PendingConversationQuestion } from '../intent/intentTypes';

export type { ConversationTopic, PendingConversationQuestion };

export type AwaitingAnswerType =
  | 'CAUSE_OF_EMOTIONAL_STATE'
  | 'PHYSICAL_INJURY_STATUS'
  | 'RELATIONSHIP_CLARIFICATION'
  | 'CAREER_CLARIFICATION'
  | 'BIRTH_DETAIL_CONFIRMATION'
  | 'GENERAL_CLARIFICATION'
  | 'YES_NO'
  | 'DISMISSAL'
  | 'FOLLOW_UP';

export interface ConversationContext {
  currentTopic: ConversationTopic | string;
  previousTopic: ConversationTopic | string | null;
  currentIntent: string | null;
  previousUserMessage: string | null;
  previousAssistantMessage: string | null;
  previousAssistantQuestion: string | null;
  unresolvedQuestion: string | null;
  lastUserAnswer: string | null;
  lastUserAnswerType: string | null;
  emotionalState: string;
  consultationState: string;
  language: 'en' | 'hi' | 'hinglish';
  userProfileAvailable: boolean;
  birthProfileAvailable: boolean;
  astrologyRelevant: boolean;
  relevantChartContext: string | null;
  previousReadingContext: string | null;
  conversationDepth: number;

  // Backwards compatibility aliases
  lastUserMessage: string | null;
  lastAssistantMessage: string | null;
  lastAssistantQuestion: string | null;
  pendingQuestion: PendingConversationQuestion | null;
  awaitingAnswer: boolean;
  awaitingAnswerType: AwaitingAnswerType | null;
  activeIntent: string | null;
  astrologyActive: boolean;
  recentMessages: AstrologerMessage[];
  recentAssistantResponses: string[];
}

export type ActiveConversationState = ConversationContext;

export const conversationStateManager = {
  /**
   * Derives rich conversation context directly from the message history and current runtime inputs.
   */
  deriveState(
    history: AstrologerMessage[],
    preferredLanguage?: 'en' | 'hi' | 'hinglish' | null,
    extra?: {
      birthProfileAvailable?: boolean;
      userProfileAvailable?: boolean;
      emotionalState?: string;
      consultationState?: string;
    },
  ): ConversationContext {
    const recentMessages = history.slice(-8);
    const assistantMessages = history
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content);

    const userMessages = history
      .filter((m) => m.role === 'user')
      .map((m) => m.content);

    const lastAssistantMessage = assistantMessages.length > 0
      ? (assistantMessages[assistantMessages.length - 1] ?? null)
      : null;

    const lastUserMessage = userMessages.length > 0
      ? (userMessages[userMessages.length - 1] ?? null)
      : null;

    // Detect if last assistant message posed a question
    let lastAssistantQuestion: string | null = null;
    let awaitingAnswer = false;
    let awaitingAnswerType: AwaitingAnswerType | null = null;

    if (lastAssistantMessage) {
      const trimmed = lastAssistantMessage.trim();
      const questionIndex = trimmed.lastIndexOf('?');
      if (questionIndex !== -1) {
        const sentences = trimmed.split(/(?<=[.?!])\s+/);
        const lastSentence = sentences[sentences.length - 1] || trimmed;
        if (lastSentence.includes('?')) {
          lastAssistantQuestion = lastSentence.trim();
          awaitingAnswer = true;

          const lowerQ = lastAssistantQuestion.toLowerCase();
          if (/special person|kisi specific person|unexpected|dhadak|bechain|tension|heavy/i.test(lowerQ)) {
            awaitingAnswerType = 'CAUSE_OF_EMOTIONAL_STATE';
          } else if (/chot|injury|doctor|gir|pain|dard/i.test(lowerQ)) {
            awaitingAnswerType = 'PHYSICAL_INJURY_STATUS';
          } else if (/fight|partner|girlfriend|boyfriend|shaadi|shadi/i.test(lowerQ)) {
            awaitingAnswerType = 'RELATIONSHIP_CLARIFICATION';
          } else if (/job|career|interview|business/i.test(lowerQ)) {
            awaitingAnswerType = 'CAREER_CLARIFICATION';
          } else if (/date of birth|time of birth|birth place|janam/i.test(lowerQ)) {
            awaitingAnswerType = 'BIRTH_DETAIL_CONFIRMATION';
          } else {
            awaitingAnswerType = 'GENERAL_CLARIFICATION';
          }
        }
      }
    }

    // Determine current & previous topics across conversation history
    let currentTopic: ConversationTopic = 'GENERAL';
    let previousTopic: ConversationTopic | null = null;
    let astrologyActive = false;

    for (const msg of history) {
      const text = msg.content.toLowerCase();
      let topic: ConversationTopic | null = null;

      if (/shaadi|shadi|marriage|vivah/i.test(text)) {
        topic = 'MARRIAGE';
        astrologyActive = true;
      } else if (/kundli|horoscope|dasha|rashi|nakshatra|graha|planet/i.test(text)) {
        topic = 'ASTROLOGY';
        astrologyActive = true;
      } else if (/career|job|naukri|business|promotion|switch/i.test(text)) {
        topic = 'CAREER';
      } else if (/paisa|paise|dhan|money|wealth|finance/i.test(text)) {
        topic = 'MONEY';
      } else if (/family|parents|mummy|papa|parivar/i.test(text)) {
        topic = 'FAMILY';
      } else if (/girlfriend|boyfriend|gf|bf|partner|pyaar|love/i.test(text)) {
        topic = 'LOVE';
      } else if (/fight|breakup|block|ladai|jhagda/i.test(text)) {
        topic = 'RELATIONSHIP';
      } else if (/gir gaya|gir gya|chot|accident|road|pain|dard|hospital/i.test(text)) {
        topic = 'INCIDENT';
      } else if (/bechain|dhadak|sad|stress|tension|mood off|heavy/i.test(text)) {
        topic = 'EMOTIONAL';
      }

      if (topic && topic !== currentTopic) {
        previousTopic = currentTopic;
        currentTopic = topic;
      }
    }

    let pendingQuestion: PendingConversationQuestion | null = null;
    if (lastAssistantQuestion) {
      let expectedType: PendingConversationQuestion['expectedAnswerType'] = 'free_text';
      const lowerQ = lastAssistantQuestion.toLowerCase();
      if (/special person|kisi specific person|girlfriend|boyfriend|gf|bf/i.test(lowerQ)) {
        expectedType = 'person';
      } else if (/wajah|reason|kyu|kyun/i.test(lowerQ)) {
        expectedType = 'reason';
      } else if (/chot|injury|doctor|hospital|kya ye/i.test(lowerQ)) {
        expectedType = 'yes_no';
      } else if (/kya hua|kuch hua|unexpected/i.test(lowerQ)) {
        expectedType = 'event';
      } else if (/date of birth|birth details|time of birth/i.test(lowerQ)) {
        expectedType = 'birth_detail';
      }

      pendingQuestion = {
        questionText: lastAssistantQuestion,
        expectedAnswerType: expectedType,
        topic: currentTopic,
        createdAt: new Date(),
      };
    }

    // Infer ongoing conversation language from history
    let sessionLanguage: 'en' | 'hi' | 'hinglish' = preferredLanguage || 'hinglish';
    for (const msg of history) {
      if (/[\u0900-\u097F]/.test(msg.content)) {
        sessionLanguage = 'hi';
        break;
      }
      if (
        /\b(aap|aapka|aapki|aapke|mera|meri|mere|hai|hain|hoon|ho|kya|kyu|kyun|kab|kaise|kaisa|kaisi|bataiye|batao|karo|karein|shadi|shaadi|kundli|naukri|ladai|paani|dil|mann|chot|dhadak|bechain|thoda|zara|baat|kaam|rishta|office)\b/i.test(
          msg.content,
        )
      ) {
        sessionLanguage = 'hinglish';
      }
    }

    // Classify last user answer type if user answered
    let lastUserAnswerType: string | null = null;
    if (lastUserMessage) {
      const lowerLastUser = lastUserMessage.toLowerCase().trim();
      if (/^(haan|ha|hn|yes|yeah|nahi|nhi|na|no|nope)\b/i.test(lowerLastUser)) {
        lastUserAnswerType = 'YES_NO';
      } else if (/^(nothing|kuch nahi|kuch nhi|chhod|chhodo|rehne do)\b/i.test(lowerLastUser)) {
        lastUserAnswerType = 'DISMISSAL';
      } else if (/^(boli|boliye|bolo|batao|bataiye|suno)\b/i.test(lowerLastUser)) {
        lastUserAnswerType = 'CONTINUATION_PROMPT';
      } else if (/^(kab|kyu|kyun|kaise|phir|matlab|aur)\b/i.test(lowerLastUser)) {
        lastUserAnswerType = 'FOLLOW_UP_INTERROGATIVE';
      }
    }

    // Extract previous reading context if any
    const previousReadingContext: string | null = assistantMessages.length > 0
      ? (assistantMessages[assistantMessages.length - 1] ?? null)
      : null;

    return {
      currentTopic,
      previousTopic,
      currentIntent: null,
      previousUserMessage: lastUserMessage,
      previousAssistantMessage: lastAssistantMessage,
      previousAssistantQuestion: lastAssistantQuestion,
      unresolvedQuestion: awaitingAnswer ? lastAssistantQuestion : null,
      lastUserAnswer: lastUserMessage,
      lastUserAnswerType,
      emotionalState: extra?.emotionalState || 'NEUTRAL',
      consultationState: extra?.consultationState || 'IN_PROGRESS',
      language: sessionLanguage,
      userProfileAvailable: extra?.userProfileAvailable ?? true,
      birthProfileAvailable: extra?.birthProfileAvailable ?? false,
      astrologyRelevant: astrologyActive,
      relevantChartContext: null,
      previousReadingContext,
      conversationDepth: history.length,

      // Backwards compatibility
      lastUserMessage,
      lastAssistantMessage,
      lastAssistantQuestion,
      pendingQuestion,
      awaitingAnswer,
      awaitingAnswerType,
      activeIntent: null,
      astrologyActive,
      recentMessages,
      recentAssistantResponses: assistantMessages.slice(-5),
    };
  },
};
