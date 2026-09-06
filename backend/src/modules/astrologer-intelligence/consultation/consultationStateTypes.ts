export const ConsultationState = {
  IDLE: 'IDLE',
  UNDERSTANDING_CONCERN: 'UNDERSTANDING_CONCERN',
  CLARIFYING: 'CLARIFYING',
  COLLECTING_CONTEXT: 'COLLECTING_CONTEXT',
  ASTROLOGY_ANALYSIS: 'ASTROLOGY_ANALYSIS',
  INTERPRETATION: 'INTERPRETATION',
  EXPLANATION: 'EXPLANATION',
  FOLLOW_UP: 'FOLLOW_UP',
  DEEPER_ANALYSIS: 'DEEPER_ANALYSIS',
  CLOSING: 'CLOSING',
} as const;

export type ConsultationState = (typeof ConsultationState)[keyof typeof ConsultationState];

export interface ConsultationSessionContext {
  currentState: ConsultationState;
  turnCount: number;
  lastIntent: string | null;
  activeTopic: string | null;
  pendingClarificationQuestion?: string | null;
  contextCollected: Record<string, any>;
}
