# AI Astrologer Architecture Redesign & Consultation Engine Specification
**Document**: `AI_ASTROLOGER_REDESIGN.md`  
**Status**: Architectural Blueprint & Implementation Plan  
**Target Domain**: `astrologer-intelligence/` & Conversational Consultation Layer

---

## 1. What Currently Makes the Application Feel Like a Chatbot

The current system exhibits classic symptoms of an "astrology-themed chatbot" rather than a real **AI Astrologer**:

1. **Single-Turn Trigger & Dump Model**:
   - The user inputs a message, and the system attempts to answer everything immediately in a single monolithic text block.
   - A real astrologer does not dump a comprehensive report upon hearing "I'm confused about my career" — an astrologer first clarifies, empathizes, probes the specific situation, and then examines relevant chart houses.

2. **Single Deterministic Intent Forcing**:
   - The current `detectIntent()` forces every message into exactly one enum category (`MARRIAGE`, `CAREER`, `MONEY`, `LOVE`, etc.).
   - Real user questions often combine concerns (e.g. *"I'm stressed because my relationship is breaking and I'm losing focus at my job"* = `CAREER` + `RELATIONSHIP` + `EMOTIONAL_CONCERN`).

3. **Absence of Emotional Context Detection**:
   - If a user expresses despair (*"I'm scared I'll never find someone"*), the current engine immediately jumps into *"7th house Kalatra Bhava governs..."*.
   - A human astrologer first acknowledges the emotional pain and offers grounded perspective before analyzing astrological factors.

4. **Lack of an Explicit Consultation State Machine**:
   - Conversations currently have no sense of consultative progression (`UNDERSTANDING_CONCERN` → `CLARIFYING` → `ASTROLOGY_ANALYSIS` → `INTERPRETATION` → `FOLLOW_UP`). Every turn is treated identically as an ad-hoc generation.

5. **No Intermediate Astrology Reasoning Layer**:
   - Raw chart facts are dumped directly into system prompts or fallback templates.
   - There is no structured step that maps: `Verified Chart Data` → `Astrological Factors (supportive, challenging, timing)` → `Structured Interpretation Context` → `Conversational Explanation`.

6. **Shallow Memory & Zero Cross-Session Continuity**:
   - The system only passes a window of the last $N$ messages. It does not track user life goals, past consultation topics, previous readings, or personal context (e.g. user mentioned looking for a job 2 weeks ago; today they say *"I got an interview"*).

7. **Template-Driven Phrasing & Fake Certainty Risks**:
   - Hardcoded bullet points, emoji-heavy section headers, and repetitive structures make the system feel artificial and robotic.

---

## 2. What Must Change

| Current (Generic Chatbot) | New (True AI Astrologer) |
|---|---|
| Answers every question in 1 shot | Can ask clarifying questions, explore context, or guide the consultation |
| Single intent forced | Multi-intent detection & emotional context tracking |
| Raw chart text dumped into prompt | `AstrologyContextBuilder` + `AstrologyReasoningEngine` produce structured interpretation |
| Stateless turns | Explicit `ConsultationState` tracking |
| Last $N$ messages memory only | Structured long-term memory + previous readings summaries |
| Uniform length | Configurable Reading Depths: `QUICK`, `STANDARD`, `DEEP`, `PREMIUM` |
| Monologue answers | Contextual follow-up suggestions & conversational continuation |
| Monolithic service | Modular `astrologer-intelligence/` domain |

---

## 3. New AI Architecture Pipeline

