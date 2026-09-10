/**
 * Response Repetition Guard
 * Ensures that different user messages in a conversation never receive identical or nearly identical responses.
 */

function tokenize(text: string): Set<string> {
  const clean = text.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, ' ');
  return new Set(clean.split(/\s+/).filter((t) => t.length > 2));
}

function calculateJaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export interface RepetitionCheckResult {
  isDuplicate: boolean;
  maxSimilarity: number;
  matchedPreviousResponse?: string;
  reason?: string;
}

export const responseRepetitionGuard = {
  /**
   * Checks if candidateResponse is a near-duplicate of recent assistant responses in this conversation.
   * Threshold: 0.65 (65% token overlap) or exact normalized string match.
   */
  check(
    candidateResponse: string,
    recentAssistantResponses: string[],
    userMessageChanged: boolean,
  ): RepetitionCheckResult {
    if (!userMessageChanged || recentAssistantResponses.length === 0) {
      return { isDuplicate: false, maxSimilarity: 0 };
    }

    const candidateNorm = candidateResponse.trim().toLowerCase();

    for (const prev of recentAssistantResponses) {
      const prevNorm = prev.trim().toLowerCase();

      // Exact duplicate
      if (candidateNorm === prevNorm) {
        return {
          isDuplicate: true,
          maxSimilarity: 1.0,
          matchedPreviousResponse: prev,
          reason: 'Exact duplicate of previous assistant response',
        };
      }

      // High semantic token overlap
      const sim = calculateJaccardSimilarity(candidateResponse, prev);
      if (sim >= 0.65) {
        return {
          isDuplicate: true,
          maxSimilarity: sim,
          matchedPreviousResponse: prev,
          reason: `High semantic overlap (${Math.round(sim * 100)}%) with previous assistant response`,
        };
      }
    }

    return { isDuplicate: false, maxSimilarity: 0 };
  },
};
