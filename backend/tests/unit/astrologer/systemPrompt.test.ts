import { describe, expect, it } from 'vitest';
import { IntentCategory, SupportedLanguage } from '@astroai/shared-types';
import { DEFAULT_PERSONA } from '../../../src/modules/astrologer/persona/defaultPersona';
import { buildConversationContext } from '../../../src/modules/astrologer/context/conversationContext';
import { buildUserPreferenceContext } from '../../../src/modules/astrologer/context/userPreferenceContext';
import {
  buildMessages,
  buildSystemPrompt,
} from '../../../src/modules/astrologer/prompts/systemPrompt';
import type { AstrologyContext } from '../../../src/modules/astrologer/context/astrologyContext';

const availableAstrology: AstrologyContext = {
  available: true,
  birthProfileName: 'Test Subject',
  timeConfidence: 'exact',
  summaryText: 'Ascendant: Aries. Venus in Taurus (house 2).',
};

describe('buildSystemPrompt', () => {
  it('includes the persona, hard safety rules, language instruction and intent guidance', () => {
    const prompt = buildSystemPrompt({
      persona: DEFAULT_PERSONA,
      intent: IntentCategory.LOVE,
      language: SupportedLanguage.ENGLISH,
      astrology: availableAstrology,
      conversation: buildConversationContext([]),
      userPreferences: buildUserPreferenceContext({
        name: null,
        preferredLanguage: null,
        isFirstMessageInConversation: true,
      }),
    });

    expect(prompt).toContain(DEFAULT_PERSONA.name);
    expect(prompt).toMatch(/never invent, guess, or assume any astrology fact/i);
    expect(prompt).toMatch(/never guarantee a prediction/i);
    expect(prompt).toMatch(/conversational English/i);
    expect(prompt).toMatch(/love or a relationship/i);
    expect(prompt).toContain(availableAstrology.summaryText);
  });

  it('instructs the model to greet on the first message and not to re-greet later', () => {
    const first = buildSystemPrompt({
      persona: DEFAULT_PERSONA,
      intent: IntentCategory.GENERAL_ASTROLOGY,
      language: SupportedLanguage.ENGLISH,
      astrology: availableAstrology,
      conversation: buildConversationContext([]),
      userPreferences: buildUserPreferenceContext({
        name: 'Priya',
        preferredLanguage: null,
        isFirstMessageInConversation: true,
      }),
    });
    expect(first).toMatch(/first message of a new conversation — greet/i);
    expect(first).toContain('Priya');

    const later = buildSystemPrompt({
      persona: DEFAULT_PERSONA,
      intent: IntentCategory.GENERAL_ASTROLOGY,
      language: SupportedLanguage.ENGLISH,
      astrology: availableAstrology,
      conversation: buildConversationContext([
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello Priya!' },
      ]),
      userPreferences: buildUserPreferenceContext({
        name: 'Priya',
        preferredLanguage: null,
        isFirstMessageInConversation: false,
      }),
    });
    expect(later).toMatch(/do not re-greet/i);
  });

  it('tells the model plainly not to invent facts when astrology data is unavailable', () => {
    const prompt = buildSystemPrompt({
      persona: DEFAULT_PERSONA,
      intent: IntentCategory.GENERAL_ASTROLOGY,
      language: SupportedLanguage.ENGLISH,
      astrology: {
        available: false,
        birthProfileName: null,
        timeConfidence: null,
        summaryText: 'No verified astrology data is available for this conversation.',
      },
      conversation: buildConversationContext([]),
      userPreferences: buildUserPreferenceContext({
        name: null,
        preferredLanguage: null,
        isFirstMessageInConversation: true,
      }),
    });

    expect(prompt).toMatch(/do not produce a chart-based interpretation/i);
  });

  it('switches the language instruction for Hindi and Hinglish', () => {
    const hindiPrompt = buildSystemPrompt({
      persona: DEFAULT_PERSONA,
      intent: IntentCategory.GENERAL_ASTROLOGY,
      language: SupportedLanguage.HINDI,
      astrology: availableAstrology,
      conversation: buildConversationContext([]),
      userPreferences: buildUserPreferenceContext({
        name: null,
        preferredLanguage: null,
        isFirstMessageInConversation: true,
      }),
    });
    expect(hindiPrompt).toMatch(/devanagari script/i);

    const hinglishPrompt = buildSystemPrompt({
      persona: DEFAULT_PERSONA,
      intent: IntentCategory.GENERAL_ASTROLOGY,
      language: SupportedLanguage.HINGLISH,
      astrology: availableAstrology,
      conversation: buildConversationContext([]),
      userPreferences: buildUserPreferenceContext({
        name: null,
        preferredLanguage: null,
        isFirstMessageInConversation: true,
      }),
    });
    expect(hinglishPrompt).toMatch(/hinglish/i);
  });
});

describe('buildMessages', () => {
  it('places the system prompt first, then windowed history, then the new user message', () => {
    const conversation = buildConversationContext([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ]);

    const messages = buildMessages('SYSTEM PROMPT', conversation, 'What about my career?');

    expect(messages[0]).toEqual({ role: 'system', content: 'SYSTEM PROMPT' });
    expect(messages[1]).toEqual({ role: 'user', content: 'Hi' });
    expect(messages[2]).toEqual({ role: 'assistant', content: 'Hello!' });
    expect(messages[3]).toEqual({ role: 'user', content: 'What about my career?' });
  });
});