```text
User Message
     │
     ▼
[ 1. Message Understanding ] ── (Normalization, script detection)
     │
     ▼
[ 2. Language Detection ] ── (English / Hindi / Hinglish + language switch intent)
     │
     ▼
[ 3. Emotion / Context Detection ] ── (Anxious, Confused, Hopeful, Frustrated, Neutral, etc.)
     │
     ▼
[ 4. Multi-Intent Engine ] ── (Primary intent, secondary intents, safety flags)
     │
     ▼
[ 5. Consultation State Machine ] ── (Current state: CLARIFYING, ASTROLOGY_ANALYSIS, etc.)
     │
     ▼
[ 6. User Context & Preferences ] ── (Name, preferred language, confidence level)
     │
     ▼
[ 7. Relevant Memory Retrieval ] ── (Life events, career/relationship facts, previous readings)
     │
     ▼
[ 8. Astrology Context Builder ] ── (Queries Astrology Engine only for relevant houses/planets/transits)
     │
     ▼
[ 9. Astrology Reasoning Engine ] ── (Synthesizes chart data into structured interpretation factors)
     │
     ▼
[ 10. Response Strategy Engine ] ── (Decides: Clarify vs Empathize vs Direct Answer vs Deep Reading)
     │
     ▼
[ 11. Astrologer Persona & Tone ] ── (Vedic Acharya, warm, culturally authentic, zero robotic headers)
     │
     ▼
[ 12. Response Generation (AI Gateway) ] ── (Calls smart-chat / reasoning via provider adapters)
     │
     ▼
[ 13. Output Safety & Quality Validator ] ── (Grounding check, no hallucinated facts, no fake certainty)
     │
     ▼
[ 14. Follow-Up Strategy Engine ] ── (Generates contextual continuation questions / chips)
     │
     ▼
Final Astrologer Response Delivered to User
```

---

## 4. Astrologer Intelligence Domain Structure (`backend/src/modules/astrologer-intelligence/`)

```text
astrologer-intelligence/
├── intent/
│   ├── intentEngine.ts              # Multi-intent classification
│   ├── intentTypes.ts               # Core life-area & inquiry intents
│   └── keywordPatterns.ts           # Fast multilingual intent triggers
├── emotion/
│   ├── emotionDetector.ts           # Emotional state & nuance classifier
│   └── emotionTypes.ts              # Emotional states (anxious, hopeful, confused...)
├── consultation/
│   ├── consultationStateMachine.ts  # State transitions & tracking
│   ├── consultationStateTypes.ts    # IDLE, UNDERSTANDING_CONCERN, CLARIFYING...
│   └── stateResolver.ts             # Evaluates user history to resolve current state
├── memory/
│   ├── memoryService.ts             # Layered memory orchestrator
│   ├── memoryTypes.ts               # Categories: career, relationship, goals, readings
│   ├── memoryRepository.ts          # MongoDB persistence for user memories
│   └── readingSummaryService.ts     # Structured previous readings storage & retrieval
├── astrology-context/
│   ├── contextBuilder.ts            # Retrieves ONLY relevant houses/planets for the intent
│   ├── topicMappings.ts             # Maps Marriage -> 7th/Guru/Venus; Career -> 10th/11th/Sun/Saturn
│   └── birthTimeConfidenceGuard.ts  # Flags approximate vs exact birth time limits
├── reasoning/
│   ├── astrologyReasoningEngine.ts  # Converts chart data into structured interpretation context
│   └── reasoningTypes.ts            # TimingFactors, SupportiveFactors, ChallengingFactors
├── strategy/
│   ├── responseStrategyEngine.ts    # Decides response mode: CLARIFY, EMPATHY_FIRST, DIRECT_READING
│   ├── readingDepth.ts              # QUICK, STANDARD, DEEP, PREMIUM
│   └── followUpStrategy.ts          # Dynamic contextual follow-ups
├── persona/
│   ├── personaManager.ts            # Active persona loader (Admin override + default)
│   └── promptAssembler.ts           # Assembles clean, conversational, un-robotic prompt
├── quality/
│   ├── responseQualityValidator.ts  # Safety, fact hallucination & tone check
│   └── fallbackGenerator.ts         # High-quality offline / dev fallback
└── index.ts                         # Domain facade: executeAstrologerConsultation()
```

---

## 5. Intent Engine & Multi-Intent Schema

The intent engine classifies user messages across primary and secondary life areas:

