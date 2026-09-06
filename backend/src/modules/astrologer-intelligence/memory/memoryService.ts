import { UserMemoryModel } from './userMemory.model';
import { ReadingSummaryModel } from './readingSummary.model';
import {
  MemoryCategory,
  type RetrievedConsultationMemory,
  type UserMemoryItem,
  type PreviousReadingItem,
  type UserStory
} from './memoryTypes';
import { factExtractor } from './factExtractor';

export const memoryService = {
  async getUserStory(userId: string): Promise<UserStory> {
    try {
      const [memoriesDocs, readingsDocs] = await Promise.all([
        UserMemoryModel.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
        ReadingSummaryModel.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      const allMemories: UserMemoryItem[] = memoriesDocs.map((doc: any) => ({
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        category: doc.category,
        fact: doc.fact,
        sourceConversationId: doc.sourceConversationId?.toString(),
        createdAt: doc.createdAt,
      }));

      const previousReadings: PreviousReadingItem[] = readingsDocs.map((doc: any) => ({
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        conversationId: doc.conversationId.toString(),
        topic: doc.topic,
        summary: doc.summary,
        keyAstrologicalFactors: doc.keyAstrologicalFactors,
        recommendedFollowUps: doc.recommendedFollowUps,
        createdAt: doc.createdAt,
      }));

      return {
        relationshipContext: allMemories.filter(m => m.category === MemoryCategory.RELATIONSHIP),
        careerContext: allMemories.filter(m => m.category === MemoryCategory.CAREER),
        financialGoals: allMemories.filter(m => m.category === MemoryCategory.FINANCE || m.category === MemoryCategory.GOALS),
        familyContext: allMemories.filter(m => m.category === MemoryCategory.FAMILY),
        personalGoals: allMemories.filter(m => m.category === MemoryCategory.GOALS),
        importantPreferences: allMemories.filter(m => m.category === MemoryCategory.PREFERENCES),
        previousReadings,
      };
    } catch {
      return {};
    }
  },

  async getRelevantMemory(userId: string, intent: string): Promise<RetrievedConsultationMemory> {
    try {
      // Map intent to relevant memory category
      let categoryFilter: MemoryCategory[] = [];
      if (intent.includes('CAREER') || intent.includes('JOB') || intent.includes('BUSINESS')) {
        categoryFilter = [MemoryCategory.CAREER, MemoryCategory.GOALS];
      } else if (intent.includes('MARRIAGE') || intent.includes('RELATIONSHIP') || intent.includes('LOVE')) {
        categoryFilter = [MemoryCategory.RELATIONSHIP, MemoryCategory.FAMILY];
      } else if (intent.includes('FINANCE') || intent.includes('WEALTH')) {
        categoryFilter = [MemoryCategory.FINANCE, MemoryCategory.CAREER, MemoryCategory.GOALS];
      } else if (intent.includes('EDUCATION') || intent.includes('FOREIGN')) {
        categoryFilter = [MemoryCategory.GOALS, MemoryCategory.CAREER];
      }

      const query: any = { userId };
      if (categoryFilter.length > 0) {
        query.category = { $in: categoryFilter };
      }

      const [memoriesDocs, readingsDocs] = await Promise.all([
        UserMemoryModel.find(query).sort({ createdAt: -1 }).limit(5).lean(),
        ReadingSummaryModel.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
      ]);

      const relevantMemories: UserMemoryItem[] = memoriesDocs.map((doc: any) => ({
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        category: doc.category,
        fact: doc.fact,
        sourceConversationId: doc.sourceConversationId?.toString(),
        createdAt: doc.createdAt,
      }));

      const previousReadings: PreviousReadingItem[] = readingsDocs.map((doc: any) => ({
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        conversationId: doc.conversationId.toString(),
        topic: doc.topic,
        summary: doc.summary,
        keyAstrologicalFactors: doc.keyAstrologicalFactors,
        recommendedFollowUps: doc.recommendedFollowUps,
        createdAt: doc.createdAt,
      }));

      const userStory: UserStory = {
        relationshipContext: relevantMemories.filter(m => m.category === MemoryCategory.RELATIONSHIP),
        careerContext: relevantMemories.filter(m => m.category === MemoryCategory.CAREER),
        financialGoals: relevantMemories.filter(m => m.category === MemoryCategory.FINANCE || m.category === MemoryCategory.GOALS),
        familyContext: relevantMemories.filter(m => m.category === MemoryCategory.FAMILY),
        personalGoals: relevantMemories.filter(m => m.category === MemoryCategory.GOALS),
        importantPreferences: relevantMemories.filter(m => m.category === MemoryCategory.PREFERENCES),
        previousReadings,
      };

      const summaryParts: string[] = [];
      if (relevantMemories.length > 0) {
        summaryParts.push(
          'User Background & Story Context:\n' +
            relevantMemories.map((m) => `• [${m.category}] ${m.fact}`).join('\n'),
        );
      }
      if (previousReadings.length > 0) {
        summaryParts.push(
          'Previous Consultations Summary:\n' +
            previousReadings
              .map((r) => `• Topic: ${r.topic} (${r.createdAt.toLocaleDateString()}) - ${r.summary}`)
              .join('\n'),
        );
      }

      if (intent.includes('MEMORY_RECALL')) {
        if (relevantMemories.length === 0 && previousReadings.length === 0) {
          summaryParts.push(
            `CRITICAL MEMORY DIRECTIVE: The user asked about a past conversation, but NO previous record was found in memory. State honestly: "I don't have that part of our earlier conversation available right now, but please share the details and we will examine how your chart aligns." NEVER invent or hallucinate past discussions.`,
          );
        } else {
          summaryParts.push(
            `MEMORY RECALL CONTEXT: Acknowledge the relevant past discussions noted above naturally to maintain consultation continuity.`,
          );
        }
      }

      return {
        relevantMemories,
        previousReadings,
        userStory,
        summaryText: summaryParts.join('\n\n'),
      };
    } catch {
      return { relevantMemories: [], previousReadings: [], summaryText: '' };
    }
  },

  async extractAndSaveFacts(userId: string, text: string, sourceConversationId?: string): Promise<void> {
    try {
      const extracted = factExtractor.extractFactsFromMessage(text);
      if (extracted.length > 0) {
        for (const item of extracted) {
          await UserMemoryModel.create({
            userId,
            category: item.category,
            fact: item.fact,
            sourceConversationId: sourceConversationId ?? null,
          });
        }
      }
    } catch {
      // Non-blocking background fact extraction
    }
  },

  async recordMemory(
    userId: string,
    category: MemoryCategory,
    fact: string,
    sourceConversationId?: string,
  ): Promise<void> {
    try {
      await UserMemoryModel.create({
        userId,
        category,
        fact,
        sourceConversationId: sourceConversationId ?? null,
      });
    } catch {
      // Non-blocking memory persistence
    }
  },

  async recordReadingSummary(
    userId: string,
    conversationId: string,
    topic: string,
    summary: string,
    keyAstrologicalFactors: string[] = [],
    recommendedFollowUps: string[] = [],
  ): Promise<void> {
    try {
      await ReadingSummaryModel.create({
        userId,
        conversationId,
        topic,
        summary,
        keyAstrologicalFactors,
        recommendedFollowUps,
      });
    } catch {
      // Non-blocking summary persistence
    }
  },
};
