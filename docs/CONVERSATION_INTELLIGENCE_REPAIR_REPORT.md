# ASTRO AI — CONVERSATION INTELLIGENCE REPAIR REPORT (V2)

**Status:** COMPLETE & VERIFIED  
**Date:** September 6, 2026  
**Target:** Natural Hinglish / Latin Hindi Comprehension, Context Continuity, Incident Handling & Anti-Repetition Pipeline  

---

## 1. Executive Summary & Root Cause Analysis

### The Problem
When users communicated in messy Hinglish, Latin-script Hindi, or had typos/concatenations (e.g. `Roadnky kharab hai`, `Road mein kyu gir gaya`, `dil bechain h`, `daru ka mann h`), the chatbot previously misclassified or failed intent classification. When intent confidence dropped, the system defaulted to a generic astrological menu prompt:
> *"Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?"*

Furthermore, if the user followed up with another real-world incident message like `Road mein kyu gir gaya`, the system lacked duplicate-response guards and conversation state tracking, repeating the exact same generic fallback menu back-to-back.

### Root Cause
1. **Lack of Preprocessing & Word Segmentation:** Words typed without spaces or with phonetic typos (`Roadnky`, `merishadi`, `shadikab`, `kyu` variations `q`/`kyo`/`kbb`) were not normalized before intent matching.
2. **Disconnected Conversation History State:** The system evaluated each turn in isolation rather than tracking what the Acharya had just asked (`lastAssistantQuestion`, `awaitingAnswer: true`, `awaitingAnswerType`).
3. **No Message Relation Classification:** The engine did not classify whether an incoming user message was an `ANSWER_TO_PREVIOUS_QUESTION`, a `CONTINUATION`, a `REACTION`, or a `TOPIC_CHANGE`.
4. **Astrology as a Default Rather Than a Conditional Mode:** Real-world incidents (falling on a road, physical distress) were either ignored or mapped to general astrology instead of routing to a human-first `NO_ASTROLOGY` response mode.
5. **No Duplicate or Genericity Guard:** When the user's message changed, there was no guard checking if the new assistant reply was identical or highly similar to recent assistant responses.

---

## 2. Architecture Transformation

The pipeline was redesigned from a naive single-pass intent classifier into a multi-layered, empathetic conversation intelligence architecture:

```
                            USER MESSAGE
                                 ↓
                     MESSAGE NORMALIZER (V2)
          (Concatenation splitter, typos, repeated char collapse,
                     Hinglish dictionary canonicalization)
                                 ↓
                    CONVERSATION STATE MANAGER
         (Tracks active topic, previous topic, last assistant question,
          awaiting answer state & type, recent responses)
                                 ↓
                     MESSAGE RELATION ENGINE
          (Classifies: ANSWER_TO_PREVIOUS_QUESTION, CONTINUATION,
           REACTION, TOPIC_CHANGE, CLARIFICATION, NEW_TOPIC)
                                 ↓
                        INTENT & EMOTION ENGINE
         (Includes: PHYSICAL_INCIDENT, AMBIGUOUS_EMOTION,
          FAMILY_MATTERS, CASUAL_CHAT, Direct Vedic Domains)
                                 ↓
                     ASTROLOGY RELEVANCE GATING
         (REQUIRED | USEFUL | OPTIONAL | NOT_RELEVANT | AMBIGUOUS)
                                 ↓
                   CONSULTATION RESPONSE STRATEGY
         (NO_ASTROLOGY Mode, Clarification Engine, Empathy First,
          or Grounded Chart Consultation)
                                 ↓
                      PROMPT & PERSONA MANAGER
         (Conversational Acharya Vashishta, Zero Emojis, Zero Headers,
          Language attunement: Hindi, Hinglish, English)
                                 ↓
                  RESPONSE REPETITION & GENERICITY GUARD
         (Compares with recent 5 assistant messages; triggers intelligent
          contextual clarification if duplicate / generic menu detected)
                                 ↓
                       AI GATEWAY / FALLBACK
                                 ↓
                            CLIENT STREAM
```

---

## 3. Key Components Implemented

### 3.1. Message Normalizer (`backend/src/modules/astrologer-intelligence/normalizer/messageNormalizer.ts`)
- **Missing space / Concatenation separation:** Automatically segments patterns such as `Roadnky` → `road kyu`, `roadnkyu` → `road kyu`, `merishadi` → `meri shadi`, `jobkab` → `job kab`, `shadikab` → `shadi kab`.
- **Repeated character collapse:** Transforms `kbbb` → `kab`, `soooch` → `soch`, `dhaaaadak` → `dhadak`, `bechaaaain` → `bechain`.
- **Hinglish phonetic canonical mapping:** Maps `q`/`kyo`/`kyon`/`qyu` → `kyu`, `h`/`hn`/`he` → `hai`, `nhi`/`nh`/`na` → `nahi`, `rha`/`rhi` → `raha`/`rahi`, `dhadkne`/`dhadkane` → `dhadakne`, etc.
- **Language Detection:** Identifies `hi` (Devanagari), `hinglish` (Roman Hindi), and `en`.

