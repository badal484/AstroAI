import { z } from 'zod';

/**
 * The AI astrologer intelligence layer's domain types (CLAUDE.md §12-19,
 * §22). This is the persona/conversation layer built on top of the AI
 * Gateway (`ai.ts`) and the Astrology Engine (`astrology.ts`) — it never
 * calculates astrology and never talks to a provider SDK directly.
 */

export const SupportedLanguage = {
  ENGLISH: 'en',
  HINDI: 'hi',
  HINGLISH: 'hinglish',
} as const;
export type SupportedLanguage = (typeof SupportedLanguage)[keyof typeof SupportedLanguage];

/**
 * What the user is actually asking about. `crisis_self_harm`, `medical`
 * and `unsafe` are safety-gate categories (CLAUDE.md §16/§17) — detected
 * before generation, not just for prompt flavor.
 */
export const IntentCategory = {
  LOVE: 'love',
  MARRIAGE: 'marriage',
  CAREER: 'career',
  MONEY: 'money',
  FAMILY: 'family',
  GENERAL_ASTROLOGY: 'general_astrology',
  DAILY_HOROSCOPE: 'daily_horoscope',
  COMPATIBILITY: 'compatibility',
  UNCLEAR: 'unclear',
  MEDICAL: 'medical',
  CRISIS_SELF_HARM: 'crisis_self_harm',
  UNSAFE: 'unsafe',
} as const;
export type IntentCategory = (typeof IntentCategory)[keyof typeof IntentCategory];

export const ConversationRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;
export type ConversationRole = (typeof ConversationRole)[keyof typeof ConversationRole];

export interface AstrologerMessage {
  role: ConversationRole;
  content: string;
}

/**
 * Configurable persona data (CLAUDE.md §12-14/§34: "admin must be able to
 * configure ... persona"). One persona is active at a time today (a
 * single admin-editable document, falling back to `DEFAULT_PERSONA` when
 * unconfigured — see `modules/astrologer/persona`); the shape already
 * supports multiple named personas for whenever that's needed.
 */
export interface AstrologerPersona {
  id: string;
  name: string;
  description: string;
  tone: string;
  personalityTraits: string[];
  expertise: string[];
  supportedLanguages: SupportedLanguage[];
  responseStyle: string;
  greetingBehavior: string;
  prohibitedBehaviors: string[];
}

export const astrologerPersonaSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(500),
  tone: z.string().trim().min(1).max(200),
  personalityTraits: z.array(z.string().trim().min(1)).min(1).max(20),
  expertise: z.array(z.string().trim().min(1)).min(1).max(20),
  supportedLanguages: z.array(z.nativeEnum(SupportedLanguage)).min(1),
  responseStyle: z.string().trim().min(1).max(500),
  greetingBehavior: z.string().trim().min(1).max(500),
  prohibitedBehaviors: z.array(z.string().trim().min(1)).min(1).max(30),
});
