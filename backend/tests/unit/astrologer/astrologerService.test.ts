import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AICapability,
  AIProviderName,
  IntentCategory,
  ModelAlias,
  SupportedLanguage,
} from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { aiConfigService } from '../../../src/modules/ai/aiConfig.service';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../../src/modules/ai/registry';
import type { ProviderAdapter } from '../../../src/modules/ai/ai.types';
import { generateAstrologerResponse } from '../../../src/modules/astrologer/astrologer.service';
import { personaService } from '../../../src/modules/astrologer/persona/persona.service';

const fakeAdapter = {
  providerName: AIProviderName.OPENAI,
  capabilities: new Set([AICapability.TEXT_GENERATION, AICapability.STRUCTURED_OUTPUT]),
  generateText: vi.fn(),
  streamText: () => ({
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.reject(new Error('not used in this test')),
    }),
  }),
  generateStructured: vi.fn(),
  generateEmbedding: () => Promise.reject(new Error('not used in this test')),
} satisfies ProviderAdapter;

function textResult(text: string) {
  return { text, usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } };
}

function classificationResult(intent: IntentCategory, confidence = 0.9) {
  return {
    text: JSON.stringify({ intent, confidence }),
    usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
  };
}

async function setUpRouting() {
  // Distinct model ids per alias so we can tell, from the adapter's own
  // call args, which alias the router actually resolved to (the adapter
  // itself never sees the alias, only the resolved model).
  await aiConfigService.setRoutingCandidates(ModelAlias.SMART_CHAT, [
    { provider: AIProviderName.OPENAI, model: 'smart-model' },
  ]);
  await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
    { provider: AIProviderName.OPENAI, model: 'fast-model' },
  ]);
  await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
    { provider: AIProviderName.OPENAI, model: 'classification-model' },
  ]);
}

beforeEach(async () => {
  await redis.flushall();
  __resetProviderRegistryForTests();
  __setProviderRegistryForTests({ [AIProviderName.OPENAI]: fakeAdapter });
  await setUpRouting();
  await personaService.resetToDefaultPersona();
  fakeAdapter.generateText.mockReset();
  fakeAdapter.generateStructured.mockReset();
});

function lastGenerateTextSystemPrompt(): string {
  const call = fakeAdapter.generateText.mock.calls.at(-1)!;
  const options = call[0] as { messages: { role: string; content: string }[] };
  return options.messages[0]!.content;
}

