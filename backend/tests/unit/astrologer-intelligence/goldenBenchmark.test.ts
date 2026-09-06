import { describe, it, expect } from 'vitest';
import { FactPrecision } from '@astroai/shared-types';
import { intentEngine } from '../../../src/modules/astrologer-intelligence/intent/intentEngine';
import { CoreIntent } from '../../../src/modules/astrologer-intelligence/intent/intentTypes';
import { emotionDetector } from '../../../src/modules/astrologer-intelligence/emotion/emotionDetector';
import { contextBuilder } from '../../../src/modules/astrologer-intelligence/astrology-context/contextBuilder';
import { astrologyReasoningEngine } from '../../../src/modules/astrologer-intelligence/reasoning/astrologyReasoningEngine';
import { fallbackGenerator } from '../../../src/modules/astrologer-intelligence/quality/fallbackGenerator';
import { astrologerResponseEvaluator } from '../../../src/modules/astrologer-intelligence/quality/astrologerResponseEvaluator';
import { responseStrategyEngine } from '../../../src/modules/astrologer-intelligence/strategy/responseStrategyEngine';
import { ConsultationState } from '../../../src/modules/astrologer-intelligence/consultation/consultationStateTypes';

describe('Golden Conversation Benchmark Suite (Chatbot vs Astrologer)', () => {
  describe('1. Marriage Domain Golden Tests', () => {
    it('analyzes "Meri shaadi kab hogi?" with 7th house grounding and timing window', () => {
      const query = 'Meri shaadi kab hogi?';
      const intents = intentEngine.detectIntents(query);
      expect(intents.primary).toBe(CoreIntent.MARRIAGE_TIMING);

      const astrology = contextBuilder.buildMockContext('MARRIAGE', {
        birthProfileName: 'test-profile-1',
        timeConfidence: 'exact',
        currentDasha: { planet: 'Jupiter', antardasha: 'Venus', startDate: '2024-01-01', endDate: '2027-01-01' },
      });

      const reasoning = astrologyReasoningEngine.reason(astrology);
      expect(reasoning.primaryFactors.some((f: { factor: string }) => f.factor.includes('7th House') || f.factor.includes('Jupiter') || f.factor.includes('Venus'))).toBe(true);
      expect(reasoning.timingWindows.length).toBeGreaterThan(0);
      expect(reasoning.confidence).toBe('HIGH');
      expect(reasoning.interpretation?.overallSignal).toBe('positive');
    });

    it('analyzes "Love marriage ya arranged?" with 5th & 7th house cross-alignment', () => {
      const query = 'Love marriage ya arranged marriage hogi?';
      const intents = intentEngine.detectIntents(query);
      expect([CoreIntent.MARRIAGE_PROSPECTS, CoreIntent.LOVE_LIFE]).toContain(intents.primary);

      const astrology = contextBuilder.buildMockContext('MARRIAGE', {
        birthProfileName: 'test-profile-2',
        relevantHouses: [
          { number: 5, sign: 'Leo', precision: FactPrecision.RELIABLE },
          { number: 7, sign: 'Libra', precision: FactPrecision.RELIABLE }
        ]
      });

      const reasoning = astrologyReasoningEngine.reason(astrology);
      expect(reasoning.primaryFactors.some((f: { factor: string }) => f.factor.includes('5th House'))).toBe(true);
      expect(reasoning.primaryFactors.some((f: { factor: string }) => f.factor.includes('7th House'))).toBe(true);
    });
  });

  describe('2. Love & Relationship Distress Golden Tests', () => {
    it('handles "Meri girlfriend mujhse baat nahi kar rahi" with empathy-first and communication context', () => {
      const query = 'Meri girlfriend mujhse baat nahi kar rahi, bohot pareshan hoon';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);

      expect([
        CoreIntent.RELATIONSHIP_CONFLICT,
        CoreIntent.RELATIONSHIP_CURRENT_SITUATION,
      ]).toContain(intents.primary);
      expect(['FRUSTRATED', 'ANXIOUS', 'CONFUSED']).toContain(emotion.state);

      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.COLLECTING_CONTEXT,
        1,
        'hinglish'
      );

      expect(strategy.leadWithEmpathy).toBe(true);
      expect(strategy.askClarification).toBe(true);

      const fallback = fallbackGenerator.generate({
        intents,
        emotion,
        strategy,
        astrology: contextBuilder.buildMockContext('RELATIONSHIP', { birthProfileName: null, available: false }),
        language: 'hinglish',
        userMessage: query
      });

      // Astrologer should NOT blame planets fatalistically for girlfriend not talking
      expect(fallback).not.toContain('Rahu ki wajah se woh tumse baat nahi kar rahi');
      expect(fallback.toLowerCase()).toContain('samajh');

      const evaluation = astrologerResponseEvaluator.evaluate({
        responseText: fallback,
        userQuery: query,
        topic: 'RELATIONSHIP',
        emotionalContext: emotion.state,
        hasBirthChart: false,
        expectedLanguage: 'hinglish'
      });

      expect(evaluation.overallScore).toBeGreaterThanOrEqual(8.5);
    });
  });

  describe('3. Career & Job Change Golden Tests', () => {
    it('analyzes "Job change karna chahiye kya?" with 10th house, Dasha, and timing windows', () => {
      const query = 'Job change karna chahiye ya current job me rukun?';
      const intents = intentEngine.detectIntents(query);
      expect(intents.primary).toBe(CoreIntent.JOB_CHANGE);

      const astrology = contextBuilder.buildMockContext('CAREER', {
        birthProfileName: 'test-profile-3',
        timeConfidence: 'exact',
        currentDasha: { planet: 'Saturn', antardasha: 'Mercury', startDate: '2023-05-01', endDate: '2026-02-01' }
      });

      const reasoning = astrologyReasoningEngine.reason(astrology);
      expect(reasoning.primaryFactors.some((f: { factor: string }) => f.factor.includes('10th House') || f.factor.includes('Saturn'))).toBe(true);
      expect(reasoning.timingWindows.some((w: { planetaryIndicator: string }) => w.planetaryIndicator.includes('10th house') || w.planetaryIndicator.includes('Saturn') || w.planetaryIndicator.includes('Karma'))).toBe(true);
    });
  });

  describe('4. Financial Growth Golden Tests', () => {
    it('analyzes "Paise kab improve honge?" with 2nd and 11th house factors', () => {
      const query = 'Paise kab improve honge? Bohot financial stress hai';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);

      expect([CoreIntent.WEALTH_TIMING, CoreIntent.FINANCE_GENERAL]).toContain(intents.primary);
      expect(['ANXIOUS', 'FRUSTRATED']).toContain(emotion.state);

      const astrology = contextBuilder.buildMockContext('FINANCE', {
        birthProfileName: 'test-profile-4',
        relevantHouses: [
          { number: 2, sign: 'Taurus', precision: FactPrecision.RELIABLE },
          { number: 11, sign: 'Pisces', precision: FactPrecision.RELIABLE }
        ]
      });

      const reasoning = astrologyReasoningEngine.reason(astrology);
      expect(reasoning.primaryFactors.some((f: { factor: string }) => f.factor.includes('2nd House'))).toBe(true);
      expect(reasoning.primaryFactors.some((f: { factor: string }) => f.factor.includes('11th House'))).toBe(true);
    });
  });

  describe('5. Emotional & Existential Confusion Golden Tests', () => {
    it('handles "Mujhe samajh nahi aa raha kya karun" with profound calm and guidance', () => {
      const query = 'Mujhe kuch samajh nahi aa raha kya karun, life stuck lag rahi hai';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);

      expect(emotion.state).toBe('CONFUSED');

      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.COLLECTING_CONTEXT,
        0,
        'hinglish'
      );

      expect(strategy.leadWithEmpathy).toBe(true);
    });
  });

  describe('6. Anti-Genericness & Chatbot vs Astrologer Differentiation', () => {
    it('differentiates an Astrologer response from generic chatbot platitudes', () => {
      const genericChatbotResponse = 'Hello! Your future looks bright. There may be challenges but you will overcome them. The planets indicate positive changes.';
      const genuineAstrologerResponse = `प्रणाम! आपकी कुंडली में 10th house (कर्म भाव) का स्वामी शनि मजबूत स्थिति में है, जो यह दर्शाता है कि आपकी मेहनत व्यर्थ नहीं जाएगी।

वर्तमान में गुरु का गोचर आपके भाग्य भाव पर होने से अगले 4 से 6 महीनों में करियर में सकारात्मक बदलाव के अवसर बन रहे हैं। क्या आप अभी किसी विशिष्ट पद या कंपनी में बदलाव का प्रयास कर रहे हैं?`;

      const evalGeneric = astrologerResponseEvaluator.evaluate({
        responseText: genericChatbotResponse,
        userQuery: 'Career guidance',
        hasBirthChart: true
      });

      const evalAstrologer = astrologerResponseEvaluator.evaluate({
        responseText: genuineAstrologerResponse,
        userQuery: 'Career guidance',
        hasBirthChart: true,
        expectedLanguage: 'hi'
      });

      expect(evalGeneric.passed).toBe(false);
      expect(evalGeneric.dimensions.nonGenericness.score).toBeLessThanOrEqual(6.0);

      expect(evalAstrologer.passed).toBe(true);
      expect(evalAstrologer.overallScore).toBeGreaterThanOrEqual(8.5);
      expect(evalAstrologer.dimensions.chartGrounding.score).toBeGreaterThanOrEqual(9.0);
    });
  });
});
