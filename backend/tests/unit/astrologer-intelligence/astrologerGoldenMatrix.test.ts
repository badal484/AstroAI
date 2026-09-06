import { describe, it, expect } from 'vitest';
import { intentEngine } from '../../../src/modules/astrologer-intelligence/intent/intentEngine';
import { CoreIntent } from '../../../src/modules/astrologer-intelligence/intent/intentTypes';
import { emotionDetector } from '../../../src/modules/astrologer-intelligence/emotion/emotionDetector';
import { responseQualityValidator } from '../../../src/modules/astrologer-intelligence/quality/responseQualityValidator';
import { fallbackGenerator } from '../../../src/modules/astrologer-intelligence/quality/fallbackGenerator';
import { contextBuilder } from '../../../src/modules/astrologer-intelligence/astrology-context/contextBuilder';
import { responseStrategyEngine } from '../../../src/modules/astrologer-intelligence/strategy/responseStrategyEngine';
import { ConsultationState } from '../../../src/modules/astrologer-intelligence/consultation/consultationStateTypes';
import { TOPIC_MAPPINGS } from '../../../src/modules/astrologer-intelligence/astrology-context/topicMappings';
import { ResponseAction } from '../../../src/modules/astrologer-intelligence/strategy/strategyTypes';

describe('Astrologer Golden Matrix Benchmark Suite (PART 6 Specification)', () => {
  describe('1. Greeting & Intake Golden Tests', () => {
    const greetingQueries = [
      'Hello',
      'Hi',
      'Hey',
      'Good morning',
      'Namaste',
      'Pranam',
      'Radhe radhe',
      'नमस्ते',
      'प्रणाम',
    ];

    it.each(greetingQueries)('classifies pure greeting "%s" with NOT_RELEVANT astrology relevance', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect(intents.primary).toBe(CoreIntent.GREETING_INTAKE);
      expect(intents.astrologyRelevance).toBe('NOT_RELEVANT');
      expect(intents.isAstrologySpecific).toBe(false);
    });

    it('generates warm personal greeting without demanding Janam Kundli or birth details', () => {
      const query = 'Hello';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);
      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.UNDERSTANDING_CONCERN,
        0,
        'hinglish',
        query,
      );

      const mockContext = contextBuilder.buildMockContext('GENERAL', { available: false });
      const response = fallbackGenerator.generate({
        intents,
        emotion,
        strategy,
        astrology: mockContext,
        language: 'hinglish',
        userMessage: query,
      });

      expect(response).toMatch(/Namaste|Acharya Vashishta/i);
      expect(response).not.toContain('Date of Birth');
      expect(response).not.toContain('Exact Time of Birth');
      expect(response).not.toContain('Place/City of Birth');
      expect(response).not.toMatch(/Jupiter|Saturn|7th house|10th house/i);
    });
  });

  describe('2. Ambiguous & Emotional Sensations ("Dil dhadkne laga")', () => {
    const ambiguousQueries = [
      'Dil dhadkne laga',
      'dil dhadak raha hai',
      'Main bahut confused hoon',
      'Mujhe samajh nahi aa raha',
      'Sab kharab ho raha hai',
      'दिल धड़कने लगा',
    ];

    it.each(ambiguousQueries)('classifies ambiguous query "%s" with AMBIGUOUS relevance', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect([
        CoreIntent.AMBIGUOUS_EMOTION,
        CoreIntent.CAREER_DECISION,
      ]).toContain(intents.primary);
      expect(intents.requiresClarification).toBe(true);
    });

    it('handles "Dil dhadkne laga" by clarifying special person vs physical sensation without jumping to astrology', () => {
      const query = 'Dil dhadkne laga';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);
      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.CLARIFYING,
        1,
        'hinglish',
        query,
      );

      expect(strategy.action).toBe(ResponseAction.HANDLE_AMBIGUITY);
      expect(strategy.askClarification).toBe(true);

      const mockContext = contextBuilder.buildMockContext('GENERAL', { available: true });
      const response = fallbackGenerator.generate({
        intents,
        emotion,
        strategy,
        astrology: mockContext,
        language: 'hinglish',
        userMessage: query,
      });

      expect(response.toLowerCase()).toMatch(/special person|heart racing|deep breath/);
      expect(response).not.toMatch(/Jupiter|Saturn|7th house|transit indicates/i);
    });

    it('handles casual lifestyle desires like "daru ka Mann h" with human empathy without dumping planetary transits or requesting birth details', () => {
      const query = 'daru ka Mann h';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);
      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.CLARIFYING,
        1,
        'hinglish',
        query,
      );

      expect(intents.astrologyRelevance).toBe('AMBIGUOUS');
      expect(strategy.action).toBe(ResponseAction.HANDLE_AMBIGUITY);
      expect(strategy.askClarification).toBe(true);

      const mockContext = contextBuilder.buildMockContext('GENERAL', { available: false });
      const response = fallbackGenerator.generate({
        intents,
        emotion,
        strategy,
        astrology: mockContext,
        language: 'hinglish',
        userMessage: query,
      });

      expect(response.toLowerCase()).toMatch(/stress|thakan|chill|dosto/);
      expect(response).not.toMatch(/Examining your current planetary cycle|Date of Birth|Exact Time/i);
    });
  });

  describe('3. Short Conversational Acknowledgments', () => {
    const shortQueries = [
      'Haan',
      'ha',
      'Achha',
      'achha ji',
      'Hmm',
      'hmmm',
      'theek hai',
      'ok',
      'हाँ',
      'अच्छा',
    ];

    it.each(shortQueries)('classifies short acknowledgment "%s" as SHORT_ACKNOWLEDGMENT with NOT_RELEVANT relevance', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect(intents.primary).toBe(CoreIntent.SHORT_ACKNOWLEDGMENT);
      expect(intents.astrologyRelevance).toBe('NOT_RELEVANT');
    });

    it('continues conversation naturally without restarting consultation or dumping horoscope', () => {
      const query = 'Haan';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);
      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.FOLLOW_UP,
        2,
        'hinglish',
        query,
      );

      expect(strategy.action).toBe(ResponseAction.ACKNOWLEDGE_SHORT);

      const mockContext = contextBuilder.buildMockContext('GENERAL', { available: true });
      const response = fallbackGenerator.generate({
        intents,
        emotion,
        strategy,
        astrology: mockContext,
        language: 'hinglish',
        userMessage: query,
      });

      expect(response).toMatch(/Haan, bilkul|aage batayein/i);
      expect(response).not.toContain('Date of Birth');
    });
  });

  describe('4. Marriage Domain Golden Tests', () => {
    const marriageQueries = [
      'Meri shadi kab hogi',
      'Kab hogi shadi',
      'meri shaadi ka yog kab hai',
      'meri shadi kis age me hogi',
      'love marriage hogi ya arranged',
      'Shaadi mein delay kyun hai?',
      'मेरी शादी कब होगी',
      'शादी का योग कब बन रहा है',
      'When will I get married?',
    ];

    it.each(marriageQueries)('correctly classifies marriage query: "%s"', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect([
        CoreIntent.MARRIAGE_TIMING,
        CoreIntent.MARRIAGE_PROSPECTS,
      ]).toContain(intents.primary);
      expect(intents.entities).toContain('DOMAIN_MARRIAGE');
      expect(intents.astrologyRelevance).toBe('REQUIRED');
    });

    it('retrieves strict 7th house and relationship factors without career leakage', () => {
      const factors = TOPIC_MAPPINGS.MARRIAGE!;
      expect(factors.primaryHouses).toContain(7);
      expect(factors.keyPlanets).toContain('Venus');
      expect(factors.keyPlanets).toContain('Jupiter');
      expect(factors.prohibitedDomains).toContain('career');
      expect(factors.primaryHouses).not.toContain(10);
    });

    it('rejects career advice generated for a marriage query', () => {
      const invalidResponse = 'Aane wale 6 mahino ke grah gochar ka vishleshan karein to yeh samay aapke liye naye avsar aur clarity lekar aayega. Jupiter (Guru) ka prabhav aapke decision-making aur career growth ko support karega.';
      const validation = responseQualityValidator.validate(invalidResponse, CoreIntent.MARRIAGE_TIMING);
      expect(validation.topicConsistent).toBe(false);
      expect(validation.violations).toContain('Marriage query answered with career/professional advice without marriage context');
    });

    it('produces natural Hinglish marriage guidance with 7th house and timing windows', () => {
      const query = 'Meri shadi kab hogi';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);
      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.ASTROLOGY_ANALYSIS,
        1,
        'hinglish',
        query,
      );

      const mockContext = contextBuilder.buildMockContext('MARRIAGE', {
        birthProfileName: 'TestUser',
        available: true,
      });

      const response = fallbackGenerator.generate({
        intents,
        emotion,
        strategy,
        astrology: mockContext,
        language: 'hinglish',
        userMessage: query,
      });

      expect(response.toLowerCase()).toMatch(/shadi|vivah|7th house|guru|shukra/);
      expect(response.toLowerCase()).not.toMatch(/career growth|professional clarity|nayi job/);
      const validation = responseQualityValidator.validate(response, intents.primary);
      expect(validation.topicConsistent).toBe(true);
    });
  });

  describe('5. Relationship Conflict & Today\'s Discord Golden Tests', () => {
    const conflictQueries = [
      'Meri gf mujhse baat nahi kar rahi',
      'meri girlfriend mujhse baat nahi kar rahi',
      'Humari ladai kyu hui',
      'Ladai kyu hua aaj',
      'Ladayi kyu hui aaj',
      'kya relationship chalega?',
      'आज लड़ाई क्यों हुई',
      'Why did we fight today?',
    ];

    it.each(conflictQueries)('correctly classifies relationship conflict query: "%s"', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect([
        CoreIntent.RELATIONSHIP_CONFLICT,
        CoreIntent.RELATIONSHIP_CURRENT_SITUATION,
        CoreIntent.BREAKUP,
        CoreIntent.LOVE_LIFE,
      ]).toContain(intents.primary);
      expect(intents.astrologyRelevance).toBe('USEFUL');
    });

    it('retrieves relationship discord factors (7th, Moon, Mars) without career leakage', () => {
      const factors = TOPIC_MAPPINGS.RELATIONSHIP_CONFLICT!;
      expect(factors.primaryHouses).toContain(7);
      expect(factors.keyPlanets).toContain('Moon');
      expect(factors.keyPlanets).toContain('Mars');
      expect(factors.prohibitedDomains).toContain('career');
    });

    it('rejects 6-month career forecast generated for "Ladai kyu hua aaj"', () => {
      const invalidResponse = 'Looking at the transit alignments over the next 6 months, Jupiter\'s movement activates supportive houses for professional clarity and personal evolution.';
      const validation = responseQualityValidator.validate(invalidResponse, CoreIntent.RELATIONSHIP_CONFLICT);
      expect(validation.topicConsistent).toBe(false);
      expect(validation.violations).toContain('Relationship conflict query answered with generic career forecast');
    });

    it('responds with empathy and context clarification for relationship conflict', () => {
      const query = 'Ladai kyu hua aaj';
      const intents = intentEngine.detectIntents(query);
      const emotion = emotionDetector.detectEmotion(query);
      const strategy = responseStrategyEngine.determineStrategy(
        intents,
        emotion,
        ConsultationState.COLLECTING_CONTEXT,
        1,
        'hinglish',
        query,
      );

      const mockContext = contextBuilder.buildMockContext('RELATIONSHIP_CONFLICT', {
        birthProfileName: 'TestUser',
        available: true,
      });

      const response = fallbackGenerator.generate({
        intents,
        emotion,
        strategy,
        astrology: mockContext,
        language: 'hinglish',
        userMessage: query,
      });

      expect(response.toLowerCase()).toMatch(/ladai|samajh|partner|baat|situation/);
      expect(response.toLowerCase()).not.toMatch(/career growth|professional clarity|nayi naukri/);
    });
  });

  describe('6. Career & Job Change Golden Tests', () => {
    const careerQueries = [
      'Mera career kaisa rahega?',
      'Job kab milegi?',
      'Job change karu?',
      'Business karna chahiye?',
      'नौकरी कब लगेगी?',
      'करियर में बदलाव करूं?',
    ];

    it.each(careerQueries)('correctly classifies career query: "%s"', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect([
        CoreIntent.CAREER_GENERAL,
        CoreIntent.CAREER_TIMING,
        CoreIntent.JOB_CHANGE,
        CoreIntent.BUSINESS_VENTURE,
      ]).toContain(intents.primary);
      expect(intents.entities).toContain('DOMAIN_CAREER');
    });

    it('retrieves 10th house, Sun, Saturn, and Karma bhava factors', () => {
      const factors = TOPIC_MAPPINGS.CAREER!;
      expect(factors.primaryHouses).toContain(10);
      expect(factors.keyPlanets).toContain('Sun');
      expect(factors.keyPlanets).toContain('Saturn');
      expect(factors.prohibitedDomains).toContain('marriage_delay');
    });

    it('rejects marriage advice generated for a career query', () => {
      const invalidResponse = 'Aapki kundli me vivah yog aur saptam bhav me shubh dristi ban rahi hai.';
      const validation = responseQualityValidator.validate(invalidResponse, CoreIntent.JOB_CHANGE);
      expect(validation.topicConsistent).toBe(false);
    });
  });

  describe('7. Financial Growth & Wealth Golden Tests', () => {
    const financeQueries = [
      'Paise kab improve honge?',
      'Business mein growth hogi?',
      'पैसे की स्थिति कब सुधरेगी?',
    ];

    it.each(financeQueries)('correctly classifies finance query: "%s"', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect([
        CoreIntent.WEALTH_TIMING,
        CoreIntent.FINANCE_GENERAL,
        CoreIntent.BUSINESS_VENTURE,
      ]).toContain(intents.primary);
    });

    it('retrieves 2nd and 11th houses with Jupiter and Mercury', () => {
      const factors = TOPIC_MAPPINGS.FINANCE!;
      expect(factors.primaryHouses).toContain(2);
      expect(factors.primaryHouses).toContain(11);
      expect(factors.keyPlanets).toContain('Jupiter');
      expect(factors.keyPlanets).toContain('Mercury');
    });
  });

  describe('8. General Guidance & Daily Horoscope Golden Tests', () => {
    const generalQueries = [
      'Aaj ka din kaisa rahega?',
      'Mere baare mein batao',
      'Meri kundli dekho',
      'आज का दिन कैसा रहेगा?',
    ];

    it.each(generalQueries)('correctly classifies general/today query: "%s"', (query) => {
      const intents = intentEngine.detectIntents(query);
      expect([
        CoreIntent.TODAY_GUIDANCE,
        CoreIntent.GENERAL_LIFE_READING,
      ]).toContain(intents.primary);
    });
  });
});