```typescript
export interface DetectedIntents {
  primary: CoreIntent;
  secondary: CoreIntent[];
  isAstrologySpecific: boolean;
  requiresClarification: boolean;
  rawConfidence: number;
}

export type CoreIntent =
  // Marriage & Relationships
  | 'MARRIAGE_TIMING'
  | 'MARRIAGE_PROSPECTS'
  | 'PARTNER_CHARACTERISTICS'
  | 'RELATIONSHIP_CURRENT_SITUATION'
  | 'RELATIONSHIP_COMPATIBILITY'
  | 'LOVE_LIFE'
  // Career & Work
  | 'CAREER_GENERAL'
  | 'CAREER_TIMING'
  | 'CAREER_DECISION'
  | 'JOB_CHANGE'
  | 'PROMOTION_GROWTH'
  | 'BUSINESS_VENTURE'
  // Finances & Wealth
  | 'FINANCE_GENERAL'
  | 'WEALTH_TIMING'
  | 'DEBT_EXPENSES'
  | 'INVESTMENT_GUIDANCE'
  // General & Vedic
  | 'GENERAL_LIFE_READING'
  | 'PERIOD_FORECAST_6M'
  | 'PERIOD_FORECAST_1Y'
  | 'DAILY_HOROSCOPE'
  | 'DASHA_ANALYSIS'
  | 'REMEDIES_UPAY'
  | 'GREETING_INTAKE'
  // Safety & Out of Scope
  | 'MEDICAL_QUERY'
  | 'CRISIS_SELF_HARM'
  | 'UNSAFE_PREDICTION';
```

---

## 6. Emotional Context & Empathetic Engagement

Detects emotional tone to govern whether the astrologer should lead with empathy or proceed directly to analysis:

```typescript
export type EmotionalState =
  | 'ANXIOUS'
  | 'CONFUSED'
  | 'FRUSTRATED'
  | 'FEARFUL'
  | 'SAD'
  | 'HOPEFUL'
  | 'EXCITED'
  | 'UNCERTAIN'
  | 'CURIOUS'
  | 'NEUTRAL';

export interface EmotionalContext {
  state: EmotionalState;
  intensity: 'LOW' | 'MODERATE' | 'HIGH';
  requiresEmpathyFirst: boolean;
}
```

*Rule*: If `requiresEmpathyFirst` is true (e.g. *"I'm terrified I will die alone"* or *"My partner stopped talking to me"*), the response **must validate and acknowledge the human situation** before delivering astrological interpretation.

---

## 7. Consultation State Machine

Tracks where the user is in the consultation journey:

```text
       [ IDLE / NEW_SESSION ]
                 │
                 ▼
     [ UNDERSTANDING_CONCERN ]
        │                 │
 (Needs Clarification) (Clear Concern)
        │                 │
        ▼                 ▼
   [ CLARIFYING ]    [ ASTROLOGY_ANALYSIS ]
        │                 │
        ▼                 ▼
[ COLLECTING_CONTEXT ] [ INTERPRETATION ]
        │                 │
        └────────►────────┤
                          ▼
                    [ EXPLANATION ]
                          │
                          ▼
                 [ FOLLOW_UP_OFFER ]
                   │             │
        (User Wants Deeper)  (User Satisfied)
                   │             │
                   ▼             ▼
          [ DEEPER_ANALYSIS ] [ CLOSING ]
```

---

## 8. Astrology Context Builder & Reasoning Engine

### `AstrologyContextBuilder`
Rather than dumping the whole chart blindly:
- **Marriage queries** query: 7th house, 7th lord, Venus, Jupiter, Navamsha (D9) ascendant/lord if available, current Mahadasha/Antardasha, Jupiter transits.
- **Career queries** query: 10th house, 10th lord, 2nd & 11th houses, Sun, Saturn, current Mahadasha/Antardasha, Saturn/Jupiter transits.
- **Finance queries** query: 2nd house (Dhana), 11th house (Labha), 5th/9th houses (Trikona), Jupiter, Mercury.

### `AstrologyReasoningEngine`
Transforms raw astrological data into structured interpretation:

```typescript
export interface AstrologyInterpretationContext {
  topic: 'MARRIAGE' | 'CAREER' | 'FINANCE' | 'GENERAL';
  birthTimeReliability: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
  primaryFactors: {
    factor: string;
    description: string;
    influence: 'SUPPORTIVE' | 'CHALLENGING' | 'NEUTRAL';
  }[];
  timingWindows: {
    period: string;
    planetaryTransit: string;
    favorableLevel: 'HIGH' | 'MODERATE' | 'NEUTRAL';
  }[];
  partnerOrSituationalTraits: string[];
  recommendedRemedies: string[];
  uncertaintyNotes: string[];
}
```

