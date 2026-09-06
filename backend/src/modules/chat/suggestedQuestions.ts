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
    'When will I get married according to my chart?',
    'When will I get a new job or career growth?',
    'What will my life partner be like?',
    'How is my financial outlook and wealth timing?',
  ],
  [SupportedLanguage.HINDI]: [
    'मेरी शादी कब होगी?',
    'नौकरी और करियर में तरक्की कब होगी?',
    'मेरा जीवनसाथी कैसा होगा?',
    'आर्थिक स्थिति और धन लाभ के योग कब हैं?',
  ],
  [SupportedLanguage.HINGLISH]: [
    'Meri shadi kab hogi?',
    'Naukri ya career me tarakki kab hogi?',
    'Mera jeevansathi kaisa hoga?',
    'Aarthik sthiti aur dhan labh ke yog kab hain?',
  ],
};

export function getSuggestedQuestions(
  hasBirthProfile: boolean,
  language: SupportedLanguage = SupportedLanguage.ENGLISH,
): string[] {
  const table = hasBirthProfile ? WITH_BIRTH_PROFILE : WITHOUT_BIRTH_PROFILE;
  return table[language];
}
