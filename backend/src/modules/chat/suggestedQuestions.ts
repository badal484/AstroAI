import { SupportedLanguage } from '@astroai/shared-types';

/**
 * Static, curated starter questions rather than AI-generated ones — this
 * is called on essentially every empty conversation screen, so keeping it
 * deterministic, instant, and free is a deliberate choice, not a
 * shortcut. Varies by whether a birth profile is linked, since chart-
 * specific questions aren't answerable without one.
 */
const WITH_BIRTH_PROFILE: Record<SupportedLanguage, string[]> = {
  [SupportedLanguage.ENGLISH]: [
    'What does my birth chart say about my career this year?',
    "What's my horoscope for today?",
    'When is a good time for me in love or relationships?',
    'What are my strengths according to my chart?',
  ],
  [SupportedLanguage.HINDI]: [
    'मेरी कुंडली के अनुसार इस साल करियर कैसा रहेगा?',
    'आज का मेरा राशिफल क्या है?',
    'प्यार या रिश्तों के लिए मेरे लिए अच्छा समय कब है?',
    'मेरी कुंडली के अनुसार मेरी खूबियां क्या हैं?',
  ],
  [SupportedLanguage.HINGLISH]: [
    'Mera career is saal kaisa rahega, mere chart ke hisaab se?',
    'Aaj ka mera rashifal kya hai?',
    'Pyaar ya relationship ke liye mere liye acha time kab hai?',
    'Mere chart ke hisaab se meri strengths kya hain?',
  ],
};

const WITHOUT_BIRTH_PROFILE: Record<SupportedLanguage, string[]> = {
  [SupportedLanguage.ENGLISH]: [
    'What is Vedic astrology and how does it work?',
    'What is a moon sign, and how is it different from a sun sign?',
    'What is a nakshatra?',
    'Can you explain what a dasha period is?',
  ],
  [SupportedLanguage.HINDI]: [
    'वैदिक ज्योतिष क्या है और यह कैसे काम करता है?',
    'चंद्र राशि क्या है, और यह सूर्य राशि से कैसे अलग है?',
    'नक्षत्र क्या होता है?',
    'क्या आप बता सकते हैं कि दशा क्या होती है?',
  ],
  [SupportedLanguage.HINGLISH]: [
    'Vedic astrology kya hai aur yeh kaise kaam karta hai?',
    'Moon sign kya hota hai, aur yeh sun sign se kaise alag hai?',
    'Nakshatra kya hota hai?',
    'Dasha period kya hota hai, thoda explain kar sakte hain?',
  ],
};

export function getSuggestedQuestions(
  hasBirthProfile: boolean,
  language: SupportedLanguage = SupportedLanguage.ENGLISH,
): string[] {
  const table = hasBirthProfile ? WITH_BIRTH_PROFILE : WITHOUT_BIRTH_PROFILE;
  return table[language];
}
