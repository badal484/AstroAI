# HUMAN-LEVEL ASTROLOGER CONSULTATION EXPERIENCE — PIPELINE AUDIT

**Target**: AstroAI Vedic Astrology Consultation System  
**Document**: `docs/HUMAN_CONSULTATION_AUDIT.md`  
**Standard**: Experience-First, Authentic Acharya Consultation  

---

## EXECUTIVE SUMMARY

A rigorous audit of the current conversation and response-generation pipeline (`astrologer-intelligence`, `promptAssembler`, `intentEngine`, `guruMandala`, `fallbackGenerator`, `conversationStateManager`, `chat.service`, `chat.socket`, and `ChatScreen.tsx`) reveals that while the backend contains rich modules for Vedic calculation and Shastric knowledge, the conversational layer frequently regresses into "AI Template Generator" behavior.

The fundamental breakdown occurs because the system prioritizes **Astrological Analysis** over **Human Understanding**:

$$\text{Current Breakdown: } \text{User Message} \xrightarrow{\text{Keyword Trigger}} \text{Astrology Engine} \xrightarrow{\text{Preamble + Dump}} \text{Generic Question}$$

$$\text{Desired Standard: } \text{User Speaks} \rightarrow \text{Acharya Understands} \rightarrow \text{Reacts Naturally} \rightarrow \text{Evaluates Relevance} \rightarrow \text{Reads Chart if Relevant}$$

---

## THE 11 CONVERSATIONAL DEGRADATION AUDIT POINTS

### 1. Why responses currently feel AI-generated
- **Root Cause**: The prompts in `promptAssembler.ts` and `guruMandala.ts` imposed a rigid "200x MASTER VEDIC RESPONSE PROTOCOL" instructing the model to always output a 3-part formula: *1. Diagnostic Precision (Bhava/Graha/Aspect)* + *2. Temporal Anchor (Transit date window)* + *3. Concrete Nitya Upay (Beeja mantra + Puja)*.
- **Consequence**: Even when a seeker simply says *"Dil bechain hai"* or *"Hello"*, the LLM attempted to complete this 3-part essay structure, sounding like a printed astrological dossier rather than a compassionate guru having a dialogue.
- **Robotic Fillers**: Prompts allowed formulaic intros (*"Based on your birth chart...", "Looking at your planetary cycle...", "As per classical Vedic Shastra..."*).

---

### 2. Why irrelevant messages trigger astrology
- **Root Cause**: In `intentEngine.ts` and `keywordPatterns.ts`, keyword matching lacked hierarchical gating. Words like *"road"* or *"gir gaya"* matched accident/incident patterns which previously mapped `astrologyRelevance` to `USEFUL` or `REQUIRED`, causing chart queries and planetary transit lookups to be injected into the prompt.
- **Consequence**: A user sharing a real-world physical mishap (*"Road pe gir gaya"*) was met with planetary transit analysis (*"Mars and Saturn transits indicate..."*) instead of human empathy (*"Arre! Kaise gir gaye? Chot toh nahi aayi?"*).
- **Venting Misclassification**: Casual venting (*"Daru ka mann h"*, *"Bhook lagi hai"*) was routed to emotional crisis or general chart interpretation instead of a natural human conversational reply.

---

### 3. Why responses repeat
- **Root Cause**:
  1. `responseRepetitionGuard.ts` only evaluated exact token overlap against the last 2-3 assistant turns and fell back to `contextualClarificationEngine` rather than preserving conversational narrative.
  2. Prompts did not pass a conversation momentum summary or previous turn resolution state, causing the model to restart its assessment from scratch on short acknowledgments (*"Haan"*, *"Acha"*).
- **Consequence**: When the user typed *"Haan"*, the assistant would repeat the exact same paragraph or re-ask the exact same clarification question it had asked in the previous turn.

---

### 4. Why conversations lose context
- **Root Cause**:
  1. Multi-turn pronoun and relationship entity shifts were not preserved in working state. When a user corrected *"Girlfriend nahi, wife hai"*, the entity extractor recorded `ENTITY_FEMALE_PARTNER` generically without updating the relational persona lock.
  2. Context windowing in `chat.service.ts` sent raw messages without structured working memory tags (e.g. `CURRENT_TOPIC`, `RESOLVED_FACTS`, `OPEN_INQUIRY`).
- **Consequence**: If a user switched topics (*"Waise kal road pe gir gaya tha"*) and then returned (*"Aur career?"*), the system would forget the earlier career context or try to force the conversation back into marriage.

---

### 5. Why the assistant asks unnecessary questions
- **Root Cause**: The prompt directive previously required: *"Every response must conclude with a follow-up question to maintain engagement."*
- **Consequence**: Even when the user asked a crisp question (*"Lucky number?"* or *"Today's tithi?"*), or when the user had already given exhaustive context (*"I am 26, working in IT in Pune, looking for job switch in June"*), the assistant still generated artificial questions like *"What life area would you like to explore?"* or *"What is your current field of work?"*.

---

### 6. Why responses feel like templates
- **Root Cause**:
  1. Use of repetitive markdown headers (`**Relationship Dynamics:**`, `**Career Outlook:**`, `**Vedic Remedy:**`, `**Conclusion:**`).
  2. In `fallbackGenerator.ts`, hardcoded strings followed an identical template: `Salutation` + `1-sentence empathy` + `Astrological house explanation` + `Question`.