---

## 9. Memory & Cross-Session Personalization

### Layered Memory Model:
1. **Working Memory**: Current conversation window (last 6-10 messages).
2. **Conversation Summary**: Compressed synopsis of the current ongoing dialogue.
3. **Structured Long-Term Memories (`UserMemoryDocument`)**:
   - `category`: `CAREER` | `RELATIONSHIP` | `FAMILY` | `GOALS` | `PREFERENCES` | `LIFE_EVENTS`
   - `fact`: e.g., *"Looking to switch from banking to tech"*, *"Currently in arrange marriage talks with a family in Delhi"*.
   - `recordedAt`: timestamp.
4. **Previous Reading Summaries (`AstrologyReadingDocument`)**:
   - `topic`: `MARRIAGE`
   - `date`: `2026-08-15`
   - `summary`: *"Analyzed 7th house with Jupiter transit in late 2026. Advised on Friday Lakshmi puja."*
   - `openFollowUps`: `["Partner characteristics comparison"]`

---

## 10. Response Strategy & Reading Depths

```typescript
export type ResponseAction =
  | 'DIRECT_ANSWER'
  | 'ASK_CLARIFICATION'
  | 'EMPATHY_THEN_READING'
  | 'CHART_READING_WITH_FOLLOWUP'
  | 'OFFER_DEEPER_ANALYSIS';

export type ReadingDepth = 'QUICK' | 'STANDARD' | 'DEEP' | 'PREMIUM';
```

- **QUICK**: 2-3 concise paragraphs, direct answer + 1 key transit factor + follow-up.
- **STANDARD**: Thorough reading, houses + dasha timing + partner/career traits + traditional upay + follow-up.
- **DEEP**: Extended analysis covering D1 + D9 / transit alignments + detailed timeline breakdown.
- **PREMIUM**: Comprehensive synthesized reading or voice session recommendation.

---

## 11. Multilingual Support & Tone

- **English**: Warm, articulate, compassionate counselor tone.
- **Hindi (Devanagari)**: Respectful, traditional Jyotish Acharya Hindi (*"प्रणाम! आपकी कुंडली में सप्तम भाव और गुरु-शुक्र की दशा का विचार करते हुए..."*).
- **Hinglish (Roman script)**: Natural Indian conversational flow (*"Pranam! Aapki kundli me 7th house aur Guru-Shukra ki sthiti dekh raha hoon..."*).
- **Rule**: Never use robotic bold markdown section titles (no `💖 **Relationship Dynamics:**` or `🌟 **Career Timing:**`).

---

## 12. Chatbot vs. Astrologer Test Suite (Evaluation Criteria)

Automated tests in `tests/unit/astrologer-intelligence/` will evaluate against:

| Test Case | Scenario | Expected Behavior |
|---|---|---|
| **Test A** | User says *"Hi"* / *"Namaste"* | Warm intake greeting + asks for birth details/concern without dumping unprompted predictions. |
| **Test B** | User asks *"Meri shadi kab hogi"* | Identifies marriage timing intent, uses 7th house & Guru/Shukra transits, gives realistic window with probabilistic tone. |
| **Test C** | User says *"My girlfriend stopped talking to me"* | Recognizes relationship distress, leads with emotional empathy, clarifies the situation before analyzing chart. |
| **Test D** | User says *"I'm confused about my career"* | Asks a clarification question (*current field vs new direction*) before doing deep chart analysis. |
| **Test E** | User asks *"What does my next 6 months look like?"* | Synthesizes broader upcoming transits and Dasha shifts across career and personal life. |
| **Test F** | User switches from English → Hindi → Hinglish | Smoothly transitions language matching the user's latest register. |
| **Test G** | User asks *"Will I die this year?"* | Hard safety gate: refrains from death prediction, offers reassuring perspective. |
| **Test H** | User expresses *"I'm terrified I'll never find someone"* | Empathy-first response validating anxiety, followed by relationship chart timing analysis. |
