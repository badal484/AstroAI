import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  AICapability,
  AIProviderName,
  ModelAlias,
} from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { aiConfigService } from '../../../src/modules/ai/aiConfig.service';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../../src/modules/ai/registry';
import type { ProviderAdapter } from '../../../src/modules/ai/ai.types';
import {
  executeAstrologerConsultation,
  intentEngine,
  emotionDetector,
  CoreIntent,
  EmotionalState,
  ResponseAction,
} from '../../../src/modules/astrologer-intelligence';

const fakeAdapter = {
  providerName: AIProviderName.OPENAI,
  capabilities: new Set([AICapability.TEXT_GENERATION, AICapability.STRUCTURED_OUTPUT]),
  generateText: vi.fn(async (params) => {
    const userMsg = params.messages[params.messages.length - 1]?.content ?? '';
    const sysPrompt = params.messages[0]?.content ?? '';

    if (/\b(hi|hello|hey|namaste|pranam)\b/i.test(userMsg) && params.messages.length <= 2) {
      return {
        text: 'Namaste. I am Acharya Vashishta. What brings you to our consultation today? Feel free to explore marriage, career, love, or today\'s guidance.',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('dil dhadk') || userMsg.toLowerCase().includes('heart racing')) {
      return {
        text: 'Dil kis wajah se dhadakne laga? Kisi special person ki wajah se ya physical heart racing feel ho rahi hai?',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('shaadi') || userMsg.toLowerCase().includes('marry')) {
      if (sysPrompt.includes('Hinglish')) {
        return {
          text: 'Pranam! Aapki kundli me 7th house aur Guru-Shukra ki sthiti dekh raha hoon. Age 25 se 28 ke beech vivah ke prabal yog ban rahe hain.',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        };
      }
      return {
        text: 'Looking at your 7th house and Jupiter-Venus placements, favorable marriage windows align around age 25 to 28.',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('girlfriend')) {
      return {
        text: 'I understand this distance in your relationship is causing distress. Kya koi specific ladai hui thi ya achanak baat band hui?',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('confused about my career')) {
      return {
        text: 'I understand career confusion can be overwhelming. Are you looking to grow within your current field, switch jobs, or explore a completely different path?',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('next 6 months')) {
      return {
        text: 'Over the next 6 months, major planetary transits including Jupiter will activate your career and financial sectors.',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.includes('मेरी शादी')) {
      return {
        text: 'प्रणाम! आपकी जन्मपत्रिका में सप्तम भाव और गुरु-शुक्र की दृष्टि से विवाह के लिए शुभ योग बन रहे हैं।',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('promotion')) {
      return {
        text: 'Pranam! Aapke 10th house me Surya aur Shani ke transit se next few months me promotion aur growth ke ache sanket hain.',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('die')) {
      return {
        text: 'Vedic astrology is an ethical spiritual science for self-discovery and karma guidance, not for making definitive predictions about lifespan or death.',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }
    if (userMsg.toLowerCase().includes('terrified')) {
      return {
        text: 'I hear the deep anxiety and weight on your heart. Please take a gentle breath; uncertainty in relationships can make us fear the worst, but your 7th house indicates meaningful companionship ahead.',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    }

    return {
      text: 'Namaste. I am studying your birth chart and planetary yogas.',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    };
  }),
  streamText: () => ({
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.reject(new Error('not used in this test')),
    }),
  }),
  generateStructured: vi.fn(),
  generateEmbedding: () => Promise.reject(new Error('not used in this test')),
} satisfies ProviderAdapter;

async function setUpRouting() {
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

describe('Astrologer Intelligence Consultation Engine — Evaluation Suite', () => {
  const userId = 'test-user-id';

  beforeEach(async () => {
    await redis.flushall();
    __resetProviderRegistryForTests();
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: fakeAdapter,
    });
    await setUpRouting();
  });

  // Test A: Greeting & Intake
  it('Test A: User says "Hi" — begins natural consultation without dumping predictions or birth demands', async () => {
    const intents = intentEngine.detectIntents('Hi');
    expect(intents.primary).toBe(CoreIntent.GREETING_INTAKE);
    expect(intents.astrologyRelevance).toBe('NOT_RELEVANT');

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Hi',
      preferredLanguage: 'en',
    });

    expect(result.responseText).toContain('Namaste');
    expect(result.responseText).not.toContain('Date of Birth');
    expect(result.meta.strategyAction).toBe(ResponseAction.GREET_AND_DISCOVER);
  });

  // Test B: Marriage Timing
  it('Test B: User asks "meri shaadi kab hogi?" — delivers chart-grounded timing window without robotic bullet headers', async () => {
    const intents = intentEngine.detectIntents('meri shaadi kab hogi?');
    expect(intents.primary).toBe(CoreIntent.MARRIAGE_TIMING);

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'meri shaadi kab hogi?',
      preferredLanguage: 'hinglish',
    });

    expect(result.responseText).toContain('7th house');
    expect(result.responseText).toContain('Guru');
    expect(result.responseText).not.toContain('**Relationship Dynamics:**');
    expect(result.responseText).not.toContain('**Vedic Remedy:**');
    expect(result.responseText).toContain('25 se 28');
  });

  // Test C: Relationship Situation & Distress
  it('Test C: User says "meri girlfriend mujhse baat nahi kar rahi" — leads with empathy and asks clarification', async () => {
    const intents = intentEngine.detectIntents('meri girlfriend mujhse baat nahi kar rahi');
    expect([
      CoreIntent.RELATIONSHIP_CONFLICT,
      CoreIntent.RELATIONSHIP_CURRENT_SITUATION,
    ]).toContain(intents.primary);

    const emotion = emotionDetector.detectEmotion('meri girlfriend mujhse baat nahi kar rahi');
    expect(emotion.requiresEmpathyFirst).toBe(true);

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'meri girlfriend mujhse baat nahi kar rahi',
      preferredLanguage: 'hinglish',
    });

    expect(result.meta.strategyAction).toBe(ResponseAction.ASK_CLARIFICATION);
    expect(result.responseText.toLowerCase()).toMatch(/distance|ladai|baat/);
  });

  // Test D: Career Confusion
  it('Test D: User says "I\'m confused about my career." — asks clarifying question before analysis', async () => {
    const intents = intentEngine.detectIntents("I'm confused about my career.");
    expect(intents.requiresClarification).toBe(true);

    const emotion = emotionDetector.detectEmotion("I'm confused about my career.");
    expect(emotion.state).toBe(EmotionalState.CONFUSED);

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: "I'm confused about my career.",
      preferredLanguage: 'en',
    });

    expect(result.meta.strategyAction).toBe(ResponseAction.ASK_CLARIFICATION);
    expect(result.responseText).toMatch(/current field|switch jobs|different/i);
  });

  // Test E: 6-Month Forecast
  it('Test E: User asks "what does my next 6 months look like?" — provides broader period forecast', async () => {
    const intents = intentEngine.detectIntents('what does my next 6 months look like?');
    expect(intents.primary).toBe(CoreIntent.PERIOD_FORECAST_6M);

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'what does my next 6 months look like?',
      preferredLanguage: 'en',
    });

    expect(result.responseText).toMatch(/transit|next 6 months|jupiter/i);
  });

  // Test F: Multilingual Switching
  it('Test F: Follows Hindi and Hinglish switches seamlessly', async () => {
    const hindiResult = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'मेरी शादी कब होगी?',
      preferredLanguage: 'hi',
    });
    expect(hindiResult.language).toBe('hi');
    expect(hindiResult.responseText).toMatch(/सप्तम भाव|विवाह|प्रणाम/);

    const hinglishResult = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Mera promotion kab hoga?',
      preferredLanguage: 'hinglish',
    });
    expect(hinglishResult.language).toBe('hinglish');
    expect(hinglishResult.responseText).toMatch(/Pranam|10th house|promotion/i);
  });

  // Test G: Safety Gate against Death Prediction
  it('Test G: User asks "Will I die this year?" — refuses death prediction safely', async () => {
    const intents = intentEngine.detectIntents('Will I die this year?');
    expect(intents.primary).toBe(CoreIntent.UNSAFE_PREDICTION);

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Will I die this year?',
      preferredLanguage: 'en',
    });

    expect(result.responseText).toMatch(/ethical|definitive|karma/i);
    expect(result.responseText).not.toMatch(/you will die/i);
  });

  // Test H: Severe Anxiety & Empathy First
  it('Test H: User says "I\'m terrified that I\'ll never find someone." — validates anxiety first then gives relationship reading', async () => {
    const emotion = emotionDetector.detectEmotion("I'm terrified that I'll never find someone.");
    expect(emotion.state).toBe(EmotionalState.FEARFUL);
    expect(emotion.requiresEmpathyFirst).toBe(true);

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: "I'm terrified that I'll never find someone.",
      preferredLanguage: 'en',
    });

    expect(result.meta.detectedEmotion).toBe(EmotionalState.FEARFUL);
    expect(result.responseText.toLowerCase()).toMatch(/anxiety|heart|uncertainty/);
  });

  // Test I: Ambiguity handling ("Dil dhadkne laga")
  it('Test I: User says "Dil dhadkne laga" — handles ambiguity with emotional intelligence before astrology', async () => {
    const intents = intentEngine.detectIntents('Dil dhadkne laga');
    expect(intents.primary).toBe(CoreIntent.AMBIGUOUS_EMOTION);
    expect(intents.astrologyRelevance).toBe('AMBIGUOUS');

    const result = await executeAstrologerConsultation({
      userId,
      birthProfileId: null,
      conversationHistory: [],
      userMessage: 'Dil dhadkne laga',
      preferredLanguage: 'hinglish',
    });

    expect(result.meta.strategyAction).toBe(ResponseAction.HANDLE_AMBIGUITY);
    expect(result.responseText.toLowerCase()).toMatch(/special person|heart racing/);
  });
});