describe('generateAstrologerResponse — life-area intents', () => {
  it('answers a love question warmly, with love-specific guidance in the prompt', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.LOVE));
    fakeAdapter.generateText.mockResolvedValue(
      textResult(
        "It sounds like this is on your mind a lot right now. Venus's placement suggests warmth is coming your way, though the timing depends on how open you are to it.",
      ),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Will I find love this year?',
    });

    expect(result.intent).toBe(IntentCategory.LOVE);
    expect(result.isCrisisResponse).toBe(false);
    expect(result.responseText).toMatch(/venus/i);
    expect(lastGenerateTextSystemPrompt()).toMatch(/love or a relationship/i);
  });

  it('answers a marriage question without guaranteeing an outcome', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.MARRIAGE));
    fakeAdapter.generateText.mockResolvedValue(
      textResult(
        'Marriage questions often carry a lot of family expectation with them. This period looks favorable, though the exact timing is never something a chart can promise.',
      ),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'When will I get married?',
    });

    expect(result.intent).toBe(IntentCategory.MARRIAGE);
    expect(lastGenerateTextSystemPrompt()).toMatch(/never state a guaranteed marriage/i);
  });

  it('answers a career question using the smart-chat alias', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.CAREER));
    fakeAdapter.generateText.mockResolvedValue(
      textResult('This looks like a solid period for taking initiative at work.'),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Should I ask for a promotion?',
    });

    expect(result.intent).toBe(IntentCategory.CAREER);
    const call = fakeAdapter.generateText.mock.calls.at(-1)![0] as { model: string };
    expect(call.model).toBe('smart-model');
  });

  it('answers a money question without promising financial guarantees', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.MONEY));
    fakeAdapter.generateText.mockResolvedValue(
      textResult('There is a generally favorable tendency for finances this period.'),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Will I become rich?',
    });

    expect(result.intent).toBe(IntentCategory.MONEY);
    expect(lastGenerateTextSystemPrompt()).toMatch(/never promise guaranteed financial success/i);
  });

  it('answers a family question with empathy-first guidance', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.FAMILY));
    fakeAdapter.generateText.mockResolvedValue(
      textResult('Family tensions like this are never easy to sit with.'),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'My parents keep fighting, what does my chart say about my family?',
    });

    expect(result.intent).toBe(IntentCategory.FAMILY);
    expect(lastGenerateTextSystemPrompt()).toMatch(/family topics can be sensitive/i);
  });

  it('answers a general astrology question conversationally', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(
      classificationResult(IntentCategory.GENERAL_ASTROLOGY),
    );
    fakeAdapter.generateText.mockResolvedValue(
      textResult('Your moon sign shapes a lot of your emotional instincts.'),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'What is a moon sign?',
    });

    expect(result.intent).toBe(IntentCategory.GENERAL_ASTROLOGY);
  });

  it('answers a daily horoscope question using the fast-chat alias', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(
      classificationResult(IntentCategory.DAILY_HOROSCOPE),
    );
    fakeAdapter.generateText.mockResolvedValue(
      textResult('Today looks steady — a good day for small decisions.'),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: "What's my horoscope for today?",
    });

    expect(result.intent).toBe(IntentCategory.DAILY_HOROSCOPE);
    const call = fakeAdapter.generateText.mock.calls.at(-1)![0] as { model: string };
    expect(call.model).toBe('fast-model');
  });

  it('answers a compatibility question, deferring when only one chart is available', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(
      classificationResult(IntentCategory.COMPATIBILITY),
    );
    fakeAdapter.generateText.mockResolvedValue(
      textResult("I'd need both of your birth details to compare charts properly."),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Are me and my partner compatible?',
    });

    expect(result.intent).toBe(IntentCategory.COMPATIBILITY);
    expect(lastGenerateTextSystemPrompt()).toMatch(
      /only compare charts using facts explicitly provided/i,
    );
  });
});

describe('generateAstrologerResponse — unclear questions', () => {
  it('asks a clarifying question instead of guessing', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(
      classificationResult(IntentCategory.UNCLEAR, 0.4),
    );
    fakeAdapter.generateText.mockResolvedValue(
      textResult(
        "I'd love to help — could you tell me a bit more about what you're curious about?",
      ),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'hmm what do you think',
    });

    expect(result.intent).toBe(IntentCategory.UNCLEAR);
    expect(lastGenerateTextSystemPrompt()).toMatch(/warmly ask a short clarifying question/i);
  });
});

describe('generateAstrologerResponse — multilingual questions', () => {
  it('detects and responds appropriately to an English question', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(
      classificationResult(IntentCategory.GENERAL_ASTROLOGY),
    );
    fakeAdapter.generateText.mockResolvedValue(textResult('Sure, happy to explain that.'));

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'What is a nakshatra?',
    });

    expect(result.language).toBe(SupportedLanguage.ENGLISH);
    expect(lastGenerateTextSystemPrompt()).toMatch(/conversational English/i);
  });

  it('detects and responds appropriately to a Hindi question', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.MARRIAGE));
    fakeAdapter.generateText.mockResolvedValue(textResult('यह एक अच्छा समय लग रहा है।'));

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'मेरी शादी कब होगी?',
    });

    expect(result.language).toBe(SupportedLanguage.HINDI);
    expect(lastGenerateTextSystemPrompt()).toMatch(/devanagari script/i);
  });

  it('detects and responds appropriately to a Hinglish question', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.CAREER));
    fakeAdapter.generateText.mockResolvedValue(
      textResult('Yeh time thoda positive lag raha hai career ke liye.'),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'mera career kaisa rahega is saal',
    });

    expect(result.language).toBe(SupportedLanguage.HINGLISH);
    expect(lastGenerateTextSystemPrompt()).toMatch(/hinglish/i);
  });
});

