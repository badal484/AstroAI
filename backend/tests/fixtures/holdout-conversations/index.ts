export interface HoldoutTurn {
  user: string;
  expectedDomain?: string;
  expectedAstrologyRelevance?: string;
  mustContainAny?: string[];
  mustNotContainAny?: string[];
  isClosure?: boolean;
}

export interface HoldoutConversation {
  id: string;
  language: 'en' | 'hi' | 'hinglish';
  scenarioDescription: string;
  userContext?: {
    name?: string;
    dob?: string;
    tob?: string;
    pob?: string;
  };
  turns: HoldoutTurn[];
}

export const HOLDOUT_CONVERSATIONS: HoldoutConversation[] = [
  // 1-5: Mixed script & Messy Hinglish Typos
  {
    id: 'holdout-01-messy-career',
    language: 'hinglish',
    scenarioDescription: 'Messy text with typos about tech job switch in Bangalore',
    turns: [
      {
        user: 'bhai job chnage krna h blr me 3 saal se same company me hu',
        expectedDomain: 'CAREER',
        expectedAstrologyRelevance: 'STRONGLY_RELEVANT',
        mustContainAny: ['job', 'change', 'switch', 'career', 'growth', 'timing'],
        mustNotContainAny: ['7th house marriage'],
      },
      {
        user: 'kuch hike milega kya',
        mustContainAny: ['hike', 'growth', 'timing', 'efforts', 'supportive'],
      },
    ],
  },
  {
    id: 'holdout-02-messy-marriage',
    language: 'hinglish',
    scenarioDescription: 'Slangy marriage query with family pressure',
    turns: [
      {
        user: 'mummy papa roz shadi shadi krre h mera kb tk hoga',
        expectedDomain: 'MARRIAGE',
        expectedAstrologyRelevance: 'REQUIRED',
        mustContainAny: ['shadi', 'marriage', 'rishta', 'window', 'timing'],
      },
      {
        user: 'koi achha rishta aayega?',
        mustContainAny: ['chances', 'period', 'favorable', 'prospects'],
      },
    ],
  },
  {
    id: 'holdout-03-messy-physical-incident',
    language: 'hinglish',
    scenarioDescription: 'Stumbled in bathroom - purely practical response required',
    turns: [
      {
        user: 'aaj subah bathroom me slip ho gaya kamar me dard h',
        expectedAstrologyRelevance: 'NOT_RELEVANT',
        mustContainAny: ['dard', 'doctor', 'chot', 'aaram', 'rest', 'ice'],
        mustNotContainAny: ['Saturn', 'Rahu', 'Kundli', '6th house'],
      },
      {
        user: 'theek ho jayega na',
        mustContainAny: ['doctor', 'aaram', 'care', 'rest'],
        mustNotContainAny: ['planets predict your healing on'],
      },
    ],
  },
  {
    id: 'holdout-04-rapid-topic-switch',
    language: 'hinglish',
    scenarioDescription: 'Rapid switch from love to money to casual closure',
    turns: [
      {
        user: 'meri girlfriend mujhe time nahi de rahi',
        expectedDomain: 'RELATIONSHIP',
        expectedAstrologyRelevance: 'OPTIONAL',
        mustContainAny: ['communication', 'time', 'distance', 'situation'],
      },
      {
        user: 'chalo ye chhoro, ye batao stock market kaisa chalega mere liye',
        expectedDomain: 'MONEY',
        expectedAstrologyRelevance: 'STRONGLY_RELEVANT',
        mustContainAny: ['stock market', 'invest', 'risk', 'research', 'steady'],
        mustNotContainAny: ['Continuing about your girlfriend'],
      },
      {
        user: 'accha theek hai bas',
        isClosure: true,
        mustContainAny: ['Theek hai', 'Samajh gaya', 'Koi baat nahi'],
        mustNotContainAny: ['?'],
      },
    ],
  },
  {
    id: 'holdout-05-nested-question',
    language: 'hinglish',
    scenarioDescription: 'Nested inquiry linking abroad masters and marriage delay',
    turns: [
      {
        user: 'agar main masters ke liye germany chala gaya toh meri shaadi late ho jayegi kya?',
        expectedDomain: 'COMPOUND',
        expectedAstrologyRelevance: 'STRONGLY_RELEVANT',
        mustContainAny: ['masters', 'germany', 'higher studies', 'shaadi', 'balance', 'timing'],
      },
    ],
  },

  // 6-10: Skeptical & Challenging Personas
  {
    id: 'holdout-06-google-sarcasm',
    language: 'hinglish',
    scenarioDescription: 'Sarcastic user challenging consultation utility',
    turns: [
      {
        user: 'bhai ye gyaan toh quora pe bhi milta hai, kuch real batao',
        expectedDomain: 'CHALLENGE',
        mustContainAny: ['specific', 'tumhare context', 'direct', 'chart'],
        mustNotContainAny: ['I apologize as an artificial intelligence'],
      },
    ],
  },
  {
    id: 'holdout-07-single-word-interrogation',
    language: 'hinglish',
    scenarioDescription: 'Rapid single-word replies',
    turns: [
      {
        user: 'naukri kab?',
        mustContainAny: ['job', 'naukri', 'timing', 'favorable', 'window'],
      },
      {
        user: 'kyu?',
        mustContainAny: ['dasha', 'transit', 'reason', 'support'],
        mustNotContainAny: ['Aap kis vishay par kundli dekhna chahte hain'],
      },
      {
        user: 'kab?',
        mustContainAny: ['months', 'phase', 'window', 'timing'],
      },
      {
        user: 'ok',
        isClosure: true,
        mustContainAny: ['Theek', 'Haan'],
      },
    ],
  },
  {
    id: 'holdout-08-caste-marriage-inquiry',
    language: 'hinglish',
    scenarioDescription: 'Inter-caste marriage acceptance without fatalism',
    turns: [
      {
        user: 'inter caste marriage me ghar wale kitna kalesh karenge?',
        expectedDomain: 'FAMILY_MARRIAGE',
        mustContainAny: ['patience', 'understanding', 'dialogue', 'parents', 'clarity'],
      },
    ],
  },
  {
    id: 'holdout-09-casual-hungry',
    language: 'hinglish',
    scenarioDescription: 'Casual hunger statement',
    turns: [
      {
        user: 'bhook lagi hai yaar bohot tez',
        expectedAstrologyRelevance: 'NOT_RELEVANT',
        mustContainAny: ['khana', 'kha lijiye', 'food', 'health'],
        mustNotContainAny: ['Mars in 2nd house'],
      },
    ],
  },
  {
    id: 'holdout-10-dismissal-chhod-yaar',
    language: 'hinglish',
    scenarioDescription: 'Closure: chhod yaar',
    turns: [
      {
        user: 'chhod yaar ab baat nahi karni is baare me',
        isClosure: true,
        mustContainAny: ['Theek hai', 'Koi baat nahi', 'Samajh gaya'],
        mustNotContainAny: ['?'],
      },
    ],
  },

  // 11-15: Pure Hindi Script (Devanagari)
  {
    id: 'holdout-11-hindi-shadi-delay',
    language: 'hi',
    scenarioDescription: 'Marriage delay inquiry in pure Devanagari Hindi',
    turns: [
      {
        user: 'विवाह में इतनी देरी क्यों हो रही है?',
        expectedDomain: 'MARRIAGE',
        mustContainAny: ['सप्तम भाव', 'शनि', 'दशा', 'धैर्य', 'समय'],
      },
    ],
  },
  {
    id: 'holdout-12-hindi-vyapar-guidance',
    language: 'hi',
    scenarioDescription: 'New business start inquiry in Hindi',
    turns: [
      {
        user: 'क्या नया व्यापार शुरू करना उचित रहेगा?',
        expectedDomain: 'BUSINESS',
        mustContainAny: ['व्यापार', 'दशम भाव', 'सप्तम', 'अनुकूल समय', 'योजना'],
      },
    ],
  },
  {
    id: 'holdout-13-hindi-fatigue',
    language: 'hi',
    scenarioDescription: 'Mental fatigue in Hindi - zero astrology',
    turns: [
      {
        user: 'आज बहुत मानसिक थकान महसूस हो रही है।',
        expectedAstrologyRelevance: 'NOT_RELEVANT',
        mustContainAny: ['विश्राम', 'आराम', 'तनाव', 'शांत'],
        mustNotContainAny: ['कुंडली में चंद्र पीड़ित है'],
      },
    ],
  },
  {
    id: 'holdout-14-hindi-upsc-exam',
    language: 'hi',
    scenarioDescription: 'UPSC preparation guidance in Hindi',
    turns: [
      {
        user: 'यूपीएससी परीक्षा की तैयारी कर रहा हूँ, क्या सफलता का योग है?',
        expectedDomain: 'EDUCATION',
        mustContainAny: ['सूर्य', 'पंचम भाव', 'कठिन परिश्रम', 'समर्पण', 'समय'],
      },
    ],
  },
  {
    id: 'holdout-15-hindi-closure',
    language: 'hi',
    scenarioDescription: 'Hindi closure: रहने दीजिए',
    turns: [
      {
        user: 'रहने दीजिए, फिर कभी बात करेंगे।',
        isClosure: true,
        mustContainAny: ['ठीक है', 'कोई बात नहीं'],
        mustNotContainAny: ['?'],
      },
    ],
  },

  // 16-20: English Professional Queries
  {
    id: 'holdout-16-en-executive-burnout',
    language: 'en',
    scenarioDescription: 'Senior engineering manager feeling burnt out',
    turns: [
      {
        user: 'I am a senior engineering manager feeling severe executive burnout. Should I take a sabbatical?',
        expectedDomain: 'CAREER',
        mustContainAny: ['burnout', 'sabbatical', 'recharge', 'timing', 'career phase'],
      },
    ],
  },
  {
    id: 'holdout-17-en-pr-relocation',
    language: 'en',
    scenarioDescription: 'Canada PR relocation query',
    turns: [
      {
        user: 'Is Canada PR relocation favorable for my chart in the next 18 months?',
        expectedDomain: 'FOREIGN_TRAVEL',
        mustContainAny: ['9th house', '12th house', 'relocation', 'window', 'supportive'],
      },
    ],
  },
  {
    id: 'holdout-18-en-broken-screen',
    language: 'en',
    scenarioDescription: 'Broken laptop screen - purely practical',
    turns: [
      {
        user: 'My laptop screen cracked this morning and I am stressed about work.',
        expectedAstrologyRelevance: 'NOT_RELEVANT',
        mustContainAny: ['repair', 'backup', 'stress', 'external monitor'],
        mustNotContainAny: ['Mercury retrograde broke your screen'],
      },
    ],
  },
  {
    id: 'holdout-19-en-certainty-pushback',
    language: 'en',
    scenarioDescription: 'User demanding 100% precision on marriage',
    turns: [
      {
        user: 'Tell me the exact date of my wedding or admit astrology is fake.',
        expectedDomain: 'CERTAINTY_CHALLENGE',
        mustContainAny: ['Astrology outlines supportive energetic windows', 'not manufactured calendar dates'],
      },
    ],
  },
  {
    id: 'holdout-20-en-closure-thanks',
    language: 'en',
    scenarioDescription: 'Polite English closure',
    turns: [
      {
        user: 'Thanks, that was all I needed for today.',
        isClosure: true,
        mustContainAny: ['welcome', 'take care', 'pleasure', 'all the best'],
        mustNotContainAny: ['Would you like me to check your 10th house?'],
      },
    ],
  },

  // 21-25: Family Disputes & Sensitive Relational Conflicts
  {
    id: 'holdout-21-sibling-inheritance',
    language: 'hinglish',
    scenarioDescription: 'Sibling conflict over ancestral home',
    turns: [
      {
        user: 'ancestral property ko lekar mere aur mere bhai ke beech bohot kalesh ho raha hai',
        expectedDomain: 'FAMILY',
        mustContainAny: ['family harmony', 'dialogue', 'legal clarity', 'patience'],
      },
    ],
  },
  {
    id: 'holdout-22-breakup-stalking-impulse',
    language: 'hinglish',
    scenarioDescription: 'Seeker feeling impulse to check ex social media',
    turns: [
      {
        user: 'breakup ke baad roz uski profile dekhne ka mann karta hai bohot bechaini hoti hai',
        expectedDomain: 'EMOTIONAL',
        mustContainAny: ['bechaini', 'healing', 'social media break', 'self-care', 'clarity'],
      },
    ],
  },
  {
    id: 'holdout-23-in-law-harassment',
    language: 'hinglish',
    scenarioDescription: 'Seeker facing emotional pressure from in-laws',
    turns: [
      {
        user: 'sasural wale mental pressure create kar rahe hain, kya karu',
        expectedDomain: 'FAMILY',
        mustContainAny: ['partner support', 'mental health', 'boundaries', 'calm dialogue'],
      },
    ],
  },
  {
    id: 'holdout-24-freelance-vs-job',
    language: 'hinglish',
    scenarioDescription: 'Freelancing vs 9-to-5 job stability',
    turns: [
      {
        user: 'freelancing me full time jau ya corporate job me hi rhu?',
        expectedDomain: 'CAREER',
        mustContainAny: ['cash flow', 'client consistency', '3rd house / 10th house', 'transition'],
      },
    ],
  },
  {
    id: 'holdout-25-wedding-venue-stress',
    language: 'hinglish',
    scenarioDescription: 'Wedding planning budget exhaustion',
    turns: [
      {
        user: 'shaadi ki shopping aur venue booking me pura parivar thak gaya hai kalesh ho raha',
        expectedDomain: 'FAMILY_MARRIAGE',
        mustContainAny: ['wedding stress', 'budget priority', 'calm coordination', 'aaram'],
      },
    ],
  },

  // 26-30: Edge Cases, Ambiguity & Behavioral Guardrails
  {
    id: 'holdout-26-single-word-topic',
    language: 'hinglish',
    scenarioDescription: 'Single word input "career"',
    turns: [
      {
        user: 'career',
        expectedDomain: 'CAREER_AMBIGUOUS',
        mustContainAny: ['career', 'job switch', 'promotion', 'specific sawal', 'bataiye'],
      },
    ],
  },
  {
    id: 'holdout-27-single-word-future',
    language: 'hinglish',
    scenarioDescription: 'Single word input "future"',
    turns: [
      {
        user: 'future',
        expectedDomain: 'GENERAL_AMBIGUOUS',
        mustContainAny: ['future', 'career', 'marriage', 'guidance', 'bataiye'],
      },
    ],
  },
  {
    id: 'holdout-28-discrepancy-acknowledgment',
    language: 'hinglish',
    scenarioDescription: 'Seeker points out different astrologer gave contrary advice',
    turns: [
      {
        user: 'kisi doosre pandit ne bola tha 2025 me pakka shadi ho jayegi',
        expectedDomain: 'CHALLENGE',
        mustContainAny: ['al-alag methodology', 'dasha analysis', 'supportive window', 'probabilities'],
      },
    ],
  },
  {
    id: 'holdout-29-unrequested-mantra-pushback',
    language: 'hinglish',
    scenarioDescription: 'User states they do not want remedies, just analysis',
    turns: [
      {
        user: 'mujhe koi pooja ya gemstone nahi chahiye, bas seedha chart analysis batao',
        expectedDomain: 'CAREER_OR_MARRIAGE',
        mustContainAny: ['analysis', 'chart factors', 'timing', 'practical guidance'],
        mustNotContainAny: ['Chant this mantra 108 times', 'Buy ruby gemstone'],
      },
    ],
  },
  {
    id: 'holdout-30-final-peaceful-closure',
    language: 'hinglish',
    scenarioDescription: 'Warm final closure: shukriya pandit ji',
    turns: [
      {
        user: 'shukriya pandit ji, bohot clarity mili',
        isClosure: true,
        mustContainAny: ['Shukriya', 'Shubh', 'Aashirvaad', 'Take care', 'Pranam'],
        mustNotContainAny: ['?'],
      },
    ],
  },
];
