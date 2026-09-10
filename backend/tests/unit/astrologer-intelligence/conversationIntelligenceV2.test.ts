import { describe, it, expect } from 'vitest';
import {
  messageNormalizer,
  conversationStateManager,
  messageRelationEngine,
  contextualClarificationEngine,
  responseRepetitionGuard,
  genericResponseDetector,
  intentEngine,
  CoreIntent,
  fallbackGenerator,
  contextBuilder,
  EmotionalState,
  type AstrologyRelevance,
} from '../../../src/modules/astrologer-intelligence';

describe('Conversation Intelligence V2 - Multi-Turn Hinglish & Contextual Repair', () => {
  describe('1. Message Normalizer (Hinglish, Typos & Concatenations)', () => {
    it('normalizes concatenated words like "Roadnky" and "roadnkyu"', () => {
      const res1 = messageNormalizer.normalize('Roadnky kharab hai');
      expect(res1.normalized).toContain('road kyu kharab hai');

      const res2 = messageNormalizer.normalize('roadnkyu gir gaya');
      expect(res2.normalized).toContain('road kyu gir gaya');
    });

    it('normalizes missing spaces and typos like "merishadi", "jobkab", "shadikab"', () => {
      const res1 = messageNormalizer.normalize('merishadi kab hogi');
      expect(res1.normalized).toBe('meri shadi kab hogi');

      const res2 = messageNormalizer.normalize('jobkab lagegi');
      expect(res2.normalized).toBe('job kab lagegi');
    });

    it('normalizes common Hinglish abbreviations: q/kyo/kyon -> kyu, nhi -> nahi, h -> hai, rha -> raha', () => {
      const res = messageNormalizer.normalize('q bhai kya scene h usne reply nhi kiya samajh nhi aa rha');
      expect(res.normalized).toBe('kyu bhai kya scene hai usne reply nahi kiya samajh nahi aa raha');
      expect(res.detectedLanguage).toBe('hinglish');
    });

    it('collapses repeated characters like "dhaaaadak", "soooch", "kbbbb"', () => {
      const res = messageNormalizer.normalize('dil dhaaaadakne laga aur kbbbb hogi shadi');
      expect(res.normalized).toContain('dil dhadakne laga');
      expect(res.normalized).toContain('kab hogi shadi');
    });
  });

  describe('2. Message Relation Engine & Multi-Turn Context', () => {
    it('correctly classifies initial greeting as NEW_TOPIC', () => {
      const norm = messageNormalizer.normalize('Hello');
      const state = conversationStateManager.deriveState([]);
      const relation = messageRelationEngine.classify(norm, state);
      expect(relation.relation).toBe('NEW_TOPIC');
    });

    it('understands "Nahi" or "Haan" as ANSWER_TO_PREVIOUS_QUESTION when assistant asked a question', () => {
      const norm = messageNormalizer.normalize('Nahi');
      const state = conversationStateManager.deriveState([
        { role: 'user', content: 'Dil bechain h' },
        {
          role: 'assistant',
          content: 'Dil kis wajah se dhadakne laga? Kisi special person ki wajah se ya aaj kuch unexpected hua?',
        },
      ]);
      expect(state.awaitingAnswer).toBe(true);
      const relation = messageRelationEngine.classify(norm, state);
      expect(relation.relation).toBe('ANSWER_TO_PREVIOUS_QUESTION');
    });

    it('understands "Daru ka mann h" as emotional context answering assistant question', () => {
      const norm = messageNormalizer.normalize('Daru ka mann h');
      const state = conversationStateManager.deriveState([
        { role: 'user', content: 'Dil bechain h' },
        {
          role: 'assistant',
          content: 'Dil kis wajah se dhadakne laga? Kisi special person ki wajah se ya aaj kuch unexpected hua?',
        },
      ]);
      const relation = messageRelationEngine.classify(norm, state);
      expect(relation.relation).toBe('ANSWER_TO_PREVIOUS_QUESTION');
    });

    it('recognizes explicit topic switches like "Waise career ka kya scene hai"', () => {
      const norm = messageNormalizer.normalize('Waise career ka kya scene hai');
      const state = conversationStateManager.deriveState([
        { role: 'user', content: 'Meri shaadi kab hogi' },
        { role: 'assistant', content: '2026-2027 me shadi ke anukool yog ban rahe hain.' },
      ]);
      const relation = messageRelationEngine.classify(norm, state);
      expect(relation.relation).toBe('TOPIC_CHANGE');
    });

    it('recognizes follow-up questions like "last time tumne kya bola tha"', () => {
      const norm = messageNormalizer.normalize('last time tumne kya bola tha');
      const state = conversationStateManager.deriveState([
        { role: 'user', content: 'Meri shaadi kab hogi' },
        { role: 'assistant', content: '2026 me shadi ke yog hain.' },
      ]);
      const relation = messageRelationEngine.classify(norm, state);
      expect(relation.relation).toBe('FOLLOW_UP');
    });
  });

  describe('3. Physical Incident vs Astrology Disambiguation', () => {
    it('classifies "road mein kyu gir gaya" as PHYSICAL_INCIDENT with NOT_RELEVANT astrology', () => {
      const detected = intentEngine.detectIntents('Road mein kyu gir gaya');
      expect(detected.primary).toBe(CoreIntent.PHYSICAL_INCIDENT);
      expect(detected.astrologyRelevance).toBe('NOT_RELEVANT');
      expect(detected.isAstrologySpecific).toBe(false);
    });

    it('classifies "roadnky kharab hai" as PHYSICAL_INCIDENT / incident query with NOT_RELEVANT astrology', () => {
      const detected = intentEngine.detectIntents('Roadnky kharab hai');
      expect(detected.primary).toBe(CoreIntent.PHYSICAL_INCIDENT);
      expect(detected.astrologyRelevance).toBe('NOT_RELEVANT');
    });

    it('generates practical empathetic injury inquiry for falling on the road', () => {
      const norm = messageNormalizer.normalize('Road mein kyu gir gaya');
      const state = conversationStateManager.deriveState([]);
      const clarification = contextualClarificationEngine.generateClarification(norm, state);
      expect(clarification.responseMode).toBe('PRACTICAL_CONVERSATION');
      expect(clarification.question.toLowerCase()).toContain('chot');
    });

    it('generates empathetic response for road condition inquiry ("roadnky kharab hai")', () => {
      const norm = messageNormalizer.normalize('Roadnky kharab hai');
      const state = conversationStateManager.deriveState([]);
      const clarification = contextualClarificationEngine.generateClarification(norm, state);
      expect(clarification.responseMode).toBe('PRACTICAL_CONVERSATION');
      expect(clarification.question.toLowerCase()).toContain('chot');
    });
  });

  describe('4. Response Repetition & Genericity Guard', () => {
    it('detects duplicate responses across turns when user message changes', () => {
      const prevResponses = [
        'Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?',
      ];
      const check = responseRepetitionGuard.check(
        'Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?',
        prevResponses,
        true,
      );
      expect(check.isDuplicate).toBe(true);
      expect(check.maxSimilarity).toBe(1.0);
    });

    it('flags forbidden generic templates on non-starter messages', () => {
      const check = genericResponseDetector.detect(
        'Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?',
        'Road mein kyu gir gaya',
      );
      expect(check.isGeneric).toBe(true);
      expect(check.recommendation).toBe('REPLACE_WITH_CONTEXTUAL');
    });
  });

  describe('5. Fallback Responses for All Required Test Dataset Cases', () => {
    const defaultAstrology = contextBuilder.buildMockContext('GENERAL', { available: false });

    const makeInput = (msg: string, intent: CoreIntent, action: any) => ({
      intents: {
        primary: intent,
        secondary: [],
        isAstrologySpecific: false,
        astrologyRelevance: 'NOT_RELEVANT' as AstrologyRelevance,
        requiresClarification: false,
        confidence: 0.95,
      },
      emotion: { state: EmotionalState.NEUTRAL, intensity: 'LOW' as const, requiresEmpathyFirst: false },
      strategy: {
        action,
        depth: 'QUICK' as const,
        leadWithEmpathy: false,
        askClarification: false,
        suggestedFollowUpTopics: [],
      },
      astrology: defaultAstrology,
      language: 'hinglish',
      userMessage: msg,
    });

    it('Case: "Hello" -> Warm intake without DOB/Time/Place demands', () => {
      const res = fallbackGenerator.generate(
        makeInput('Hello', CoreIntent.GREETING_INTAKE, 'GREET_AND_DISCOVER'),
      );
      expect(res).toContain('Namaste');
      expect(res).not.toContain('Date of Birth');
    });

    it('Case: "Dil bechain h" -> Empathetic emotional check without astrology', () => {
      const res = fallbackGenerator.generate(
        makeInput('Dil bechain h', CoreIntent.AMBIGUOUS_EMOTION, 'HANDLE_AMBIGUITY'),
      );
      expect(res).toContain('Kuch hua hai kya');
      expect(res).not.toContain('Jupiter');
      expect(res).not.toContain('kundli');
    });

    it('Case: "Daru ka mann h" -> Conversational chill/stress inquiry without astrology', () => {
      const res = fallbackGenerator.generate(
        makeInput('Daru ka mann h', CoreIntent.AMBIGUOUS_EMOTION, 'HANDLE_AMBIGUITY'),
      );
      expect(res).toContain('stress ya thakan');
      expect(res).not.toContain('graha');
    });

    it('Case: "Road mein kyu gir gaya" -> Practical care about injury', () => {
      const res = fallbackGenerator.generate(
        makeInput('Road mein kyu gir gaya', CoreIntent.PHYSICAL_INCIDENT, 'DIRECT_ANSWER'),
      );
      expect(res.toLowerCase()).toContain('chot');
      expect(res).not.toContain('planetary cycle');
    });

    it('Case: "Roadnky kharab hai" -> Road slip and injury check', () => {
      const res = fallbackGenerator.generate(
        makeInput('Roadnky kharab hai', CoreIntent.PHYSICAL_INCIDENT, 'DIRECT_ANSWER'),
      );
      expect(res.toLowerCase()).toContain('road kharab');
      expect(res.toLowerCase()).toContain('chot');
    });

    it('Case: "Abhi sex chahiye" / "Sex karna h" -> Dignified Vedic boundary in Hinglish without generic English fallback', () => {
      const detected1 = intentEngine.detectIntents('Abhi sex chahiye');
      expect(detected1.primary).toBe(CoreIntent.INAPPROPRIATE_OR_SEXUAL);
      expect(detected1.astrologyRelevance).toBe('NOT_RELEVANT');

      const res1 = fallbackGenerator.generate(
        makeInput('Abhi sex chahiye', CoreIntent.INAPPROPRIATE_OR_SEXUAL, 'SAFETY_GUARD'),
      );
      expect(res1).toContain('Vedic Jyotish');
      expect(res1).toContain('pavitra');
      expect(res1).not.toContain('Tell me what');
      expect(res1).not.toContain('kya chal raha hai aapke mann mein');

      const detected2 = intentEngine.detectIntents('Sex karna h');
      expect(detected2.primary).toBe(CoreIntent.INAPPROPRIATE_OR_SEXUAL);

      const res2 = fallbackGenerator.generate(
        makeInput('Sex karna h', CoreIntent.INAPPROPRIATE_OR_SEXUAL, 'SAFETY_GUARD'),
      );
      expect(res2).toContain('Vedic Jyotish');
    });

    it('Case: "Mera kaun sa college mein admission hoga" -> Recognizes EDUCATION_HIGHER_STUDIES and asks for birth details & field context (No generic fallback)', () => {
      const detected = intentEngine.detectIntents('Mera kaun sa college mein admission hoga');
      expect(detected.primary).toBe(CoreIntent.EDUCATION_HIGHER_STUDIES);
      expect(detected.astrologyRelevance).toBe('REQUIRED');

      const res = fallbackGenerator.generate(
        makeInput('Mera kaun sa college mein admission hoga', CoreIntent.EDUCATION_HIGHER_STUDIES, 'CHART_READING_WITH_FOLLOWUP'),
      );
      expect(res.toLowerCase()).toContain('college');
      expect(res.toLowerCase()).toContain('date of birth');
      expect(res.toLowerCase()).toContain('4th house');
      expect(res).not.toContain('Aapki situation samajhne ke liye thoda aur batayein');
      expect(res).not.toContain('Tell me what');
    });

    it('Case: "Ghar wale nahi maan rahe" -> Recognizes FAMILY_MATTERS and addresses family/marriage context', () => {
      const detected = intentEngine.detectIntents('Ghar wale nahi maan rahe');
      expect(detected.primary).toBe(CoreIntent.FAMILY_MATTERS);

      const res = fallbackGenerator.generate(
        makeInput('Ghar wale nahi maan rahe', CoreIntent.FAMILY_MATTERS, 'DIRECT_ANSWER'),
      );
      expect(res.toLowerCase()).toContain('ghar walon');
      expect(res.toLowerCase()).toContain('4th aur 9th house');
    });

    it('Case: "Foreign settlement kab hoga" -> Recognizes FOREIGN_TRAVEL_SETTLEMENT and 9th/12th house', () => {
      const detected = intentEngine.detectIntents('Foreign settlement kab hoga');
      expect(detected.primary).toBe(CoreIntent.FOREIGN_TRAVEL_SETTLEMENT);

      const res = fallbackGenerator.generate(
        makeInput('Foreign settlement kab hoga', CoreIntent.FOREIGN_TRAVEL_SETTLEMENT, 'CHART_READING_WITH_FOLLOWUP'),
      );
      expect(res.toLowerCase()).toContain('videsh');
      expect(res.toLowerCase()).toContain('12th house');
    });
  });
});
