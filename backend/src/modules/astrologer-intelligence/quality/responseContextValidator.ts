import type { AstrologerMessage } from '@astroai/shared-types';
import type { MessageRelation } from '../relation/messageRelationEngine';
import type { AstrologyRelevance, ResponseMode, ConversationTopic } from '../intent/intentTypes';

export interface ValidateResponseContextInput {
  userMessage: string;
  normalizedMessage: string;
  recentMessages: AstrologerMessage[];
  activeTopic: ConversationTopic | string;
  activeIntent: string;
  messageRelation: MessageRelation;
  astrologyRelevance: AstrologyRelevance;
  responseMode: ResponseMode;
  response: string;
}

export interface ResponseContextValidationResult {
  isValid: boolean;
  reasons: string[];
  recommendation: 'PROCEED' | 'REGENERATE' | 'FALLBACK';
}

/**
 * Validates whether the draft response actually answers the user's latest
 * message, adheres to the active topic, and respects astrology relevance rules.
 */
export const responseContextValidator = {
  validate(input: ValidateResponseContextInput): ResponseContextValidationResult {
    const reasons: string[] = [];
    const lowerRes = input.response.toLowerCase();
    const lowerUser = input.userMessage.toLowerCase();

    // 1. Is astrology used inappropriately when NOT_RELEVANT?
    if (
      input.astrologyRelevance === 'NOT_RELEVANT' ||
      input.responseMode === 'PRACTICAL_GUIDANCE' ||
      input.responseMode === 'CASUAL_CONVERSATION'
    ) {
      if (
        /\b(planetary transit|current transit|jupiter is influencing|saturn is aspecting|rahu transit|dasha indicates)\b/i.test(
          lowerRes,
        )
      ) {
        reasons.push('Astrology planetary claims invoked on a non-astrological message');
      }
      if (/\b(date of birth|time of birth|place of birth|birth details)\b/i.test(lowerRes)) {
        reasons.push('Birth details demanded on a non-astrological inquiry');
      }
    }

    // 2. Is the response a repetitive broad generic menu when user gave specific input?
    if (
      /\b(kis vishay par baat karna|personal life, career ya kuch aur|what life area would you like to explore)\b/i.test(
        lowerRes,
      ) &&
      !/^(hello|hi|namaste|pranam|hey)[!.,\s]*$/i.test(lowerUser.trim())
    ) {
      reasons.push('Generic multi-choice fallback menu served on a specific user message');
    }

    // 3. Does it address an incident if user reported falling/injury?
    if (input.responseMode === 'PRACTICAL_GUIDANCE' || input.activeTopic === 'INCIDENT') {
      if (!/chot|gir|road|hurt|injury|slip|doctor|care/i.test(lowerRes)) {
        reasons.push('Did not acknowledge physical incident or check for injury');
      }
    }

    // 4. Response length check for casual chat
    if (input.responseMode === 'CASUAL_CONVERSATION' && input.response.split(/\s+/).length > 130) {
      reasons.push('Response too verbose for casual conversation');
    }

    const isValid = reasons.length === 0;
    return {
      isValid,
      reasons,
      recommendation: isValid ? 'PROCEED' : 'REGENERATE',
    };
  },
};
