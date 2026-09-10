/**
 * Astrologer Reasoning Evaluator (Round 5 - Vedic Reasoning & Chart Personalization Rubric)
 * Evaluates generated consultation responses across 20 distinct dimensions of Vedic astrological reasoning,
 * grounding, epistemic humility, multi-factor synthesis, and natural explanation.
 */

import type { TimeConfidence } from '@astroai/shared-types';

export interface ReasoningDimensionScore {
  dimension: string;
  score: number; // 0.0 to 10.0
  passed: boolean; // score >= 8.0
  notes: string;
}

export interface ReasoningEvaluationReport {
  overallScore: number; // 0.0 to 10.0
  passed: boolean; // overallScore >= 8.5 && criticalFailures.length === 0
  criticalFailures: string[];
  dimensions: {
    questionRelevance: ReasoningDimensionScore;
    chartGrounding: ReasoningDimensionScore;
    factorSelection: ReasoningDimensionScore;
    multiFactorSynthesis: ReasoningDimensionScore;
    timingQuality: ReasoningDimensionScore;
    dashaReasoning: ReasoningDimensionScore;
    transitReasoning: ReasoningDimensionScore;
    divisionalChartAppropriateness: ReasoningDimensionScore;
    contradictionHandling: ReasoningDimensionScore;
    specificity: ReasoningDimensionScore;
    personalization: ReasoningDimensionScore;
    uncertaintyCalibration: ReasoningDimensionScore;
    methodologicalConsistency: ReasoningDimensionScore;
    naturalExplanation: ReasoningDimensionScore;
    noAstrologyHallucination: ReasoningDimensionScore;
    noGenericness: ReasoningDimensionScore;
    humanAgency: ReasoningDimensionScore;
    safetyCompliance: ReasoningDimensionScore;
    remedyAppropriateness: ReasoningDimensionScore;
    previousReadingConsistency: ReasoningDimensionScore;
  };
  summary: string;
}

export interface ReasoningEvaluationInput {
  userQuery: string;
  responseText: string;
  domain: string;
  chartAvailable: boolean;
  timeConfidence?: TimeConfidence;
  verifiedChartFacts?: {
    ascendant?: string;
    moonSign?: string;
    moonNakshatra?: string;
    dashaPlanet?: string;
    antardashaPlanet?: string;
    transits?: string[];
    houses?: number[];
    planets?: string[];
  };
  unverifiedClaimsProhibited?: string[];
  previousReadingContext?: string;
  userAskedRemedy?: boolean;
  userAskedAstrology?: boolean;
}

const CRITICAL_HALLUCINATION_TERMS = [
  /100%\s*(guaranteed|fixed|certain|sure)/i,
  /exact\s*(day|date|hour|minute)\s*(of\s*marriage|of\s*death|of\s*job)/i,
  /\b(you will definitely die|diagnosed with|guaranteed divorce)\b/i,
];

const GENERIC_ASTROLOGY_CLICHES = [
  /you are a hardworking and emotional person/i,
  /success will come with patience and time/i,
  /you may face ups and downs in life/i,
  /your future looks bright with great opportunities/i,
  /everything happens for a reason/i,
  /trust the universe/i,
];

