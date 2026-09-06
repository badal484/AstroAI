export const EmotionalState = {
  ANXIOUS: 'ANXIOUS',
  FEARFUL: 'FEARFUL',
  CONFUSED: 'CONFUSED',
  FRUSTRATED: 'FRUSTRATED',
  SAD: 'SAD',
  HOPEFUL: 'HOPEFUL',
  EXCITED: 'EXCITED',
  UNCERTAIN: 'UNCERTAIN',
  CURIOUS: 'CURIOUS',
  NEUTRAL: 'NEUTRAL',
} as const;

export type EmotionalState = (typeof EmotionalState)[keyof typeof EmotionalState];

export interface EmotionalContext {
  state: EmotionalState;
  intensity: 'LOW' | 'MODERATE' | 'HIGH';
  requiresEmpathyFirst: boolean;
  underlyingConcern?: string;
}
