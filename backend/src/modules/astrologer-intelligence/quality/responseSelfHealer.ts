/**
 * Response Self-Healer
 * Automatically polishes, sanitizes, and harmonizes AI-generated astrologer responses
 * to ensure 100% human-level naturalness before reaching the user.
 */

const FORBIDDEN_PREAMBLES: RegExp[] = [
  /^(based on (your |the )?(birth |planetary )*(chart|transits?|planetary cycle|cycle|horoscope|information provided)[,:\s-]*)/i,
  /^(looking at (your |the )?(current |planetary |birth )*(chart|transits?|dasha|cycle|planetary cycle|period)[,:\s-]*)/i,
  /^(according to (your |the )?(birth |planetary )*(chart|transits?|kundli|planetary cycle|cycle)[,:\s-]*)/i,
  /^(your (birth )?chart indicates (that )?)/i,
  /^(the planetary alignment suggests (that )?)/i,
  /^(here is what i see[:\s-]*)/i,
  /^(certainly[,!:\s-]*)/i,
  /^(absolutely[,!:\s-]*)/i,
  /^(let's explore[,:\s-]*)/i,
  /^(i hope this helps[!.\s]*)/i,
  /^(feel free to ask[,:\s-]*)/i,
  /^(aapki kundli ke anusaar[,:\s-]*)/i,
  /^(tumhari kundli ke anusaar[,:\s-]*)/i,
  /^(grah sthiti ke anusaar[,:\s-]*)/i,
  /^(kundli dekhne par pata chalta hai ki[,:\s-]*)/i,
  /^(main aapki chinta ko samajh sakta hoon[,:\s-]*)/i,
];

const ROBOTIC_HEADERS: RegExp[] = [
  /^\s*\*\*(Analysis|Interpretation|Conclusion|Remedy|Important|Summary|Overview|Astrological Insight|Vedic Perspective):\*\*\s*/gim,
  /^\s*#(##)?\s+(Analysis|Interpretation|Conclusion|Remedy|Important|Summary|Overview|Astrological Insight|Vedic Perspective)\s*$/gim,
  /^\s*(Analysis|Interpretation|Conclusion|Remedy|Important|Summary):\s*/gim,
];

const GREETING_STARTERS: RegExp[] = [
  /^(pranam|namaste|namaskar|hari om|pranaam|namashkar|radhe radhe|jai shri ram|jai shree krishna)\b[,\s!.🙏\-]*/i,
  /^(प्रणाम|नमस्ते|नमस्कार|हरि ॐ|जय श्री राम|राधे राधे)\b[,\s!.🙏\-]*/,
];

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}]/gu;

export interface SelfHealOptions {
  turnIndex: number;
  userMessage?: string;
  userLanguage?: string;
  leadWithEmpathy?: boolean;
  isHinglish?: boolean;
  isHindi?: boolean;
}

export const responseSelfHealer = {
  heal(text: string, options: SelfHealOptions): string {
    if (!text || text.trim().length === 0) return text;

    let healed = text.trim();

    // 1. Remove robotic headers and section labels
    for (const pattern of ROBOTIC_HEADERS) {
      healed = healed.replace(pattern, '').trim();
    }

    // 2. Remove AI announcement preambles at start of text
    for (const preamble of FORBIDDEN_PREAMBLES) {
      if (preamble.test(healed)) {
        healed = healed.replace(preamble, '').trim();
        healed = healed.replace(/^[,\s.!:\-]+/, '').trim();
        if (healed.length > 0) {
          healed = healed.charAt(0).toUpperCase() + healed.slice(1);
        }
      }
    }

    // 3. Turn > 0 Salutation Suppression (Don't repeat Pranam/Namaste every message)
    const userNorm = (options.userMessage || '').trim().toLowerCase();
    const isUserExplicitGreeting = /^(hi|hello|hey|namaste|pranam|namaskar|pranaam)\b/i.test(userNorm);

    if (options.turnIndex > 0 && !isUserExplicitGreeting) {
      for (const greeting of GREETING_STARTERS) {
        if (greeting.test(healed)) {
          healed = healed.replace(greeting, '').trim();
          healed = healed.replace(/^[,\s.!:\-]+/, '').trim();
          if (healed.length > 0) {
            healed = healed.charAt(0).toUpperCase() + healed.slice(1);
          }
        }
      }
    }

    // 4. Clean trailing robotic sign-offs ("I hope this helps!", "Feel free to ask more!")
    healed = healed
      .replace(/(i hope this helps[!.]*|feel free to ask any other questions[!.]*|let me know if you need more clarity[!.]*)$/i, '')
      .trim();

    // 5. Strictly remove all emojis across the interface
    healed = healed.replace(EMOJI_REGEX, '').replace(/  +/g, ' ');

    // 6. Micro & Short turn moderation
    const isMicroUserTurn = /^(haan|nahi|acha|kyu|hmm|sahi|oh|theek|ok|accha|ha|na|yes|no|sure|boliye|bolo|bataiye|batao|nothing|kuch nahi|chhod|chhodo|rehne do)$/i.test(userNorm);

    if (isMicroUserTurn) {
      const paragraphs = healed.split(/\n+/).filter((p) => p.trim().length > 0);
      if (paragraphs.length > 2) {
        healed = paragraphs.slice(0, 2).join('\n\n');
      }
    }

    // Clean multiple spaces and newlines
    healed = healed
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return healed;
  },
};
