/**
 * Vedic Astrologer Intelligence: Layer 2 Reasoning Types
 * Classical multi-factor synthesis, contradiction detection, timing windows, and structured interpretations.
 */

export interface AstrologicalFactor {
  factor: string;
  category?: 'PLANET_DIGNITY' | 'HOUSE_LORD' | 'DASHA_PERIOD' | 'TRANSIT_GOCHAR' | 'YOGA' | 'DRISHTI_ASPECT' | 'NAKSHATRA';
  influence: 'SUPPORTIVE' | 'CHALLENGING' | 'NEUTRAL';
  weight?: number; // 1 to 5 scale of astrological importance
  description: string;
}

export interface TimingWindow {
  window: string;
  planetaryIndicator: string;
  favorableLevel: 'HIGH' | 'MODERATE' | 'NEUTRAL';
  windowStart?: string;
  windowEnd?: string;
  confidence?: 'HIGH' | 'MODERATE' | 'LOW';
  reason?: string;
  relevantFactors?: string[];
}

export interface AstrologicalInterpretation {
  topic: string;
  supportingFactors: AstrologicalFactor[];
  challengingFactors: AstrologicalFactor[];
  timingFactors: AstrologicalFactor[];
  contradictions: AstrologicalFactor[];
  overallSignal: 'positive' | 'mixed' | 'challenging' | 'unclear';
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  timingWindow?: TimingWindow[];
  methodologyVersion: string;
  ruleVersion: string;
  astrologyEngineVersion: string;
}

export interface StructuredAstrologyReasoning {
  topic: string;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  primaryFactors: AstrologicalFactor[];
  timingWindows: TimingWindow[];
  remedies: string[];
  uncertaintyNotes: string[];
  userFacingExplanationSummary: string;
  interpretation?: AstrologicalInterpretation;
}