### 3.2. Conversation State Manager (`backend/src/modules/astrologer-intelligence/context/conversationStateManager.ts`)
- Maintains `ActiveConversationState`:
  ```typescript
  interface ActiveConversationState {
    currentTopic: ConversationTopic;
    previousTopic: ConversationTopic | null;
    lastUserMessage: string | null;
    lastAssistantMessage: string | null;
    lastAssistantQuestion: string | null;
    awaitingAnswer: boolean;
    awaitingAnswerType: AwaitingAnswerType | null;
    astrologyActive: boolean;
    recentMessages: AstrologerMessage[];
    language: 'en' | 'hi' | 'hinglish';
    recentAssistantResponses: string[];
  }
  ```
- Extracts assistant questions to set `awaitingAnswer = true` and categorize `awaitingAnswerType` (`CAUSE_OF_EMOTIONAL_STATE`, `PHYSICAL_INJURY_STATUS`, `RELATIONSHIP_CLARIFICATION`, `CAREER_CLARIFICATION`, etc.).

### 3.3. Message Relation Engine (`backend/src/modules/astrologer-intelligence/relation/messageRelationEngine.ts`)
- Classifies user messages relative to previous context:
  - `ANSWER_TO_PREVIOUS_QUESTION`: When user answers questions like "Nahi", "Daru ka mann h", "Road pe".
  - `CONTINUATION`: When adding context to the current active topic ("Kal fight hui thi", "Usne block kar diya").
  - `REACTION`: Acknowledging ("Haan", "Achha", "Haha", "OK").
  - `TOPIC_CHANGE`: Intelligent pivot ("Waise career ka kya scene hai?").
  - `CLARIFICATION` / `NEW_TOPIC`.

### 3.4. Contextual Clarification Engine (`backend/src/modules/astrologer-intelligence/clarification/contextualClarificationEngine.ts`)
- Eliminates generic fallback menus completely.
- Generates natural, context-specific clarifying questions based on recent messages and topics:
  - Incident: *"Arre! Road kharab thi ya balance bigad gaya? Pehle yeh batao koi chot toh nahi aayi?"*
  - Ambiguous Emotion: *"Kuch hua hai kya? Kisi baat ko lekar tension hai ya bas aaj mood thoda heavy hai?"*
  - Substance / Unwinding: *"Aisa kya ho gaya aaj? Kisi baat ka stress ya thakan hai, ya bas dosto ke saath chill karne ka mann ho raha hai?"*

### 3.5. Quality Guards: Repetition & Genericity (`quality/responseRepetitionGuard.ts` & `quality/genericResponseDetector.ts`)
- **Repetition Guard:** Computes exact match and Jaccard token overlap against the last 5 assistant responses. If similarity is high when the user message has changed, forces regeneration or contextual clarification.
- **Genericity Detector:** Scans for prohibited broad menu templates (`"kis vishay par baat karna chahte hain—personal life, career ya kuch aur"`, `"What area would you like to explore"`) and replaces them with tailored conversational inquiries.

### 3.6. First-Class Incident Handling (`ResponseMode = NO_ASTROLOGY`)
- When user describes a physical event (`Road mein kyu gir gaya`, `road pe gir gaya`, `chot lagi`, `accident`):
  - Sets `astrologyRelevance: 'NOT_RELEVANT'`.
  - Enforces `NO_ASTROLOGY` prompt instructions forbidding planetary explanations or birth chart requests.
  - Prioritizes practical safety and checking for physical injury.

---

## 4. Files Modified and Created

