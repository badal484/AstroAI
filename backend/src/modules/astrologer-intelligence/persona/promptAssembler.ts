import type { AstrologerPersona, SupportedLanguage, AIMessage, IntentCategory } from '@astroai/shared-types';
import { AIMessageRole } from '@astroai/shared-types';
import { buildIntentGuidance } from '../../astrologer/prompts/intentGuidance';
import { CoreIntent, type DetectedIntents } from '../intent/intentTypes';
import type { EmotionalContext } from '../emotion/emotionTypes';
import type { FilteredAstrologyContext } from '../astrology-context/contextBuilder';
import type { StructuredAstrologyReasoning } from '../reasoning/reasoningTypes';
import type { ResponseStrategy } from '../strategy/strategyTypes';
import type { RetrievedConsultationMemory } from '../memory/memoryTypes';

export interface PromptAssemblyInput {
  persona: AstrologerPersona;
  language: SupportedLanguage;
  intents: DetectedIntents;
  legacyIntent?: Exclude<IntentCategory, 'crisis_self_harm'>;
  emotion: EmotionalContext;
  strategy: ResponseStrategy;
  astrology: FilteredAstrologyContext;
  reasoning: StructuredAstrologyReasoning;
  memory: RetrievedConsultationMemory;
  conversationHistory: { role: string; content: string }[];
  userMessage: string;
  userName?: string | null;
}