describe('generateAstrologerResponse — unsafe questions', () => {
  it('declines an unsafe request without calling the AI classifier', async () => {
    fakeAdapter.generateText.mockResolvedValue(
      textResult(
        "That's not something I can help with, but I'm happy to talk about your chart if you'd like.",
      ),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'how to make a bomb',
    });

    expect(result.intent).toBe(IntentCategory.UNSAFE);
    expect(fakeAdapter.generateStructured).not.toHaveBeenCalled();
    expect(lastGenerateTextSystemPrompt()).toMatch(/decline warmly and briefly/i);
  });
});

describe('generateAstrologerResponse — medical questions', () => {
  it('includes medical guidance and never lets a diagnosis through, even if the model drafts one', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(classificationResult(IntentCategory.MEDICAL));
    fakeAdapter.generateText
      .mockResolvedValueOnce(textResult('Your chart shows you have cancer, unfortunately.'))
      .mockResolvedValueOnce(
        textResult(
          "Astrology can't diagnose health conditions — for anything health-related, it's best to see a doctor. I can share what your chart suggests energetically, though.",
        ),
      );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Do I have a serious illness?',
    });

    expect(result.intent).toBe(IntentCategory.MEDICAL);
    expect(result.responseText).not.toMatch(/you have cancer/i);
    expect(result.meta.safetyCorrectionApplied).toBe(true);
    expect(fakeAdapter.generateText).toHaveBeenCalledTimes(2);
  });
});

describe('generateAstrologerResponse — death-related questions', () => {
  it('never lets a death prediction through, even if the first draft contains one', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(
      classificationResult(IntentCategory.GENERAL_ASTROLOGY),
    );
    fakeAdapter.generateText
      .mockResolvedValueOnce(textResult('Based on your chart, you will die in 2050.'))
      .mockResolvedValueOnce(
        textResult(
          "This is a hard thing to think about — astrology can point to challenging periods, but it can't predict something like that.",
        ),
      );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'When will I die?',
    });

    expect(result.responseText).not.toMatch(/you will die/i);
    expect(result.meta.safetyCorrectionApplied).toBe(true);
  });

  it('falls back to a fixed safe response if even the corrected draft is unsafe', async () => {
    fakeAdapter.generateStructured.mockResolvedValue(
      classificationResult(IntentCategory.GENERAL_ASTROLOGY),
    );
    fakeAdapter.generateText.mockResolvedValue(
      textResult('Based on your chart, you will die in 2050.'),
    );

    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'When will I die?',
    });

    expect(result.responseText).not.toMatch(/you will die/i);
    expect(result.meta.safetyCorrectionApplied).toBe(true);
    expect(fakeAdapter.generateText).toHaveBeenCalledTimes(2);
  });
});

describe('generateAstrologerResponse — crisis/self-harm language', () => {
  it('returns a fixed supportive response without calling the AI Gateway at all', async () => {
    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'I want to end my life, nothing feels worth it anymore',
    });

    expect(result.isCrisisResponse).toBe(true);
    expect(result.intent).toBe(IntentCategory.CRISIS_SELF_HARM);
    expect(result.meta.provider).toBeNull();
    expect(fakeAdapter.generateText).not.toHaveBeenCalled();
    expect(fakeAdapter.generateStructured).not.toHaveBeenCalled();
    expect(result.responseText).toMatch(/crisis helpline|emergency services/i);
  });

  it('returns the crisis response in the language the user wrote in', async () => {
    const result = await generateAstrologerResponse({
      userId: 'user-1',
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'main marna chahta hoon, jeena nahi chahta',
    });

    expect(result.isCrisisResponse).toBe(true);
    expect(result.language).toBe(SupportedLanguage.HINGLISH);
    expect(fakeAdapter.generateText).not.toHaveBeenCalled();
  });
});
