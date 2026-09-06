export const ResponseAction = {
  DIRECT_ANSWER: 'DIRECT_ANSWER',
  ASK_CLARIFICATION: 'ASK_CLARIFICATION',
  EMPATHY_THEN_READING: 'EMPATHY_THEN_READING',
  CHART_READING_WITH_FOLLOWUP: 'CHART_READING_WITH_FOLLOWUP',
  DEEP_CONSULTATION: 'DEEP_CONSULTATION',
  OFFER_DEEPER_ANALYSIS: 'OFFER_DEEPER_ANALYSIS',
  GREETING_INTAKE: 'GREETING_INTAKE',
  GREET_AND_DISCOVER: 'GREET_AND_DISCOVER',
  ACKNOWLEDGE_SHORT: 'ACKNOWLEDGE_SHORT',
  HANDLE_AMBIGUITY: 'HANDLE_AMBIGUITY',
  SAFETY_GUARD: 'SAFETY_GUARD',
} as const;

export type ResponseAction = (typeof ResponseAction)[keyof typeof ResponseAction];

export const ReadingDepth = {
  QUICK: 'QUICK',
  STANDARD: 'STANDARD',
  DEEP: 'DEEP',
  PREMIUM: 'PREMIUM',
} as const;

export type ReadingDepth = (typeof ReadingDepth)[keyof typeof ReadingDepth];

export interface ResponseStrategy {
  action: ResponseAction;
  depth: ReadingDepth;
  leadWithEmpathy: boolean;
  askClarification: boolean;
  clarificationQuestion?: string;
  suggestedFollowUpTopics: string[];
}