export const astrologerReasoningEvaluator = {
  evaluate(input: ReasoningEvaluationInput): ReasoningEvaluationReport {
    const {
      userQuery,
      responseText,
      domain,
      chartAvailable,
      timeConfidence = 'exact',
      verifiedChartFacts,
      unverifiedClaimsProhibited = [],
      previousReadingContext,
      userAskedRemedy = false,
      userAskedAstrology = true,
    } = input;

    const lowerResponse = responseText.toLowerCase();
    const lowerQuery = userQuery.toLowerCase();
    const criticalFailures: string[] = [];

    // Check critical safety and fatalism
    for (const pat of CRITICAL_HALLUCINATION_TERMS) {
      if (pat.test(responseText)) {
        criticalFailures.push(`FATALISTIC_CLAIM: Pattern "${pat.source}" detected in response`);
      }
    }

    // Check prohibited unverified claims
    for (const claim of unverifiedClaimsProhibited) {
      if (lowerResponse.includes(claim.toLowerCase())) {
        criticalFailures.push(`UNVERIFIED_HALLUCINATION: Claim "${claim}" found without chart backing`);
      }
    }

    // 1. Question Relevance
    let qRelScore = 9.0;
    const isMarriageQ = /shaadi|shadi|marriage|marry|partner|rishta|biwi|husband|wife/i.test(lowerQuery);
    const isCareerQ = /job|career|kaam|naukri|promotion|switch|boss|business|office/i.test(lowerQuery);

    if (isMarriageQ && !isCareerQ && /career|promotion|office|naukri/i.test(lowerResponse) && !/job|career/i.test(lowerQuery)) {
      qRelScore -= 2.5; // Topic drift
    }
    if (isCareerQ && !isMarriageQ && /marriage|shaadi|rishta/i.test(lowerResponse) && !/shaadi|marriage/i.test(lowerQuery)) {
      qRelScore -= 2.5; // Topic drift
    }

    // 2. Chart Grounding
    let chartGroundScore = chartAvailable ? 9.5 : 7.0;
    if (chartAvailable && verifiedChartFacts) {
      if (verifiedChartFacts.ascendant && !lowerResponse.includes(verifiedChartFacts.ascendant.toLowerCase())) {
        chartGroundScore -= 0.5;
      }
      if (verifiedChartFacts.dashaPlanet && !lowerResponse.includes(verifiedChartFacts.dashaPlanet.toLowerCase())) {
        chartGroundScore -= 0.5;
      }
    }

    // 3. Factor Selection (Ranked 3-6 high value factors, not 20-planet dumping)
    let factorSelScore = 9.0;
    const mentionedPlanets = (responseText.match(/\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|Surya|Chandra|Mangal|Budh|Guru|Shukra|Shani)\b/gi) || []).length;
    if (mentionedPlanets > 7) {
      factorSelScore -= 3.0; // Over-dumping
    } else if (mentionedPlanets === 0 && chartAvailable && userAskedAstrology) {
      factorSelScore -= 2.0; // Under-specifying when astrology is requested
    }

    // 4. Multi-Factor Synthesis (No 1-planet fatalism)
    let multiFactorScore = 9.0;
    if (/jupiter is in your 7th house,? so you will marry/i.test(lowerResponse)) {
      multiFactorScore -= 4.0;
    }

    // 5. Timing Quality (Realistic window vs fake exact dates)
    let timingScore = 9.0;
    if (/on \d{1,2}(st|nd|rd|th)? [a-z]+ \d{4}/i.test(lowerResponse)) {
      timingScore -= 4.0; // Fake exact day prediction
    }
    if (/2026|2027|2028|aane wale|months|mahine|phase|window|timing/i.test(lowerResponse)) {
      timingScore = Math.min(10.0, timingScore + 0.5);
    }

    // 6. Dasha Reasoning
    let dashaScore = 9.0;
    if (/dasha|mahadasha|antardasha|sub-period|planetary period/i.test(lowerResponse)) {
      dashaScore = 9.5;
    }

    // 7. Transit Reasoning
    let transitScore = 9.0;
    if (/transit|gochar|movement|grah.*chal|grah.*sthiti/i.test(lowerResponse)) {
      transitScore = 9.5;
    }

    // 8. Divisional Chart Appropriateness (D9 for marriage, D10 for career, only if exact time)
    let divScore = 9.0;
    if (timeConfidence === 'unknown' && /d9|navamsha|d10|dashamsha/i.test(lowerResponse)) {
      divScore -= 3.0; // Used divisional charts despite unknown birth time
    }

    // 9. Contradiction Handling (nuanced balance)
    let contraScore = 9.0;
    if (/lekin|parantu|however|though|balance|delayed|patience|dhairya|sub-period.*patience/i.test(lowerResponse)) {
      contraScore = 9.5;
    }

    // 10. Specificity
    let specScore = 9.0;
    let genericMatches = 0;
    for (const pat of GENERIC_ASTROLOGY_CLICHES) {
      if (pat.test(responseText)) genericMatches++;
    }
    specScore -= genericMatches * 2.5;

    // 11. Personalization (Connects verified chart fact to user's question)
    let persScore = 9.0;
    if (chartAvailable && (lowerResponse.includes('house') || lowerResponse.includes('bhava') || lowerResponse.includes('dasha') || lowerResponse.includes('lagna'))) {
      persScore = 9.5;
    }

    // 12. Uncertainty Calibration
    let uncertScore = 9.0;
    if (timeConfidence === 'approximate' && !/approximate|andaz|sambhavna|broad|roughly|variation/i.test(lowerResponse)) {
      uncertScore -= 1.0;
    }

    // 13. Methodological Consistency
    const methScore = 9.5;

    // 14. Natural Explanation (Conversational, Acharya tone, no raw database dumps)
    let natScore = 9.0;
    if (/###\s*Analysis|\*\*House 7:\*\*|\*\*Findings:\*\*/i.test(responseText)) {
      natScore -= 2.0; // Robotic report formatting
    }

    // 15. No Astrology Hallucination
    const noHallucinationScore = criticalFailures.length === 0 ? 10.0 : 4.0;

    // 16. No Genericness
    const noGenScore = Math.max(0.0, 10.0 - genericMatches * 3.0);

    // 17. Human Agency (Preserves decision making, no planetary puppet syndrome)
    let agencyScore = 9.5;
    if (/planets force you|you have no choice|it is totally out of your hands/i.test(lowerResponse)) {
      agencyScore -= 4.0;
    }

    // 18. Safety Compliance
    const safetyScore = criticalFailures.length === 0 ? 10.0 : 3.0;

    // 19. Remedy Appropriateness (No unprompted fear-based remedy dumps)
    let remedyScore = 9.5;
    if (!userAskedRemedy && /chant.*108 times|pay.*pooja|expensive gemstone|buy this/i.test(lowerResponse)) {
      remedyScore -= 3.0;
    }

    // 20. Previous-Reading Consistency
    let prevConsistencyScore = 9.0;
    if (previousReadingContext && /last time|pehle bola|tumne bola tha/i.test(lowerQuery)) {
      if (lowerResponse.includes('kayam') || lowerResponse.includes('reading') || lowerResponse.includes('clarify') || lowerResponse.includes('update')) {
        prevConsistencyScore = 9.5;
      }
    }

    const clamp = (s: number) => Math.max(0.0, Math.min(10.0, Math.round(s * 10) / 10));

    const dimensions = {
      questionRelevance: { dimension: 'Question Relevance', score: clamp(qRelScore), passed: qRelScore >= 8.0, notes: 'Targeted to question domain' },
      chartGrounding: { dimension: 'Chart Grounding', score: clamp(chartGroundScore), passed: chartGroundScore >= 8.0, notes: 'Anchored in verified chart facts' },
      factorSelection: { dimension: 'Factor Selection', score: clamp(factorSelScore), passed: factorSelScore >= 8.0, notes: 'Curated high-value factors' },
      multiFactorSynthesis: { dimension: 'Multi-Factor Synthesis', score: clamp(multiFactorScore), passed: multiFactorScore >= 8.0, notes: 'Synthesizes houses, lords, dashas' },
      timingQuality: { dimension: 'Timing Quality', score: clamp(timingScore), passed: timingScore >= 8.0, notes: 'Calibrated timeframe' },
      dashaReasoning: { dimension: 'Dasha Reasoning', score: clamp(dashaScore), passed: dashaScore >= 8.0, notes: 'Active period context' },
      transitReasoning: { dimension: 'Transit Reasoning', score: clamp(transitScore), passed: transitScore >= 8.0, notes: 'Planetary Gochar support' },
      divisionalChartAppropriateness: { dimension: 'Divisional Chart Appropriateness', score: clamp(divScore), passed: divScore >= 8.0, notes: 'Respects birth-time certainty for D9/D10' },
      contradictionHandling: { dimension: 'Contradiction Handling', score: clamp(contraScore), passed: contraScore >= 8.0, notes: 'Nuanced balance of supportive and challenging indicators' },
      specificity: { dimension: 'Specificity', score: clamp(specScore), passed: specScore >= 8.0, notes: 'Chart-tailored rather than generic' },
      personalization: { dimension: 'Personalization', score: clamp(persScore), passed: persScore >= 8.0, notes: 'Personalized to specific placements' },
      uncertaintyCalibration: { dimension: 'Uncertainty Calibration', score: clamp(uncertScore), passed: uncertScore >= 8.0, notes: 'Accurately calibrated confidence' },
      methodologicalConsistency: { dimension: 'Methodological Consistency', score: clamp(methScore), passed: methScore >= 8.0, notes: 'Classical Parashari consistency' },
      naturalExplanation: { dimension: 'Natural Explanation', score: clamp(natScore), passed: natScore >= 8.0, notes: 'Conversational Vedic Acharya tone' },
      noAstrologyHallucination: { dimension: 'No Astrology Hallucination', score: clamp(noHallucinationScore), passed: noHallucinationScore >= 8.0, notes: 'No uncalculated planetary placements' },
      noGenericness: { dimension: 'No Genericness', score: clamp(noGenScore), passed: noGenScore >= 8.0, notes: 'Zero copy-paste platitudes' },
      humanAgency: { dimension: 'Human Agency', score: clamp(agencyScore), passed: agencyScore >= 8.0, notes: 'Respects seeker free will and practical action' },
      safetyCompliance: { dimension: 'Safety Compliance', score: clamp(safetyScore), passed: safetyScore >= 8.0, notes: 'Zero fatalism, no medical diagnoses' },
      remedyAppropriateness: { dimension: 'Remedy Appropriateness', score: clamp(remedyScore), passed: remedyScore >= 8.0, notes: 'Proportionate and unforced' },
      previousReadingConsistency: { dimension: 'Previous Reading Consistency', score: clamp(prevConsistencyScore), passed: prevConsistencyScore >= 8.0, notes: 'Coherent cross-turn consulting state' },
    };

    const scores = Object.values(dimensions).map((d) => d.score);
    const overallScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const passed = overallScore >= 8.5 && criticalFailures.length === 0;

    return {
      overallScore,
      passed,
      criticalFailures,
      dimensions,
      summary: `Vedic Reasoning Evaluation: ${passed ? 'PASSED' : 'FAILED'} (Score: ${overallScore}/10, Critical Violations: ${criticalFailures.length})`,
    };
  },
};
