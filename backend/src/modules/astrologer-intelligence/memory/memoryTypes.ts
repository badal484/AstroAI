export const MemoryCategory = {
  CAREER: 'CAREER',
  RELATIONSHIP: 'RELATIONSHIP',
  FAMILY: 'FAMILY',
  FINANCE: 'FINANCE',
  GOALS: 'GOALS',
  PREFERENCES: 'PREFERENCES',
  IMPORTANT_EVENTS: 'IMPORTANT_EVENTS',
} as const;

export type MemoryCategory = (typeof MemoryCategory)[keyof typeof MemoryCategory];

export interface UserMemoryItem {
  id: string;
  userId: string;
  category: MemoryCategory;
  fact: string;
  sourceConversationId?: string;
  createdAt: Date;
}

export interface PreviousReadingItem {
  id: string;
  userId: string;
  conversationId: string;
  topic: string;
  summary: string;
  keyAstrologicalFactors: string[];
  recommendedFollowUps: string[];
  createdAt: Date;
}

export interface UserStory {
  relationshipContext?: UserMemoryItem[];
  careerContext?: UserMemoryItem[];
  financialGoals?: UserMemoryItem[];
  familyContext?: UserMemoryItem[];
  personalGoals?: UserMemoryItem[];
  previousReadings?: PreviousReadingItem[];
  importantPreferences?: UserMemoryItem[];
}

export interface RetrievedConsultationMemory {
  relevantMemories: UserMemoryItem[];
  previousReadings: PreviousReadingItem[];
  userStory?: UserStory;
  summaryText: string;
}