| File | Change Type | Purpose |
|------|------------|---------|
| `backend/src/modules/astrologer-intelligence/normalizer/messageNormalizer.ts` | **NEW** | Hinglish phonetic normalization, concatenation splitting, repeated char collapsing. |
| `backend/src/modules/astrologer-intelligence/context/conversationStateManager.ts` | **NEW** | Tracks active conversation state, question awaiting types, and topic flow. |
| `backend/src/modules/astrologer-intelligence/relation/messageRelationEngine.ts` | **NEW** | Classifies message relation to preceding assistant dialogue turns. |
| `backend/src/modules/astrologer-intelligence/clarification/contextualClarificationEngine.ts` | **NEW** | Generates context-specific, empathetic clarifying inquiries. |
| `backend/src/modules/astrologer-intelligence/quality/responseRepetitionGuard.ts` | **NEW** | Prevents duplicate / repetitive assistant responses across conversation turns. |
| `backend/src/modules/astrologer-intelligence/quality/genericResponseDetector.ts` | **NEW** | Flags and intercepts generic menu templates. |
| `backend/src/modules/astrologer-intelligence/intent/intentTypes.ts` | **MODIFIED** | Added `PHYSICAL_INCIDENT`, `FAMILY_MATTERS`, `AMBIGUOUS_EMOTION` intents. |
| `backend/src/modules/astrologer-intelligence/intent/keywordPatterns.ts` | **MODIFIED** | Added comprehensive regex patterns for incidents, Hinglish queries, safety, and life events. |
| `backend/src/modules/astrologer-intelligence/intent/intentEngine.ts` | **MODIFIED** | Integrated normalizer, entity extractor, and astrology relevance gating. |
| `backend/src/modules/astrologer-intelligence/quality/fallbackGenerator.ts` | **MODIFIED** | Replaced generic astrological menus with human-first empathetic responses for incidents and emotions. |
| `backend/src/modules/astrologer-intelligence/persona/promptAssembler.ts` | **MODIFIED** | Integrated conversation continuity, relation guidance, and `NO_ASTROLOGY` mode. |
| `backend/src/modules/astrologer-intelligence/index.ts` | **MODIFIED** | Connected entire pipeline, decision logging, language resolution, and guards. |
| `backend/src/modules/ai/router/defaultRouting.ts` | **MODIFIED** | Configured Gemini 3.6 Flash as primary provider with fallback to OpenAI/Anthropic. |
| `backend/tests/unit/astrologer-intelligence/conversationIntelligenceV2.test.ts` | **NEW** | 21 comprehensive unit tests covering all required test queries. |

---

## 5. Before & After Comparison

### Test Case 1: Concatenated / Typo Incident Query
- **User:** `Roadnky kharab hai`
- **BEFORE:**
  > *"Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?"*
- **AFTER:**
  > *"Arre, road kharab hone ki wajah se slip huye kya? Pehle yeh bataiye kahin chot toh nahi aayi na?"*

### Test Case 2: Consecutive Follow-up Query
- **User:** `Road mein kyu gir gaya`
- **BEFORE (Duplicate repetition bug):**
  > *"Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?"*
- **AFTER:**
  > *"Arre, kaise gir gaye? Road slippery thi ya balance bigad gaya? Pehle yeh bataiye koi chot toh nahi lagi na?"*

### Test Case 3: Ambiguous Emotional Sensation
- **User:** `Dil bechain h`
- **BEFORE:**
  > *"Current planetary alignment indicates Jupiter transit..."* OR generic menu.
- **AFTER:**
  > *"Kuch hua hai kya? Kisi baat ko lekar tension hai ya bas aaj mood thoda heavy hai?"*

### Test Case 4: Answer to Previous Question (Substance / Venting)
- **Assistant:** *"Dil kis wajah se dhadakne laga? Kisi special person ki wajah se ya aaj kuch unexpected hua?"*
- **User:** `Daru ka mann h`
- **BEFORE:**
  > Restarted astrology or requested birth details.
- **AFTER:**
  > *"Aisa kya ho gaya aaj? Kisi baat ka stress ya thakan hai, ya bas chill karne ka mann ho raha hai?"*

### Test Case 5: Direct Astrology Timing Query
- **User:** `Meri shaadi kab hogi?`
- **BEFORE:**
  > Generic response or missing chart handling without explanation.
- **AFTER:**
  > Automatically switches to `astrologyActive: true`, checks verified chart facts, calculates 7th house / Venus / Jupiter dasha timing, and delivers structured astrological consultation.

---

## 6. Verification & Test Results

### 1. Dedicated Conversation Intelligence V2 Test Suite
- `tests/unit/astrologer-intelligence/conversationIntelligenceV2.test.ts`
- **Result:** **21 / 21 Tests Passed** (100%)

### 2. Full Astrologer Unit & Behavior Benchmark Suites
- `tests/unit/astrologer/astrologerService.test.ts`: **18 / 18 Passed**
- `tests/unit/astrologer-intelligence/astrologerGoldenMatrix.test.ts`: **68 / 68 Passed**
- `tests/unit/astrologer-intelligence/consultation.test.ts`: **9 / 9 Passed**
- `tests/unit/astrologer-intelligence/goldenBenchmark.test.ts`: **7 / 7 Passed**
- `src/modules/astrologer-intelligence/__tests__/behavior/behaviorEvaluation.test.ts`: **13 / 13 Passed**

### 3. Full Backend Suite
- **Result:** **61 / 61 Test Files Passed (529 / 529 Tests Passed, 100% Pass Rate)**

### 4. Monorepo TypeScript Compilation
- `npm run typecheck` across `@astroai/shared-types`, `@astroai/backend`, `@astroai/admin`, `@astroai/mobile`:
- **Result:** **0 Errors across all packages.**

---

## 7. Remaining Considerations & Edge Cases
- **Device Connectivity:** Verified with backend daemon running on port 4000 and live ADB reverse proxy to connected Android device (`4306aaf7`).
- **Memory Retention:** Fact extraction and cross-session summary storage automatically record user life situation context for seamless multi-day conversation recall.
