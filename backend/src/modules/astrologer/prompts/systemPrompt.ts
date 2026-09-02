import {
  AIMessageRole,
  type AIMessage,
  type AstrologerPersona,
  type IntentCategory,
  type SupportedLanguage,
} from '@astroai/shared-types';
import type { AstrologyContext } from '../context/astrologyContext';
import type { ConversationContext } from '../context/conversationContext';
import type { UserPreferenceContext } from '../context/userPreferenceContext';
import { buildReasoningContext } from '../context/reasoningContext';
import { buildPersonaPrompt } from './personaPrompt';
import { buildLanguageInstruction } from './languageInstructions';
import { buildIntentGuidance } from './intentGuidance';
import { SAFETY_RULES } from './safetyRules';

export interface SystemPromptInput {
  persona: AstrologerPersona;
  intent: Exclude<IntentCategory, 'crisis_self_harm'>;
  language: SupportedLanguage;
  astrology: AstrologyContext;
  conversation: ConversationContext;
  userPreferences: UserPreferenceContext;
}

function buildConversationMemorySection(conversation: ConversationContext): string {
  const parts: string[] = [];
  if (conversation.summary) {
    parts.push(`Summary of earlier parts of this conversation: ${conversation.summary}`);
  }
  if (conversation.hasOlderHistory) {
    parts.push(
      'There is earlier conversation history beyond what is shown below — do not act as if this is necessarily the start of the relationship with this user unless the recent messages indicate it is.',
    );
  }
  return parts.join('\n');
}

function buildUserContextSection(userPreferences: UserPreferenceContext): string {
  const lines: string[] = [];
  lines.push(
    userPreferences.name
      ? `The user's name is ${userPreferences.name} — use it naturally, not in every message.`
      : "The user's name is not known yet.",
  );
  lines.push(
    userPreferences.isFirstMessageInConversation
      ? 'This is the first message of a new conversation — greet the user per your greeting behavior.'
      : 'This conversation is already underway — do not re-greet or re-introduce yourself; continue naturally from where it left off.',
  );
  return lines.join('\n');
}

/**
 * Assembles the one system message sent to the AI Gateway, in a fixed,
 * intentional order: persona → hard safety rules → language →
 * intent-specific guidance → astrology facts → reasoning guidance →
 * conversation memory → user context. Safety rules sit immediately after
 * the persona (not buried at the end) so nothing overrides them.
 */
export function buildSystemPrompt(input: SystemPromptInput): string {
  const sections = [
    buildPersonaPrompt(input.persona),
    SAFETY_RULES,
    `Additional behaviors this persona must never do: ${input.persona.prohibitedBehaviors.join(' ')}`,
    buildLanguageInstruction(input.language),
    buildIntentGuidance(input.intent),
    `Astrology context (the only facts you may reference):\n${input.astrology.summaryText}`,
    buildReasoningContext(input.intent, input.astrology),
    buildConversationMemorySection(input.conversation),
    buildUserContextSection(input.userPreferences),
    'Vary your phrasing across the conversation — do not open consecutive responses with the same sentence or template (e.g. do not always start with "According to your birth chart...").',
  ];

  return sections.filter((section) => section.trim().length > 0).join('\n\n');
}

/** Builds the full message list (system + windowed history + the current
 * user message) ready to hand to `aiGateway.generateText`/`streamText`. */
export function buildMessages(
  systemPrompt: string,
  conversation: ConversationContext,
  userMessage: string,
): AIMessage[] {
  const messages: AIMessage[] = [{ role: AIMessageRole.SYSTEM, content: systemPrompt }];
  for (const message of conversation.recentMessages) {
    messages.push({
      role: message.role === 'assistant' ? AIMessageRole.ASSISTANT : AIMessageRole.USER,
      content: message.content,
    });
  }
  messages.push({ role: AIMessageRole.USER, content: userMessage });
  return messages;
}