- **Consequence**: Every single message looked identical in layout and visual density.

---

### 7. Why the astrologer does not feel personally attentive
- **Root Cause**: Responses used generic horoscope truisms (*"You may experience some ups and downs"*, *"Patience is key during this time"*) rather than directly connecting specific Lagna and planetary positions to the user's explicit question.
- **Consequence**: The reading felt like a newspaper horoscope column copied into a chat window rather than a master astrologer examining the seeker's actual birth chart.

---

### 8. Where greeting/preamble repetition originates
- **Root Cause**:
  1. `guruMandala.ts` defined explicit `salutation` fields (`"Kalyanamastu priye seeker"`, `"Pranam"`) which were injected into the system prompt.
  2. `promptAssembler.ts` lacked a strict turn-level suppression rule for subsequent turns, leading the LLM to greet the user anew on turns 2, 3, 4, and 5.
- **Consequence**:
  ```text
  User: Meri job kab lagegi?
  Assistant: Pranam. Aapki kundli mein...
  User: Aur shaadi?
  Assistant: Pranam. Shaadi ke vishay mein...
  ```

---

### 9. Where "Namaste", "Pranam", etc. are injected
- **Locations in Code**:
  1. `backend/src/modules/astrologer-intelligence/persona/guruMandala.ts` (lines 30–105).
  2. `backend/src/modules/astrologer-intelligence/quality/fallbackGenerator.ts` (lines 59, 99, 194, 205, 246, 280, 310, 350).
  3. `backend/src/modules/astrologer-intelligence/persona/promptAssembler.ts` (absence of greeting suppression in system directive).
- **Remedy**: Strip all injected greetings for turns $> 1$, and restrict salutations solely to the initial greeting turn or after an explicit multi-day reconnection.

---

### 10. Where generic fallback responses originate
- **Root Cause**:
  1. When LLM provider latency exceeded timeouts or hit rate limits in development/testing, `index.ts` routed execution to `fallbackGenerator.ts`.
  2. `fallbackGenerator.ts` contained pre-canned paragraphs with rigid phrases (*"Vedic Jyotish mein vivah ka mukhya vichar..."*).
- **Remedy**: Overhaul `fallbackGenerator.ts` to follow the human dialogue hierarchy, conversational brevity, and natural Hinglish.

---

### 11. Why typing/streaming does not feel like a live consultation
- **Root Cause**:
  1. In `chat.service.ts`, the backend emitted `UNDERSTANDING` $\rightarrow$ `GENERATING` $\rightarrow$ `STREAMING` immediately without dynamic context-aware states.
  2. In `mobile/src/screens/chat/MessageBubble.tsx`, `getPhaseText` mapped all active phases to a generic `"Acharya is typing…"`.
  3. The mobile client did not visually distinguish between *"Acharya is reading your chart…"* (which should only appear for astrology queries) and *"Acharya is typing…"*.
- **Remedy**:
  - For astrology queries with birth chart: emit `ANALYZING_CHART` (*"Reading your chart…"*) $\rightarrow$ `CHECKING_DASHA` (*"Looking at current dasha…"*) $\rightarrow$ `TYPING` (*"Acharya is typing…"*) $\rightarrow$ token streaming.
  - For casual/emotional queries: emit clean `TYPING` directly.

---

## SYSTEM UPGRADE SPECIFICATION

```
=============================================================================
                      THE CONSULTATION DIALOGUE HIERARCHY
=============================================================================

                              1. UNDERSTAND
                                    ↓
                              2. ACKNOWLEDGE
                                    ↓
                                3. RESPOND
                                    ↓
                              4. INTERPRET
                                    ↓
                             5. ASK IF NEEDED
                                    ↓
                        6. USE ASTROLOGY IF RELEVANT
=============================================================================
```

### Core Execution Directives
1. **Semantic Connection**: The first sentence of every response must acknowledge the semantic essence of what the user just said.
2. **Response Depth Scaling**:
   - *Micro turns* (`haan`, `nahi`, `acha`, `hmm`): 1 concise sentence (10–25 words).
   - *Casual / Venting* (`road pe gir gaya`, `daru ka mann`): 1–2 caring sentences (20–45 words).
   - *Standard Consultation*: 2–4 natural paragraphs (60–120 words).
   - *Deep Reading*: 3–6 nuanced paragraphs (120–200 words).
3. **Consistent Linguistic Register**:
   - Default Hinglish: warm, respectful, natural Indian conversational cadence (*"Tumhari kundli mein..."* or respectful *"Aapki kundli mein..."* consistently, never oscillating between `tum` and `aap` randomly).
   - No robotic headers (`**Analysis:**`, `**Remedy:**`).
   - Zero "Astrology Announcements" (*"Based on your birth chart..."* is replaced with natural embedded insight).
4. **Internal "Why this response?" Decision**:
   - Maintain structured reasoning metadata internally without leaking chain-of-thought to the seeker.
5. **Quality Gate Validation**:
   - Evaluate every turn against the 10 quality dimensions with target score $\ge 8.5/10.0$.
