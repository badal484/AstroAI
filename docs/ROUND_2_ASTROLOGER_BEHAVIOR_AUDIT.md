# Astro AI — Round 2 Extreme Fine-Tuning: Astrologer Behavior & Conversation Audit

**Date**: September 10, 2026  
**Scope**: Full End-to-End Runtime Pipeline Audit (Mobile UI → API → Context → Intent → Emotion → Consultation State → Memory → Astrology Context → Astrology Reasoning → Strategy → Persona → Prompt → AI Gateway → Streaming → Post-Processing → Mobile Rendering)

---

## 1. Executive Summary & Runtime Pipeline Trace

We have conducted a thorough, line-by-line inspection of the real runtime path across Astro AI. While the baseline architecture provides ephemeris calculations, streaming, and modular classification engines, our audit identified key behavioral failure modes that made the AI feel like a chatbot wearing an astrologer costume rather than a seasoned, attentive Vedic astrologer.

```
[Mobile Chat UI / WebSocket]
          │
          ▼
[API Gateway / Chat Controller]
          │
          ▼
[1. messageNormalizer] ─── Normalizes typos, transliterations, Devanagari/Roman Hindi
          │
          ▼
[2. conversationStateManager] ─── Maintains Authoritative Conversation State & 2-Layer Context
          │
          ▼
[3. messageRelationEngine] ─── Classifies Layer B actual meaning ("Nahi", "Kab?", "Boliye", "Chhod")
          │
          ▼
[4. intentEngine & emotionDetector] ─── 5-Tier Astrology Relevance & Empathy-First Classification
          │
          ▼
[5. consultationStateMachine] ─── Multi-turn consultation lifecycle tracking
          │
          ▼
[6. memoryService & Personal Story Model] ─── Episodic life context & previous reading recall
          │
          ▼
[7. contextBuilder (Selective Fact Extractor)] ─── Topic-specific Vedic factors (no Kundli dumping)
          │
          ▼
[8. astrologyReasoningEngine] ─── Vedic interpretation & contradiction handling
          │
          ▼
[9. responseStrategyEngine] ─── Dynamic response depth (MICRO → CONSULTATION) & purposeful follow-ups
          │
          ▼
[10. promptAssembler & personaManager] ─── Conversational Hinglish mirroring, Turn > 0 salutation suppression
          │
          ▼
[11. aiGateway & LLM Provider] ─── Multi-model routing (fast for quick acknowledgments, deep for chart analysis)
          │
          ▼
[12. responseSelfHealer & postProcessor] ─── Strips preambles, removes emojis, sanitizes robotic headers
          │
          ▼
[13. responseRepetitionGuard & genericityDetector] ─── Prevents duplicate text and canned questionnaire menus
          │
          ▼
[14. Mobile Chat Rendering & Typing State] ─── Immediate typing state transition & token streaming
```

---

## 2. Component-by-Component Audit Findings

### A. What Already Works Well
1. **Accurate Vedic Ephemeris Ground Truth**: The planetary engine computes exact Lahiri ayanamsha, house positions, planetary strengths, dashas, and ashtakoota compatibility without LLM hallucinations.
2. **Deterministic Safety Guards**: Crisis self-harm and unethical death prediction queries are strictly intercepted by deterministic safety gates.
3. **No-Emoji Policy**: Vector glyphs in the UI and clean typography in responses avoid cartoonish emojis.
4. **WebSocket Streaming Infrastructure**: Real-time token streaming with fallback to chunked polling works reliably.

---

### B. What is Partially Working & Behavioral Gaps

#### 1. Two-Layer Message Understanding (Literal vs Actual)
- **Status**: *Partially working*.
- **Problem**: When a user inputs single-word replies like *"Kab?"*, *"Kyu?"*, *"Nahi"*, or *"Haan"*, the system previously struggled to maintain continuity with the assistant's previous question if the wording didn't match strict keywords.
- **Root Cause**: The relationship engine relied on shallow regex instead of resolving against `lastAssistantQuestion` and `unresolvedQuestion` in `conversationStateManager`.

