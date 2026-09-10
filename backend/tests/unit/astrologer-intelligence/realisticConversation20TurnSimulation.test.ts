import { describe, it, expect } from 'vitest';
import { intentEngine } from '../../../src/modules/astrologer-intelligence/intent/intentEngine';
import { messageNormalizer } from '../../../src/modules/astrologer-intelligence/normalizer/messageNormalizer';
import { conversationStateManager } from '../../../src/modules/astrologer-intelligence/context/conversationStateManager';
import { messageRelationEngine } from '../../../src/modules/astrologer-intelligence/relation/messageRelationEngine';
import { responseStrategyEngine } from '../../../src/modules/astrologer-intelligence/strategy/responseStrategyEngine';
import { fallbackGenerator } from '../../../src/modules/astrologer-intelligence/quality/fallbackGenerator';
import { responseSelfHealer } from '../../../src/modules/astrologer-intelligence/quality/responseSelfHealer';
import { contextBuilder } from '../../../src/modules/astrologer-intelligence/astrology-context/contextBuilder';
import { emotionDetector } from '../../../src/modules/astrologer-intelligence/emotion/emotionDetector';
import type { AstrologerMessage } from '@astroai/shared-types';

describe('Phase 32 & 33 — 20-Turn Realistic Human Multi-Turn Simulation', () => {
  const mockAstrology = contextBuilder.buildMockContext('RELATIONSHIP_CONFLICT', {
    available: true,
    birthProfileName: 'TestUser',
  });

  const conversationHistory: AstrologerMessage[] = [];

  const simulateTurn = (userText: string, turnIndex: number) => {
    const norm = messageNormalizer.normalize(userText);
    const state = conversationStateManager.deriveState(conversationHistory, 'hinglish');
    const intents = intentEngine.detectIntents(userText);
    const emotion = emotionDetector.detect(userText);
    const relation = messageRelationEngine.classify(norm, state);
    const strategy = responseStrategyEngine.determineStrategy({
      intents,
      emotion,
      state,
      userMessage: userText,
      language: 'hinglish',
    });

    const rawResponse = fallbackGenerator.generate({
      intents,
      emotion,
      strategy,
      astrology: mockAstrology,
      language: 'hinglish',
      userMessage: userText,
    });

    const healedResponse = responseSelfHealer.heal(rawResponse, {
      turnIndex,
      userLanguage: 'hinglish',
      leadWithEmpathy: strategy.leadWithEmpathy,
      userMessage: userText,
    });

    // Record turn into history
    conversationHistory.push({
      role: 'user',
      content: userText,
    });

    conversationHistory.push({
      role: 'assistant',
      content: healedResponse,
    });

    return { intents, emotion, relation, strategy, healedResponse };
  };

  it('Turn 1: "Hello Acharya ji" -> Welcomes user without demanding birth details or horoscope dump', () => {
    const res = simulateTurn('Hello Acharya ji', 0);
    expect(res.healedResponse).toMatch(/Namaste/i);
    expect(res.healedResponse).not.toMatch(/Date of Birth|Janm Tithi/i);
  });

  it('Turn 2: "Mera mann thoda bechain hai" -> Validates emotion with empathy first, suppresses duplicate greeting', () => {
    const res = simulateTurn('Mera mann thoda bechain hai', 1);
    expect(res.healedResponse).toMatch(/Kuch hua hai kya|bechain/i);
    expect(res.healedResponse).not.toMatch(/Namaste|Pranam/i); // Turn > 0 greeting suppression
  });

  it('Turn 3: "Daru ka mann ho raha hai" -> Conversational decompression, STRICTLY NO ASTROLOGY', () => {
    const res = simulateTurn('Daru ka mann ho raha hai', 2);
    expect(res.healedResponse).toMatch(/stress ya thakan/i);
    expect(res.healedResponse).not.toMatch(/grah|kundli|rahu|ketu|shani/i);
  });

  it('Turn 4: "Bas office mein kafi pressure tha aaj" -> Empathetic listening to workplace pressure', () => {
    const res = simulateTurn('Bas office mein kafi pressure tha aaj', 3);
    expect(res.healedResponse).not.toMatch(/Namaste|Pranam/i);
  });

  it('Turn 5: "Meri girlfriend se bhi ladai ho gayi" -> Interpersonal empathy first before rushing to chart', () => {
    const res = simulateTurn('Meri girlfriend se bhi ladai ho gayi', 4);
    expect(res.healedResponse).toMatch(/Samajh sakta hoon|ladai|baat/i);
    expect(res.healedResponse).not.toMatch(/Rahu ki vajah se/i);
  });

  it('Turn 6: "Woh keh rahi hai ki uske ghar wale nahi maan rahe" -> Recognizes parental hesitation (4th/9th house insight)', () => {
    const res = simulateTurn('Woh keh rahi hai ki uske ghar wale nahi maan rahe', 5);
    expect(res.healedResponse).toMatch(/Ghar walon ki asahmati|4th.*9th house/i);
  });

  it('Turn 7: "Haan" -> Handles short affirmation without resetting topic or asking menu questions', () => {
    const res = simulateTurn('Haan', 6);
    expect(res.healedResponse).toMatch(/Theek hai|Samajh gaya/i);
    expect(res.healedResponse).not.toMatch(/personal life, career ya kuch aur/i);
  });

  it('Turn 8: "Kya hamari shaadi ho payegi?" -> Astrological marriage prospects guidance', () => {
    const res = simulateTurn('Kya hamari shaadi ho payegi?', 7);
    expect(res.healedResponse.length).toBeGreaterThan(15);
  });

  it('Turn 9: "Kab tak?" -> Interrogative follow-up connecting to previous marriage timing context', () => {
    const res = simulateTurn('Kab tak?', 8);
    expect(res.relation.relation).toBe('FOLLOW_UP_INTERROGATIVE');
  });

  it('Turn 10: "Job change bhi karu kya?" -> Career decision guidance', () => {
    const res = simulateTurn('Job change bhi karu kya?', 9);
    expect(res.healedResponse.length).toBeGreaterThan(15);
  });

  it('Turn 11: "Nahi" -> Negation handling without interrogation or restart', () => {
    const res = simulateTurn('Nahi', 10);
    expect(res.healedResponse).toMatch(/Theek hai, samajh gaya/i);
    expect(res.healedResponse).not.toMatch(/Toh phir bataiye/i);
  });

  it('Turn 12: "Bhook lagi hai" -> Practical human advice, STRICTLY NO ASTROLOGY', () => {
    const res = simulateTurn('Bhook lagi hai', 11);
    expect(res.healedResponse).toMatch(/kha lijiye|Sehat/i);
    expect(res.healedResponse).not.toMatch(/kundli|graha|lagna/i);
  });

  it('Turn 13: "Suno" -> Continuation prompt, active listener stance', () => {
    const res = simulateTurn('Suno', 12);
    expect(res.healedResponse).toMatch(/Haan, boliye|Main sun raha hoon/i);
  });

  it('Turn 14: "Phone toot gaya mera" -> Daily life inconvenience, STRICTLY NO ASTROLOGY', () => {
    const res = simulateTurn('Phone toot gaya mera', 13);
    expect(res.healedResponse).toMatch(/Phone toot|Screen/i);
    expect(res.healedResponse).not.toMatch(/Budh graha|retrograde/i);
  });

  it('Turn 15: "Road mein kyu gir gaya tha main" -> Physical injury care, STRICTLY NO ASTROLOGY', () => {
    const res = simulateTurn('Road mein kyu gir gaya tha main', 14);
    expect(res.healedResponse).toMatch(/chot/i);
    expect(res.healedResponse).not.toMatch(/planetary cycle|dasha transit/i);
  });

  it('Turn 16: "Nothing" -> Gentle conversational waiting room without pressure', () => {
    const res = simulateTurn('Nothing', 15);
    expect(res.healedResponse).toMatch(/Theek hai.*Jab mann ho.*seedha bata dena/i);
  });

  it('Turn 17: "Chhod yaar" -> Graceful minimal acceptance', () => {
    const res = simulateTurn('Chhod yaar', 16);
    expect(res.healedResponse).toMatch(/Theek hai\./i);
  });

  it('Turn 18: "Tu kya bakwas kar raha hai" -> Calm, mature de-escalation without robotic defensiveness', () => {
    const res = simulateTurn('Tu kya bakwas kar raha hai', 17);
    expect(res.healedResponse).toMatch(/Lagta hai aap irritate ho|seedha bataiye kya galat laga/i);
    expect(res.healedResponse).not.toMatch(/As an AI language model/i);
  });

  it('Turn 19: "Achha theek hai" -> Reconnects warmly', () => {
    const res = simulateTurn('Achha theek hai', 18);
    expect(res.healedResponse).toMatch(/Theek hai|Samajh gaya/i);
  });

  it('Turn 20: "Thank you Acharya ji" -> Gracious closing blessing', () => {
    const res = simulateTurn('Thank you Acharya ji', 19);
    expect(res.healedResponse).toMatch(/kalyan|shubh|theek|mann/i);
  });
});
