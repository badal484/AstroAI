# ASTROLOGER CONSULTATION SPECIFICATION

## Overview
This specification governs the core intelligence, intent understanding, astrological factor selection, reasoning, and response generation pipeline for **Astro AI** (Acharya Vashishta).

---

## 1. Core End-to-End Pipeline

```
USER MESSAGE
      ↓
LANGUAGE DETECTION (English, Hindi, Hinglish)
      ↓
MESSAGE NORMALIZATION & ENTITY EXTRACTION
      ↓
STRUCTURED INTENT UNDERSTANDING (ConsultationIntent)
      ↓
EMOTION UNDERSTANDING (Intensity & Empathy Gate)
      ↓
CONVERSATION CONTEXT & RELEVANT MEMORY (Layered memory)
      ↓
BIRTH PROFILE & SELECTIVE ASTROLOGY FACTORS (Strict topic isolation)
      ↓
ASTROLOGICAL REASONING ENGINE (Chart grounding & verified timing windows)
      ↓
CONSULTATION STRATEGY (Direct Answer, Empathy First, Clarify, Timing, Deep)
      ↓
RESPONSE GENERATION (AI Gateway streaming / fallback)
      ↓
QUALITY & TOPIC CONSISTENCY VALIDATION (Rejects topic mismatch & hallucinations)
      ↓
STREAM RESPONSE (Typed ConsultationEvent protocol)
      ↓
PERSIST MESSAGE & DEDUPLICATE (Atomic idempotency)
      ↓
UPDATE MEMORY & READING SUMMARIES
```

---

## 2. Structured Intent Taxonomy

```typescript
export type AstrologyIntent =
  | 'MARRIAGE_TIMING'
  | 'MARRIAGE_PROSPECTS'
  | 'LOVE_RELATIONSHIP'
  | 'BREAKUP'
  | 'RELATIONSHIP_CONFLICT'
  | 'COMPATIBILITY'
  | 'CAREER'
  | 'JOB_CHANGE'
  | 'CAREER_TIMING'
  | 'MONEY'
  | 'BUSINESS'
  | 'EDUCATION'
  | 'FAMILY'
  | 'HEALTH_GUIDANCE'
  | 'TODAY_GUIDANCE'
  | 'CURRENT_PHASE'
  | 'GENERAL_CHART'
  | 'SPIRITUAL'
  | 'REMEDY'
  | 'FOLLOW_UP'
  | 'GREETING_INTAKE'
  | 'GENERAL_CONVERSATION';

export interface ConsultationIntent {
  primaryIntent: AstrologyIntent;
  secondaryIntents: AstrologyIntent[];
  confidence: number;
  entities: string[];
  requestedTimeframe?: string;
  emotionalTone?: string;
  requiresChartAnalysis: boolean;
  requiresTimingAnalysis: boolean;
  requiresFollowUp: boolean;
}
```

---

## 3. Strict Intent-to-Astrology Factor Mapping

| Intent | Primary Houses | Secondary Houses | Key Planets | Timing Indicators | Prohibited Topics in Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MARRIAGE_TIMING`, `MARRIAGE_PROSPECTS` | 7 | 2, 5, 11 | Venus, Jupiter, 7th Lord | Jupiter transit on 7th, Venus/Jupiter Dasha, Navamsa | Career growth, Job switch, 10th House |
| `RELATIONSHIP_CONFLICT`, `BREAKUP` | 7, 5 | 1, 8, 12 | Venus, Moon, Mars | Moon transit, Mars aspect, current Dasha | Professional promotions, Business investments |
| `CAREER`, `JOB_CHANGE`, `CAREER_TIMING` | 10 | 2, 6, 11 | Sun, Saturn, Mercury, Jupiter | 10th Lord transit, Saturn/Sun sub-periods, Jupiter aspect on 10th | Marriage delays, romantic partnerships |
| `MONEY`, `BUSINESS` | 2, 11 | 5, 9 | Jupiter, Mercury, Venus | 2nd/11th house activation, Dhana yoga periods | Relationship disputes |

---

## 4. Astrological Grounding & Timing Rules

1. **The LLM is Never the Source of Astrology Facts**:
   - Planetary positions, houses, Lagna degrees, Nakshatras, and Dashas are strictly computed by the astrology engine.
   - The LLM receives verified facts in the system prompt. It is prohibited from inventing planetary placements.
2. **Timing Engine**:
   - Timing questions compute structured `TimingWindow` objects.
   - If exact timing cannot be definitively determined (e.g. missing birth time), Acharya explicitly explains the supportive astrological period while acknowledging that exact dates are probabilistic.
3. **Conversational Progression**:
   - Only greet (`Pranam.`) on conversation initiation.
   - Subsequent turns acknowledge context naturally without robotic repetition.
   - Remedies are suggested only when contextually appropriate, not automatically dumped in every response.
