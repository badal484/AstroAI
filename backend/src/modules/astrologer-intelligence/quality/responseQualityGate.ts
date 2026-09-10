/**
 * Response Quality Gate (Round 3 Master Astrologer Quality Filter)
 * Inspects and automatically harmonizes the final generated response text before dispatch.
 */

export interface QualityGateResult {
  passed: boolean;
  healedText: string;
  flags: string[];
}

export interface QualityGateInput {
  text: string;
  userMessage: string;
  turnIndex: number;
  isAstrologyExpected: boolean;
  hasEmotionalDistress?: boolean;
}

const TEMPLATE_OPENINGS_TO_PRUNE = [
  /^(based on your birth chart,?\s*|according to your planetary alignment,?\s*|your chart indicates that\s*|looking at your astrological chart,?\s*)/i,
  /^(as an ai language model,?\s*|as an ai astrologer,?\s*)/i,
  /^(certainly!|absolutely!|great question!|i understand your concern\.?\s*)/i,
];

const EMPTY_PLATITUDES_TO_PRUNE = [
  /\b(everything happens for a reason\.?|trust the universe\.?|your journey is unique\.?|stay positive\.?|good things are coming\.?)\b/gi,
  /\b(cosmic energies are aligning for you\.?|the universe is sending you signals\.?)\b/gi,
];

const UNREQUESTED_GENERIC_REMEDY_SUFFIX = [
  /\b(Vedic Remedy:\s*Chant [a-z]+ mantra 108 times daily\.?)/gi,
  /\b(Please perform this expensive pooja to remove all obstacles\.?)/gi,
];

export const responseQualityGate = {
  inspectAndHeal(input: QualityGateInput): QualityGateResult {
    let healed = input.text.trim();
    const flags: string[] = [];

    // 1. Prune AI Boilerplate and Robotic Openings
    for (const pattern of TEMPLATE_OPENINGS_TO_PRUNE) {
      if (pattern.test(healed)) {
        flags.push('AI_TEMPLATE_OPENING_REMOVED');
        healed = healed.replace(pattern, '');
        // Capitalize first character of remaining text if needed
        if (healed.length > 0) {
          healed = healed.charAt(0).toUpperCase() + healed.slice(1);
        }
      }
    }

    // 2. Prune Fake Wisdom Platitudes
    for (const pattern of EMPTY_PLATITUDES_TO_PRUNE) {
      if (pattern.test(healed)) {
        flags.push('FAKE_WISDOM_PRUNED');
        healed = healed.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
      }
    }

    // 3. Strip Unsolicited Generic Remedy Suffixes if user didn't ask for remedy
    const queryAskedRemedy = /upay|remedy|totka|anushthan|nivaran|उपाय/i.test(input.userMessage);
    if (!queryAskedRemedy) {
      for (const pattern of UNREQUESTED_GENERIC_REMEDY_SUFFIX) {
        if (pattern.test(healed)) {
          flags.push('UNSOLICITED_REMEDY_STRIPPED');
          healed = healed.replace(pattern, '').trim();
        }
      }
    }

    // 4. Strip Robotic Markdown Section Headers in conversational dialogue
    healed = healed
      .replace(/\*\*(Relationship Dynamics|Marriage Alignment|Career Outlook|Vedic Remedy|Career Timing & Growth|Shadi ke Shubh Yog & Timing|Astrological Factors|Analysis|Interpretation|Conclusion):\*\*\s*/gi, '')
      .replace(/###\s*(Analysis|Remedy|Conclusion|Summary)\s*/gi, '')
      .trim();

    // 5. Ensure ongoing turns (turnIndex > 0) don't start with repeated greetings
    if (input.turnIndex > 0) {
      healed = healed.replace(/^(pranam|namaste|pranaam|namaskar)[,.\s!—\-]*/i, '').trim();
      if (healed.length > 0) {
        healed = healed.charAt(0).toUpperCase() + healed.slice(1);
      }
    }

    // 6. Ensure strict zero-emoji adherence
    healed = healed.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE0F}]/gu, '').trim();

    return {
      passed: flags.length === 0,
      healedText: healed,
      flags,
    };
  },
};
