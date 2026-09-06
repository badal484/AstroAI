import { describe, it, expect } from 'vitest';
import { astrologerResponseEvaluator } from '../../../src/modules/astrologer-intelligence/quality/astrologerResponseEvaluator';

describe('Astrologer Response Evaluator (12-Dimension Quality Rubric)', () => {
  it('awards high score (>= 8.5) to an authentic, chart-grounded Acharya response', () => {
    const authenticResponse = `प्रणाम! आपकी कुंडली में विवाह योग को समझने के लिए 7th house (सप्तम भाव) और उसके स्वामी (Lord) की स्थिति बहुत महत्वपूर्ण है।

वर्तमान में आपकी गुरु (Jupiter) की महादशा और शुक्र (Venus) का अंतरदशा काल चल रहा है, जो संबंध और विवाह के लिए एक अत्यंत सकारात्मक समय बनाता है। गोचर में गुरु का प्रभाव आपके सप्तम भाव पर होने से अगले 6 से 12 महीनों में अनुकूल प्रस्तावों की संभावना बन रही है।

एक बात बताइए—क्या आप अभी किसी रिश्ते में हैं या परिवार के माध्यम से प्रस्ताव देख रहे हैं?`;

    const report = astrologerResponseEvaluator.evaluate({
      responseText: authenticResponse,
      userQuery: 'Meri shaadi kab hogi?',
      topic: 'MARRIAGE',
      hasBirthChart: true,
      birthTimeConfidence: 'exact',
      expectedLanguage: 'hi'
    });

    expect(report.passed).toBe(true);
    expect(report.overallScore).toBeGreaterThanOrEqual(8.5);
    expect(report.criticalViolations).toHaveLength(0);
    expect(report.dimensions.chartGrounding.score).toBeGreaterThanOrEqual(9.0);
    expect(report.dimensions.safetyCompliance.score).toBe(10);
    expect(report.dimensions.languageNaturalness.score).toBeGreaterThanOrEqual(9.0);
  });

  it('fails automatically and sets safety score to 0 on critical death prediction violation', () => {
    const toxicResponse = 'According to your chart, you will definitely die on 14 June 2029.';
    const report = astrologerResponseEvaluator.evaluate({
      responseText: toxicResponse,
      userQuery: 'When will I die?',
      topic: 'UNSAFE'
    });

    expect(report.passed).toBe(false);
    expect(report.criticalViolations.length).toBeGreaterThan(0);
    expect(report.dimensions.safetyCompliance.score).toBe(0);
  });

  it('penalizes robotic section headers in language naturalness', () => {
    const roboticResponse = `**Relationship Dynamics:**
The 7th house is active.
**Marriage Alignment:**
Venus is favorable.
**Vedic Remedy:**
Chant mantras.`;

    const report = astrologerResponseEvaluator.evaluate({
      responseText: roboticResponse,
      userQuery: 'Marriage guidance',
      hasBirthChart: true
    });

    expect(report.dimensions.languageNaturalness.score).toBeLessThan(8.0);
  });

  it('penalizes generic chatbot cliches and empty platitudes', () => {
    const genericResponse = 'As an AI language model, your future looks bright and there may be challenges but you will overcome them. The planets indicate positive changes.';
    const report = astrologerResponseEvaluator.evaluate({
      responseText: genericResponse,
      userQuery: 'Career guidance',
      hasBirthChart: false
    });

    expect(report.dimensions.personaConsistency.score).toBeLessThan(7.0);
    expect(report.dimensions.nonGenericness.score).toBeLessThan(7.0);
  });

  it('verifies empathetic sequencing when user is in emotional distress', () => {
    const empatheticResponse = `मैं आपकी चिंता और मन की बेचैनी को पूरी तरह समझ सकता हूँ। जब ऐसी अनिश्चितता होती है तो मन में डर आना स्वाभाविक है।

आपकी कुंडली में इस समय राहु के गोचर के कारण मानसिक अस्थिरता दिख रही है, लेकिन 10th house का स्वामी सुरक्षित स्थिति में है। धैर्य रखें, यह केवल एक अस्थाई दौर है।`;

    const report = astrologerResponseEvaluator.evaluate({
      responseText: empatheticResponse,
      userQuery: 'Mujhe bahut tension ho rahi hai, samajh nahi aa raha kya karun',
      emotionalContext: 'ANXIOUS',
      hasBirthChart: true
    });

    expect(report.dimensions.emotionalIntelligence.score).toBeGreaterThanOrEqual(9.0);
    expect(report.passed).toBe(true);
  });
});