#### 2. Follow-Up Questions (Consultation vs Interrogation)
- **Status**: *Needs refinement*.
- **Problem**: In several reading modes, the assistant asked questions without an internal decision purpose (e.g. *"Aap aur kya janna chahte hain?"*), making it sound like a customer support chatbot rather than an astrologer offering structured forks (*"Career mein main do periods compare kar sakta hoon: current job aur next change window"*).

#### 3. Astrology Relevance & Selective Chart Fact Extraction
- **Status**: *Partially working*.
- **Problem**: Queries like *"Daru ka mann h"* or *"Phone toot gaya"* were sometimes assigned `AMBIGUOUS` relevance instead of strictly `NOT_RELEVANT`, risking unnecessary astrological framing.
- **Solution**: Enforce strict 5-tier classification (`ASTROLOGY_REQUIRED`, `ASTROLOGY_OPTIONAL`, `ASTROLOGY_NOT_RELEVANT`, `ASTROLOGY_ALREADY_USED`, `ASTROLOGY_REQUESTED`).

#### 4. Natural Hinglish vs Textbook Translation
- **Status**: *Needs fine-tuning*.
- **Problem**: Prompts occasionally output overly formal Hindi terms (*"vishay"*, *"charcha"*, *"anukool"*, *"paristhiti"*) even when the user spoke casually (*"meri shadi kb hogi yrr"*).
- **Solution**: Implement true style mirroring: casual for casual Hinglish, respectful conversational Hindi for Hindi, clean professional English for English.

#### 5. Contradiction Handling & No False Precision
- **Status**: *Missing in reasoning engine*.
- **Problem**: When chart factors conflicted (e.g., Jupiter favoring marriage in the 7th house, but Saturn aspecting 7th lord causing delay), readings tended to either ignore the delay or declare a rigid timeline.
- **Solution**: Synthesize balanced interpretations (*"Yahan dono tarah ke indications hain: Guru support de raha hai, lekin Shani ki drishti ki wajah se timing gradual lagti hai"*).

#### 6. User Corrections & Personal Story Model
- **Status**: *Incomplete continuity*.
- **Problem**: If the user said *"Nahi, mera matlab career nahi, relationship tha"*, the assistant did not explicitly acknowledge the misunderstanding or discard the invalid assumption.

#### 7. Insult & Abuse Handling
- **Status**: *Partially working*.
- **Problem**: Harsh or slang frustration (*"lawda"*, *"Tu kya bakwas kar raha hai"*) was met with generic safe boundaries instead of calm, grounded astrologer maturity (*"Lagta hai mera answer kaam ka nahi laga. Batao kya galat laga"*).

---

## 3. Summary of Core Improvements for Round 2

1. **Two-Layer Message Understanding Engine**: Layer A (literal) + Layer B (authoritative conversational meaning).
2. **Authoritative Conversation State**: Tracks `currentTopic`, `currentConcern`, `lastAssistantQuestion`, `lastUserAnswer`, `unresolvedQuestion`, `consultationDepth`, `astrologyRequested`, `profileAvailable`, `chartAvailable`, `birthTimeConfidence`, and `personalStory`.
3. **Purposeful Follow-ups**: Maximum 1 question per turn, only if it changes an astrological or practical decision.
4. **5-Tier Astrology Relevance**: Strict gating so daily life events never receive unwanted horoscopes.
5. **Selective Chart Fact Extractor**: Filters only the 3-5 necessary planetary factors per question domain.
6. **Contradiction-Aware Reasoning**: Explains supportive vs delaying factors transparently without false precision.
7. **Native Conversational Hinglish**: Eliminates textbook vocabulary in favor of warm, everyday phrasing.
8. **Comprehensive 13-Dimension Quality Evaluator (`AstrologerResponseEvaluator`)**.
9. **Golden Conversation Benchmark Dataset** (`tests/fixtures/golden-conversations/`).