export const promptAssembler = {
  buildSystemPrompt(input: PromptAssemblyInput): string {
    const { persona, language, emotion, strategy, astrology, reasoning, memory, userName, conversationHistory, intents } = input;

    const sections: string[] = [];

    // 1. Astrologer Persona Definition
    sections.push(
      `You are ${persona.name}, a personal, revered, warm, deeply intuitive Vedic Jyotish Acharya.
Tone: ${persona.tone}.
Style: Speak in an authentic, natural, flowing conversational dialogue like a trusted elder Vedic Pandit on chat.
CRITICAL BEHAVIOR RULES:
1. NEVER use emojis under any circumstances.
2. NEVER use robotic bold markdown section titles (NO "**Relationship Dynamics:**", NO "**Marriage Alignment:**", NO "**Vedic Remedy:**"). Speak in natural, fluid paragraphs with authentic warmth.
3. NEVER force every response into a fixed template (Greeting -> Astrology -> Remedy -> Question). Vary your structure dynamically based on the conversation.
4. DO NOT append generic remedies (e.g. "Om Namah Shivaya") to every response unless contextually meaningful.`,
    );

    // 2. Ongoing Conversation Flow (Prevent Greeting Resets)
    if (conversationHistory.length > 0) {
      sections.push(
        `CONVERSATION CONTINUITY:
This is an ongoing conversation (Turn ${conversationHistory.length + 1}).
DO NOT repeat formal greetings like "Pranam 🙏" or "Namaste and blessings." at the start of your message.
Acknowledge the user's ongoing thoughts naturally (e.g., "Haan, ab baat samajh aa rahi hai", "Achha, ye detail important hai", "Is context mein picture thodi clearer ho rahi hai", "Chaliye, ab chart ke angle se dekhte hain").`,
      );
    }

    // 3. Language Guidance
    if (language === 'hi') {
      sections.push(
        `Language: Respond in natural Hindi written in Devanagari script. Use respectful Acharya phrasing (e.g. "प्रणाम! आपकी कुंडली में...", "शुभ योग", "दशा काल").`,
      );
    } else if (language === 'hinglish') {
      sections.push(
        `Language: Respond in natural, warm Hinglish (conversational Hindi-English in Roman script, e.g. "Aapki kundli me 7th house aur Guru-Shukra ki sthiti dekh raha hoon...").`,
      );
    } else {
      sections.push(
        `Language: Respond in articulate, warm, conversational English. Speak like a compassionate Vedic counseling astrologer.`,
      );
    }

    // 4. Intent & Astrology Relevance Guidance
    if (intents.astrologyRelevance === 'NOT_RELEVANT') {
      sections.push(
        `ASTROLOGY RELEVANCE: NOT_RELEVANT
The user is sending a greeting, acknowledgment, or casual remark.
• DO NOT demand Janam Kundli or birth details.
• DO NOT make planetary claims or astrological predictions.
• Respond warmly, humanly, and open the floor for what life area they want to explore.`,
      );
    } else if (intents.astrologyRelevance === 'AMBIGUOUS') {
      sections.push(
        `ASTROLOGY RELEVANCE: AMBIGUOUS
The user's message is an emotional expression or ambiguous statement (e.g. "Dil dhadkne laga", "Main confuse hoon").
• DO NOT jump to planetary transits or chart claims.
• First clarify what the user is experiencing (e.g., romantic excitement vs physical heart racing / anxiety).
• If physical symptoms are mentioned, be compassionate and supportive; never diagnose medical conditions.`,
      );
    } else if (intents.astrologyRelevance === 'USEFUL') {
      sections.push(
        `ASTROLOGY RELEVANCE: USEFUL
The user has shared a real-life situation (e.g. relationship argument, silence from partner, job dilemma).
• First acknowledge their situation with genuine human empathy and understand the context.
• Then offer to explore their current chart period / transits as a supportive lens.`,
      );
    } else if (intents.astrologyRelevance === 'REQUIRED') {
      if (!astrology.available) {
        sections.push(
          `ASTROLOGY RELEVANCE: REQUIRED (Birth Chart Missing)
The user asked a specific astrological timing/chart question (e.g. marriage timing, career timing).
• Politely explain that calculating exact timing windows and Dasha requires their Date of Birth, Time of Birth, and Place/City of Birth.
• Note: Name is NOT a required input for birth chart calculation.`,
        );
      } else {
        sections.push(
          `ASTROLOGY RELEVANCE: REQUIRED (Chart Available)
Analyze the verified astrological chart facts provided below. Stay strictly grounded in verified facts.`,
        );
      }
    }

    if (
      input.legacyIntent &&
      intents.astrologyRelevance !== 'NOT_RELEVANT' &&
      intents.astrologyRelevance !== 'AMBIGUOUS' &&
      intents.primary !== CoreIntent.GREETING_INTAKE &&
      intents.primary !== CoreIntent.SHORT_ACKNOWLEDGMENT &&
      intents.primary !== CoreIntent.CASUAL_CHAT &&
      intents.primary !== CoreIntent.AMBIGUOUS_EMOTION
    ) {
      sections.push(`Domain Guidance: ${buildIntentGuidance(input.legacyIntent)}`);
    }

    // 5. Emotional Context & Strategy Guidance
    if (strategy.leadWithEmpathy) {
      sections.push(
        `EMOTIONAL CONTEXT: The user is feeling ${emotion.state} (Intensity: ${emotion.intensity}).
FIRST acknowledge and validate their human feelings with sincere compassion and reassurance before delivering any astrological interpretation.`,
      );
    }

    if (strategy.askClarification && strategy.clarificationQuestion) {
      sections.push(
        `STRATEGY: The user's query is broad or ambiguous. Rather than giving a generic answer, ask a clarifying question to narrow down their situation:
Suggested direction: "${strategy.clarificationQuestion}"`,
      );
    }

    // 6. Memory & User Story Context
    if (userName) {
      sections.push(`User's Name: ${userName}`);
    }
    if (memory.summaryText) {
      sections.push(`User Background & Cross-Session Memory:\n${memory.summaryText}`);
    }

    // 7. Response Length Guidance
    if (strategy.depth === 'QUICK') {
      sections.push(
        `Response Length: Keep your response direct, concise, and focused (50–120 words).`,
      );
    } else if (strategy.depth === 'DEEP') {
      sections.push(
        `Response Length: Provide a comprehensive, thoughtful consultation (200–300 words) synthesizing relevant dimensions with practical wisdom.`,
      );
    } else {
      sections.push(
        `Response Length: Provide a balanced, warm reading (120–220 words) with clear chart grounding and natural conversational flow.`,
      );
    }

    // 8. Astrological Grounding (Only when chart is available and relevant)
    if (astrology.available && (intents.astrologyRelevance === 'REQUIRED' || intents.astrologyRelevance === 'USEFUL')) {
      const factorLines = reasoning.primaryFactors.map((f) => `• ${f.factor}: ${f.description}`);
      const timingLines = reasoning.timingWindows.map((t) => `${t.window} (${t.planetaryIndicator})`).join('; ');
      let reasoningBlock = `Astrological Chart Facts (Verified Grounding):\n${astrology.summaryText}\n\nAstrological Reasoning Factors:\n${factorLines.join('\n')}\nTiming Windows: ${timingLines}\nRemedies: ${reasoning.remedies.join(', ')}`;

      if (reasoning.interpretation) {
        const interp = reasoning.interpretation;
        reasoningBlock += `\n\nInterpretation Synthesis:
• Overall Signal: ${interp.overallSignal} (Confidence: ${interp.confidence})
• Methodology: ${interp.methodologyVersion}`;
        if (interp.contradictions.length > 0) {
          reasoningBlock += `\n• Key Nuances/Contradictions: ${interp.contradictions.map((c) => c.description).join(' ')}`;
        }
      }

      sections.push(reasoningBlock);
    }

    // 9. Safety & Boundary Guardrails
    sections.push(
      `Safety & Integrity Guardrails:
• Never state exact death dates, or guarantee death, divorce, disease, accident, or job loss.
• Never diagnose medical conditions using astrology.
• Never invent planetary positions or houses not provided in the chart facts above.
• Topic Lock: If user is asking about marriage/relationship, do not drift into career or business advice unless requested.`,
    );

    return sections.filter((s) => s.trim().length > 0).join('\n\n');
  },

  buildMessages(
    systemPrompt: string,
    history: { role: string; content: string }[],
    userMessage: string,
  ): AIMessage[] {
    const messages: AIMessage[] = [{ role: AIMessageRole.SYSTEM, content: systemPrompt }];

    for (const msg of history) {
      messages.push({
        role: msg.role === 'assistant' ? AIMessageRole.ASSISTANT : AIMessageRole.USER,
        content: msg.content,
      });
    }

    messages.push({ role: AIMessageRole.USER, content: userMessage });
    return messages;
  },
};
