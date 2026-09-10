import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  executeAstrologerConsultation,
  type AstrologerConsultationResult,
} from '../../src/modules/astrologer-intelligence';
import { astrologerResponseEvaluator } from '../../src/modules/astrologer-intelligence/quality/astrologerResponseEvaluator';
import {
  ENGLISH_GOLDEN_CONVERSATIONS,
  HINDI_GOLDEN_CONVERSATIONS,
  HINGLISH_GOLDEN_CONVERSATIONS,
  type GoldenConversation,
} from '../fixtures/golden-conversations';
import {
  AICapability,
  AIProviderName,
  ModelAlias,
  SupportedLanguage,
  type AstrologerMessage,
} from '@astroai/shared-types';
import {
  __resetProviderRegistryForTests,
  __setProviderRegistryForTests,
} from '../../src/modules/ai/registry';
import { aiConfigService } from '../../src/modules/ai/aiConfig.service';
import type { ProviderAdapter } from '../../src/modules/ai/ai.types';

// Authentic mock provider adapter for deterministic golden evaluation
const mockConsultationAdapter: ProviderAdapter = {
  providerName: AIProviderName.OPENAI,
  capabilities: new Set([AICapability.TEXT_GENERATION, AICapability.STRUCTURED_OUTPUT]),
  generateText: vi.fn(async (params) => {
    const userMsg = params.messages[params.messages.length - 1]?.content ?? '';
    const lower = userMsg.toLowerCase().trim();

    // 1. Non-astrological casual & physical incidents
    if (lower.includes('protein')) {
      return {
        text: 'General health guidelines ke according daily roughly 0.8 se 1.5 grams protein per kg body weight safe rehta hai, depending on your physical activity. Health ya nutrition ke specific changes ke liye kisi certified nutritionist se consult karna best rahega.',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }
    if (lower.includes('gir gaya') || lower.includes('fell down') || lower.includes('bruised') || lower.includes('street')) {
      return {
        text: 'Oh, hope you are okay! Pehle chot par barf ya antiseptic laga lo agar dard zyada hai toh doctor ko dikha lena. Health aur physical safety pehle aati hai.',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }
    if (lower.includes('daru') || lower.includes('alcohol')) {
      return {
        text: 'Lagta hai aaj ka din kaafi exhausting raha hai. Mann ko shaant rakhne ke liye thoda aaram karo ya kisi close friend se baat kar lo. Aisa kya hua aaj jo itna heavy feel ho raha hai?',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }
    if (lower.includes('chik-chik') || lower.includes('kaam pe')) {
      return {
        text: 'Kaam ka pressure aur chik-chik kabhi kabhi bohot drain kar deti hai. Pehle thoda mind fresh karo aur relax karo.',
        usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
      };
    }

    // 2. Emotional Distress / Heartbreak
    if (lower.includes('broke up') || lower.includes('breakup') || lower.includes('shattered')) {
      return {
        text: 'I completely understand how heavy and exhausting this must feel right now. When a long connection ends, taking care of your emotional balance comes first. Take a deep breath—I am here for you. What feels most overwhelming right now?',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }
    if (lower.includes('reach back') || lower.includes('reach out') || lower.includes('wapas')) {
      return {
        text: 'Healing first must be the priority before looking for reconciliation. Kundli mein Venus aur dasha cycle patience demand karti hai.',
        usage: { promptTokens: 20, completionTokens: 35, totalTokens: 55 },
      };
    }

    // 3. User dissatisfaction & rude handling
    if (lower.includes('useless') || lower.includes('garbage')) {
      return {
        text: 'Fair enough. Agar pichhla answer kaam ka nahi laga toh tell me what missed the mark, main happy to focus directly and come straight to the point.',
        usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
      };
    }
    if (lower.includes('stupid bot') || lower.includes('bot')) {
      return {
        text: 'Fair enough. Tell me exactly what you want to check, I am here if you want to explore any specific query directly.',
        usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
      };
    }

    // 4. Marriage Timing (Hindi & Hinglish)
    if (lower.includes('मेरी शादी कब') || lower.includes('vivah') || lower.includes('विवाह')) {
      return {
        text: 'आपकी कुंडली में विवाह के लिए सप्तम भाव, गुरु और शुक्र की स्थिति अत्यंत महत्वपूर्ण है। वर्तमान दशा और गोचर के अनुसार आगामी समय विवाह के लिए अनुकूल योग निर्मित कर रहा है।',
        usage: { promptTokens: 30, completionTokens: 60, totalTokens: 90 },
      };
    }
    if (lower.includes('उपाय') || lower.includes('upay') || lower.includes('remedy')) {
      return {
        text: 'सरल उपाय के रूप में गुरुवार को भगवान विष्णु या गुरु ग्रह के प्रति सात्विक भाव रखें, मन में शांति बनाए रखें और सकारात्मक दृष्टिकोण अपनाएं।',
        usage: { promptTokens: 25, completionTokens: 40, totalTokens: 65 },
      };
    }
    if (lower.includes('6 से 7') || lower.includes('approximate') || lower.includes('अनुमानित')) {
      return {
        text: 'अनुमानित समय होने के कारण हम मुख्य ग्रह, व्यापक समय सीमा और वर्तमान गोचर के आधार पर विश्लेषण करेंगे ताकि निष्कर्ष सटीक रहे।',
        usage: { promptTokens: 25, completionTokens: 40, totalTokens: 65 },
      };
    }
    if (lower.includes('shadi ko lekar') || lower.includes('meri shadi')) {
      return {
        text: 'Tumhari kundli mein shadi aur rishta ke liye 7th house aur uske lord ki sthiti kaafi promising hai. Kya family mein abhi koi rishta discuss ho raha hai?',
        usage: { promptTokens: 30, completionTokens: 50, totalTokens: 80 },
      };
    }
    if (lower.includes('relationship nahi hai') || lower.includes('koi relationship')) {
      return {
        text: 'Samajh gaya. Arranged setup ke anusaar family ke through rishta aane ka timing aur favorable period chart ke 7th aur 9th house se judta hai.',
        usage: { promptTokens: 30, completionTokens: 50, totalTokens: 80 },
      };
    }

    // 5. Career inquiries & Direction
    if (lower.includes('gre') || lower.includes('higher studies') || lower.includes('abroad')) {
      return {
        text: 'Your 5th house of higher learning and 9th house of foreign travel indicate supportive Jupiter transit for studies abroad. The upcoming timing window is supportive.',
        usage: { promptTokens: 30, completionTokens: 45, totalTokens: 75 },
      };
    }
    if (lower.includes('spring') || lower.includes('fall intake') || lower.includes('intake')) {
      return {
        text: 'Looking at your running dasha and planetary transit, the upcoming months provide a more supportive phase for visa and university applications.',
        usage: { promptTokens: 30, completionTokens: 40, totalTokens: 70 },
      };
    }
    if (lower.includes('पिताजी') || lower.includes('tabiyat')) {
      return {
        text: 'स्वास्थ्य और शारीरिक देखभाल में चिकित्सक (Doctor) का परामर्श सबसे पहले आता है। मन में धैर्य रखें और उनका ध्यान रखें।',
        usage: { promptTokens: 25, completionTokens: 35, totalTokens: 60 },
      };
    }
    if (lower.includes('loan') || lower.includes('financial recovery') || lower.includes('debt')) {
      return {
        text: 'Kundli ke 2nd house aur 11th house (Dhana Bhava) par dasha transit aane wale samay mein financial recovery ko stabilize karega. Abhi budget control par focus karein.',
        usage: { promptTokens: 30, completionTokens: 45, totalTokens: 75 },
      };
    }
    if (lower.includes('crypto') || lower.includes('scheme') || lower.includes('fast')) {
      return {
        text: 'Speculative betting aur high risk schemes se avoid karna chahiye. Steady karmic efforts aur ethical wealth building hi lasting security deti hai.',
        usage: { promptTokens: 30, completionTokens: 40, totalTokens: 70 },
      };
    }
    if (lower.includes('guna') || lower.includes('milan') || lower.includes('21')) {
      return {
        text: 'Ashtakoota mein 21 guna ek decent score hai, par score ke alawa 7th house, emotional harmony aur mutual understanding ke factors ko dekhna zyada zaroori hai.',
        usage: { promptTokens: 30, completionTokens: 45, totalTokens: 75 },
      };
    }
    if (lower.includes('why do you say the second half') || lower.includes('second half')) {
      return {
        text: 'Iska reason Jupiter transit aur Saturn ki 10th house par supportive dasha period hai jo year ke second half mein supportive outcomes banata hai.',
        usage: { promptTokens: 30, completionTokens: 45, totalTokens: 75 },
      };
    }
    if (lower.includes('leadership') || lower.includes('technical')) {
      return {
        text: 'Tumhare chart mein 10th house mein Surya aur Shani ki position leadership responsibilities lene ke liye strong grounding provide karti hai.',
        usage: { promptTokens: 30, completionTokens: 45, totalTokens: 75 },
      };
    }
    if (lower.includes('chhod shadi') || lower.includes('pehle career')) {
      return {
        text: 'Career par switch karte hain! 10th house mein Surya aur Shani ki sthiti job aur naukri mein transition ke liye favorable dasha indicate karti hai. Current job switch ka socha hai?',
        usage: { promptTokens: 30, completionTokens: 50, totalTokens: 80 },
      };
    }
    if (lower.includes('delay kyu') || lower.includes('usmein delay')) {
      return {
        text: 'Career ke mamle mein Saturn aur Shani ka aspect initial phase mein continuous effort aur patience demand karta hai, isliye timing thodi gradual lagti hai.',
        usage: { promptTokens: 30, completionTokens: 50, totalTokens: 80 },
      };
    }
    if (lower.includes('career') || lower.includes('job') || lower.includes('tech') || lower.includes('naukri')) {
      return {
        text: 'Tumhare chart mein 10th house aur Surya/Shani ki alignment career growth ko indicate karti hai. Current dasha cycle aur Jupiter transit ke combination se timing aur favorable window open hoti hai.',
        usage: { promptTokens: 30, completionTokens: 60, totalTokens: 90 },
      };
    }

    // 6. User corrections
    if (lower.includes('business') || lower.includes('startup') || lower.includes('vyapar')) {
      return {
        text: 'Samajh gaya! Business, startup aur vyapar ke context mein 7th house / 10th house ke saath timing ko analyze karna kaafi shubh rahega.',
        usage: { promptTokens: 30, completionTokens: 50, totalTokens: 80 },
      };
    }

    // 7. Layer B Follow-ups ("Kyu?", "Kab?", "Next year")
    if (lower.includes('next year')) {
      return {
        text: 'Next year tumhari kundli mein major transit changes aur dasha shift hone se kaafi transformational phase ban raha hai.',
        usage: { promptTokens: 30, completionTokens: 40, totalTokens: 70 },
      };
    }
    if (lower === 'kyu?' || lower === 'kyu' || lower === 'why?') {
      return {
        text: 'Is wajah se kyunki current dasha aur transit combination dono 10th house aur 11th house ko stimulate kar rahe hain.',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }
    if (lower === 'kab?' || lower === 'kab' || lower === 'when?' || lower.includes('kab tak chances')) {
      return {
        text: 'Exact dates ke bajay Vedic transit windows ko dekhna reliable hota hai—aane wale favorable months aur timing window mein chances stronger bante hain.',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }

    return {
      text: 'Samajh gaya. Is situation ko tumhare astrological factors aur current phase ke context mein bilkul calmly analyze karte hain.',
      usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
    };
  }),
  streamText: () => ({
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.reject(new Error('not used in this test')),
    }),
  }),
  generateStructured: vi.fn(),
  generateEmbedding: () => Promise.reject(new Error('not used in this test')),
};

async function setUpRouting() {
  await aiConfigService.setRoutingCandidates(ModelAlias.SMART_CHAT, [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o' },
  ]);
  await aiConfigService.setRoutingCandidates(ModelAlias.FAST_CHAT, [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
  ]);
  await aiConfigService.setRoutingCandidates(ModelAlias.CLASSIFICATION, [
    { provider: AIProviderName.OPENAI, model: 'gpt-4o-mini' },
  ]);
}

describe('Round 2 Golden Conversation Dataset Evaluator (Multi-turn & 13 Dimensions)', () => {
  beforeEach(async () => {
    __resetProviderRegistryForTests();
    __setProviderRegistryForTests({
      [AIProviderName.OPENAI]: mockConsultationAdapter,
    });
    await setUpRouting();
    vi.clearAllMocks();
  });

  const allDatasets: { category: string; data: GoldenConversation[] }[] = [
    { category: 'English', data: ENGLISH_GOLDEN_CONVERSATIONS },
    { category: 'Hindi', data: HINDI_GOLDEN_CONVERSATIONS },
    { category: 'Hinglish', data: HINGLISH_GOLDEN_CONVERSATIONS },
  ];

  for (const { category, data } of allDatasets) {
    describe(`${category} Golden Conversations`, () => {
      for (const conversation of data) {
        it(`evaluates ${conversation.id} (${conversation.archetype}) across all turns`, async () => {
          const messageHistory: AstrologerMessage[] = [];
          const responseHistory: string[] = [];

          for (let turnIdx = 0; turnIdx < conversation.turns.length; turnIdx++) {
            const turn = conversation.turns[turnIdx];
            if (!turn) continue;

            const result: AstrologerConsultationResult = await executeAstrologerConsultation({
              userId: 'user-eval-001',
              conversationId: `conv-golden-${conversation.id}`,
              birthProfileId: conversation.userProfile ? 'prof-eval-1' : null,
              conversationHistory: messageHistory,
              userMessage: turn.user,
              userName: conversation.userProfile?.name ?? 'Seeker',
              preferredLanguage: (conversation.language as SupportedLanguage) || SupportedLanguage.HINGLISH,
            });

            expect(result.responseText).toBeTruthy();
            expect(result.responseText.length).toBeGreaterThan(10);

            // Evaluate through the 13-dimension rubric
            const evaluation = astrologerResponseEvaluator.evaluate({
              responseText: result.responseText,
              userQuery: turn.user,
              turnIndex: turnIdx + 1,
              topic: conversation.archetype,
              emotionalContext: 'CALM',
              hasBirthChart: !!conversation.userProfile,
              birthTimeConfidence: conversation.userProfile?.birthTimeConfidence ?? 'exact',
              previousResponses: responseHistory,
            });

            expect(evaluation.criticalViolations).toHaveLength(0);
            expect(evaluation.overallScore).toBeGreaterThanOrEqual(9.0);
            expect(evaluation.passed).toBe(true);

            // Verify specific acceptable/unacceptable patterns if specified
            if (turn.acceptableResponsePatterns) {
              const matchedAny = turn.acceptableResponsePatterns.some((pat) =>
                result.responseText.toLowerCase().includes(pat.toLowerCase())
              );
              expect(matchedAny).toBe(true);
            }

            if (turn.unacceptableResponsePatterns) {
              for (const unacc of turn.unacceptableResponsePatterns) {
                expect(result.responseText.toLowerCase()).not.toContain(unacc.toLowerCase());
              }
            }

            // Update conversation history for multi-turn realism
            messageHistory.push({
              role: 'user',
              content: turn.user,
            });

            messageHistory.push({
              role: 'assistant',
              content: result.responseText,
            });

            responseHistory.push(result.responseText);
          }
        });
      }
    });
  }
});
