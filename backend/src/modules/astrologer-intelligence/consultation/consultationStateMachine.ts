import { CoreIntent, type DetectedIntents } from '../intent/intentTypes';
import { ConsultationState } from './consultationStateTypes';

export const consultationStateMachine = {
  resolveNextState(
    _historyLength: number,
    intents: DetectedIntents,
    _hasBirthProfile: boolean,
    priorAssistantMessage: string | null,
  ): ConsultationState {
    // Greeting or intake at any point in conversation
    if (intents.primary === CoreIntent.GREETING_INTAKE) {
      return ConsultationState.UNDERSTANDING_CONCERN;
    }

    // Short acknowledgments & casual chat
    if (
      intents.primary === CoreIntent.SHORT_ACKNOWLEDGMENT ||
      intents.primary === CoreIntent.CASUAL_CHAT
    ) {
      return ConsultationState.FOLLOW_UP;
    }

    // Safety gates bypass standard consultation flow
    if (
      intents.primary === CoreIntent.CRISIS_SELF_HARM ||
      intents.primary === CoreIntent.UNSAFE_PREDICTION ||
      intents.primary === CoreIntent.MEDICAL_QUERY
    ) {
      return ConsultationState.EXPLANATION;
    }

    // If query is ambiguous (e.g. "Dil dhadkne laga", "Main confuse hoon")
    if (
      intents.primary === CoreIntent.AMBIGUOUS_EMOTION ||
      intents.astrologyRelevance === 'AMBIGUOUS' ||
      intents.requiresClarification
    ) {
      return ConsultationState.CLARIFYING;
    }

    // If user asked about relationship situation needing human context first
    if (
      intents.primary === CoreIntent.RELATIONSHIP_CURRENT_SITUATION ||
      intents.primary === CoreIntent.RELATIONSHIP_CONFLICT ||
      intents.primary === CoreIntent.BREAKUP
    ) {
      // If prior message already asked clarification, move to astrology analysis
      if (priorAssistantMessage && (priorAssistantMessage.includes('?') || priorAssistantMessage.includes('kya'))) {
        return ConsultationState.ASTROLOGY_ANALYSIS;
      }
      return ConsultationState.COLLECTING_CONTEXT;
    }

    // If user asks a direct astrology query (e.g. Marriage timing, Career timing, Dhan)
    if (intents.astrologyRelevance === 'REQUIRED') {
      return ConsultationState.ASTROLOGY_ANALYSIS;
    }

    return ConsultationState.INTERPRETATION;
  },
};
