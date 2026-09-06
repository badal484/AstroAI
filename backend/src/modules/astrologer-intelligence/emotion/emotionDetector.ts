import { EmotionalState, type EmotionalContext } from './emotionTypes';

interface EmotionMatcher {
  state: EmotionalState;
  patterns: RegExp[];
  intensity: 'LOW' | 'MODERATE' | 'HIGH';
  requiresEmpathyFirst: boolean;
}

const EMOTION_MATCHERS: EmotionMatcher[] = [
  {
    state: EmotionalState.FEARFUL,
    intensity: 'HIGH',
    requiresEmpathyFirst: true,
    patterns: [
      /\b(terrified|scared|darr lag raha|dar lagta hai|darr hai|fear of|hopeless|never find someone|akela reh jaunga|akeli reh jaungi)\b/i,
      /\b(डर लग रहा है|अकेला रह जाऊंगा|अकेली रह जाऊंगी|भयभीत)\b/,
    ],
  },
  {
    state: EmotionalState.ANXIOUS,
    intensity: 'HIGH',
    requiresEmpathyFirst: true,
    patterns: [
      /\b(anxious|anxiety|worried|tensed|tension ho rahi|bohot tension|pareshan hoon|chinta ho rahi|stress me hoon|stress|financial stress)\b/i,
      /\b(चिंता हो रही|परेशान हूँ|तनाव|टेंशन|स्ट्रेस)\b/,
    ],
  },
  {
    state: EmotionalState.SAD,
    intensity: 'HIGH',
    requiresEmpathyFirst: true,
    patterns: [
      /\b(sad|crying|heartbroken|dil toot gaya|rona aa raha|depressed|bahut dukh|akela pan)\b/i,
      /\b(not talking|baat nahi|breakup|ignoring me|naraz|door ho gay)\b/i,
      /\b(दुखी|रोना आ रहा|दिल टूट गया|उदास|बात नहीं)\b/,
    ],
  },
  {
    state: EmotionalState.FRUSTRATED,
    intensity: 'MODERATE',
    requiresEmpathyFirst: true,
    patterns: [
      /\b(frustrated|irritated|fed up|tang aa gaya|thak chuka|kuch nahi ho raha|sub ruk gaya)\b/i,
      /\b(तंग आ गया|थक चुका हूँ|फ्रस्ट्रेट)\b/,
    ],
  },
  {
    state: EmotionalState.CONFUSED,
    intensity: 'MODERATE',
    requiresEmpathyFirst: false,
    patterns: [
      /\b(confused|samajh nahi aa raha|kya karu|dilemma|directionless|confused about|bataiye kya sahi hai)\b/i,
      /\b(समझ नहीं आ रहा|कन्फ्यूज|क्या करूं)\b/,
    ],
  },
  {
    state: EmotionalState.UNCERTAIN,
    intensity: 'LOW',
    requiresEmpathyFirst: false,
    patterns: [
      /\b(unsure|not sure|pata nahi|hoga ya nahi|doubt hai|chance hai kya|sambhavna)\b/i,
      /\b(संशय|डाउट|होगा या नहीं)\b/,
    ],
  },
  {
    state: EmotionalState.HOPEFUL,
    intensity: 'MODERATE',
    requiresEmpathyFirst: false,
    patterns: [
      /\b(hopeful|ummeed hai|positive|accha hoga|looking forward|koi shubh samachar)\b/i,
      /\b(उम्मीद|आशावादी|शुभ समाचार)\b/,
    ],
  },
  {
    state: EmotionalState.EXCITED,
    intensity: 'MODERATE',
    requiresEmpathyFirst: false,
    patterns: [
      /\b(excited|khush hoon|good news|rishta aaya hai|new offer|shadi fix)\b/i,
      /\b(उत्साहित|खुश हूँ|खुशखबरी)\b/,
    ],
  },
  {
    state: EmotionalState.CURIOUS,
    intensity: 'LOW',
    requiresEmpathyFirst: false,
    patterns: [
      /\b(curious|jaanna chahta hoon|jaanna chahti hoon|tell me about|bataiye|how is my)\b/i,
      /\b(जानना चाहता हूँ|जानना चाहती हूँ|बताइए)\b/,
    ],
  },
];

export const emotionDetector = {
  detectEmotion(userMessage: string): EmotionalContext {
    const text = userMessage.trim();

    for (const matcher of EMOTION_MATCHERS) {
      for (const pattern of matcher.patterns) {
        if (pattern.test(text)) {
          return {
            state: matcher.state,
            intensity: matcher.intensity,
            requiresEmpathyFirst: matcher.requiresEmpathyFirst,
          };
        }
      }
    }

    return {
      state: EmotionalState.NEUTRAL,
      intensity: 'LOW',
      requiresEmpathyFirst: false,
    };
  },
};
