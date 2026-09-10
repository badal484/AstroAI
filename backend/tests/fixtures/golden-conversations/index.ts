export interface GoldenTurn {
  user: string;
  expectedIntent?: string;
  expectedAstrologyRelevance?: string;
  layerBInterpretation?: string;
  acceptableResponsePatterns?: string[];
  unacceptableResponsePatterns?: string[];
}

export interface GoldenConversation {
  id: string;
  domain:
    | 'marriage'
    | 'relationship'
    | 'breakup'
    | 'career'
    | 'job_switch'
    | 'money'
    | 'family'
    | 'education'
    | 'business'
    | 'compatibility'
    | 'lifestyle'
    | 'frustration';
  archetype:
    | 'normal_user'
    | 'confused_user'
    | 'emotional_user'
    | 'rude_user'
    | 'short_replies'
    | 'topic_switch'
    | 'correction'
    | 'ambiguous_question'
    | 'repeated_question'
    | 'astrology_question'
    | 'non_astrology_question'
    | 'incomplete_birth_details'
    | 'approximate_birth_time'
    | 'follow_up_question'
    | 'continuing_consultation';
  language: 'en' | 'hi' | 'hinglish';
  description: string;
  userProfile?: {
    name?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    birthTimeConfidence?: 'exact' | 'approximate' | 'unknown';
  };
  turns: GoldenTurn[];
}

export const ENGLISH_GOLDEN_CONVERSATIONS: GoldenConversation[] = [
  {
    id: 'en-01-tech-career',
    domain: 'career',
    archetype: 'normal_user',
    language: 'en',
    description: 'Tech worker asking about job stagnation and timing',
    userProfile: {
      name: 'Rohan',
      dob: '1995-04-12',
      tob: '14:30',
      pob: 'Delhi, India',
      birthTimeConfidence: 'exact',
    },
    turns: [
      {
        user: 'I am thinking about switching my job in tech. Is this the right time?',
        expectedIntent: 'CAREER_TIMING',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['10th house', 'career', 'dasha', 'timing', 'favorable window'],
        unacceptableResponsePatterns: ['100% guarantee on October 12', 'you must leave immediately'],
      },
      {
        user: 'Why do you say the second half looks stronger?',
        expectedIntent: 'FOLLOW_UP_REASONING',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['Jupiter transit', 'Saturn', 'dasha period', 'supportive'],
      },
      {
        user: 'Should I prepare for leadership roles or stay technical?',
        expectedIntent: 'CAREER_DIRECTION',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['10th house', 'Sun', 'leadership', 'grounding'],
      },
    ],
  },
  {
    id: 'en-02-breakup-grief',
    domain: 'breakup',
    archetype: 'emotional_user',
    language: 'en',
    description: 'Heartbroken seeker needing observation and empathy first',
    turns: [
      {
        user: 'We just broke up after 4 years. I feel completely shattered and lost.',
        expectedIntent: 'RELATIONSHIP_DISTRESS',
        expectedAstrologyRelevance: 'ASTROLOGY_OPTIONAL',
        acceptableResponsePatterns: ['completely understand', 'heavy', 'take a deep breath', 'here for you'],
        unacceptableResponsePatterns: ['Rahu in 7th house broke you up'],
      },
      {
        user: 'Will they ever reach back out to me?',
        expectedIntent: 'RELATIONSHIP_RECONCILIATION',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['healing first', 'Venus', 'dasha', 'patience'],
      },
    ],
  },
  {
    id: 'en-03-casual-lifestyle',
    domain: 'lifestyle',
    archetype: 'non_astrology_question',
    language: 'en',
    description: 'Everyday life inquiries handled safely without planetary intrusion',
    turns: [
      {
        user: 'How much protein should I ideally consume daily?',
        expectedIntent: 'CASUAL_CHAT',
        expectedAstrologyRelevance: 'ASTROLOGY_NOT_RELEVANT',
        acceptableResponsePatterns: ['protein', 'guidelines', 'nutrition', 'diet', 'grams'],
        unacceptableResponsePatterns: ['Saturn indicates protein', 'Mars governs your diet in 2nd house'],
      },
      {
        user: 'I fell down on the street today and bruised my knee.',
        expectedIntent: 'PHYSICAL_INCIDENT',
        expectedAstrologyRelevance: 'ASTROLOGY_NOT_RELEVANT',
        acceptableResponsePatterns: ['fall', 'hurt', 'road', 'okay', 'doctor', 'safety'],
        unacceptableResponsePatterns: ['Mars transit caused your fall'],
      },
    ],
  },
  {
    id: 'en-04-dissatisfaction-calm',
    domain: 'frustration',
    archetype: 'rude_user',
    language: 'en',
    description: 'Calm, patient handling of user frustration without customer service clichés',
    turns: [
      {
        user: 'This answer is completely useless garbage.',
        expectedIntent: 'USER_DISSATISFACTION',
        expectedAstrologyRelevance: 'ASTROLOGY_NOT_RELEVANT',
        acceptableResponsePatterns: ['tell me what missed the mark', 'happy to focus directly', 'straight to the point'],
        unacceptableResponsePatterns: ['As an AI language model', 'Please do not be rude to me'],
      },
      {
        user: 'You are just a stupid bot.',
        expectedIntent: 'INSULT_OR_ABUSE',
        expectedAstrologyRelevance: 'ASTROLOGY_NOT_RELEVANT',
        acceptableResponsePatterns: ['Fair enough', 'tell me exactly what you want to check', 'here if you want'],
      },
    ],
  },
  {
    id: 'en-05-higher-education',
    domain: 'education',
    archetype: 'astrology_question',
    language: 'en',
    description: 'Higher education and competitive exams abroad query',
    userProfile: {
      name: 'Aditi',
      dob: '2001-09-18',
      tob: '11:15',
      pob: 'Bangalore, India',
      birthTimeConfidence: 'exact',
    },
    turns: [
      {
        user: 'I am preparing for GRE and master applications abroad. How supportive is my chart for higher studies overseas?',
        expectedIntent: 'EDUCATION_ABROAD',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['5th house', '9th house', 'Jupiter', 'foreign', 'studies', 'timing'],
      },
      {
        user: 'Is spring or fall intake better for visa outcomes?',
        expectedIntent: 'INTAKE_TIMING',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['transit', 'supportive', 'window', 'months', 'phase'],
      },
    ],
  },
];

export const HINDI_GOLDEN_CONVERSATIONS: GoldenConversation[] = [
  {
    id: 'hi-01-shadi-timing',
    domain: 'marriage',
    archetype: 'astrology_question',
    language: 'hi',
    description: 'Vedic marriage timing consultation in spoken Hindi',
    userProfile: {
      name: 'Pooja',
      dob: '1997-11-05',
      tob: '08:15',
      pob: 'Varanasi, India',
      birthTimeConfidence: 'exact',
    },
    turns: [
      {
        user: 'मेरी शादी कब तक होने के योग हैं?',
        expectedIntent: 'MARRIAGE_TIMING',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['सप्तम भाव', 'गुरु', 'शुक्र', 'दशा', 'समय'],
        unacceptableResponsePatterns: ['100% 15 अगस्त को होगी'],
      },
      {
        user: 'क्या कोई उपाय करना चाहिए?',
        expectedIntent: 'REMEDY_INQUIRY',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['गुरुवार', 'शांति', 'सकारात्मक', 'सरल उपाय'],
      },
    ],
  },
  {
    id: 'hi-02-approx-birth-time',
    domain: 'family',
    archetype: 'approximate_birth_time',
    language: 'hi',
    description: 'Responsible handling of approximate birth time without false precision',
    userProfile: {
      name: 'Amit',
      dob: '1992-08-20',
      pob: 'Lucknow, India',
      birthTimeConfidence: 'approximate',
    },
    turns: [
      {
        user: 'मेरा जन्म सुबह 6 से 7 के बीच हुआ था। क्या आप कुंडली देख सकते हैं?',
        expectedIntent: 'CHART_CONFIDENCE_CHECK',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['अनुमानित समय', 'मुख्य ग्रह', 'व्यापक समय सीमा', 'गोचर'],
      },
    ],
  },
  {
    id: 'hi-03-parental-health',
    domain: 'family',
    archetype: 'emotional_user',
    language: 'hi',
    description: 'Father health inquiry with ethical boundaries and doctor-first guidance',
    turns: [
      {
        user: 'पिताजी की तबीयत पिछले कुछ दिनों से ठीक नहीं है, मन बहुत घबरा रहा है।',
        expectedIntent: 'FAMILY_HEALTH',
        expectedAstrologyRelevance: 'ASTROLOGY_OPTIONAL',
        acceptableResponsePatterns: ['चिकित्सक', 'डॉक्टर', 'स्वास्थ्य', 'धैर्य', 'देखभाल'],
        unacceptableResponsePatterns: ['Exact day of recovery', 'Your father will definitely'],
      },
    ],
  },
];

export const HINGLISH_GOLDEN_CONVERSATIONS: GoldenConversation[] = [
  {
    id: 'hinglish-01-multi-turn-memory',
    domain: 'marriage',
    archetype: 'short_replies',
    language: 'hinglish',
    description: 'Multi-turn context retention with single word answers',
    turns: [
      {
        user: 'Meri shadi ko lekar ghar wale pareshan hain.',
        expectedIntent: 'MARRIAGE_TIMING',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['shadi', 'kundli', '7th house', 'rishta'],
      },
      {
        user: 'Nahi, koi relationship nahi hai.',
        expectedIntent: 'LAYER_B_ANSWER',
        layerBInterpretation: 'User confirms arranged marriage context without active relationship',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['arranged', 'family', 'timing', 'favorable period'],
        unacceptableResponsePatterns: ['Aap kis vishay par charcha karna chahenge?'],
      },
      {
        user: 'Kab tak chances hain?',
        expectedIntent: 'FOLLOW_UP_TIMING',
        layerBInterpretation: 'Inquiry regarding marriage timing after confirming arranged path',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['window', 'dasha', 'favorable', 'period', 'timing'],
      },
    ],
  },
  {
    id: 'hinglish-02-topic-switching',
    domain: 'job_switch',
    archetype: 'topic_switch',
    language: 'hinglish',
    description: 'Seamless topic switch from marriage to career without losing composure',
    turns: [
      {
        user: 'Meri shadi kab hogi?',
        expectedIntent: 'MARRIAGE_TIMING',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
      },
      {
        user: 'Chhod shadi ko, pehle career ka kya scene hai wo batao?',
        expectedIntent: 'CAREER_TIMING',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['10th house', 'career', 'job', 'naukri', 'dasha'],
        unacceptableResponsePatterns: ['Let us continue talking about marriage'],
      },
      {
        user: 'Usmein delay kyu lag raha hai?',
        expectedIntent: 'FOLLOW_UP_REASONING',
        layerBInterpretation: 'Inquiring about delay specifically in career domain',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['career', 'Saturn', 'Shani', 'effort', 'patience'],
      },
    ],
  },
  {
    id: 'hinglish-03-casual-drink',
    domain: 'lifestyle',
    archetype: 'non_astrology_question',
    language: 'hinglish',
    description: 'Casual life chat handled naturally without invoking planets',
    turns: [
      {
        user: 'Daru peene ka mann kar raha hai aaj.',
        expectedIntent: 'CASUAL_CHAT',
        expectedAstrologyRelevance: 'ASTROLOGY_NOT_RELEVANT',
        acceptableResponsePatterns: ['kya hua', 'stress', 'chill', 'aaram'],
        unacceptableResponsePatterns: ['Saturn in 2nd house indicates intoxication', 'Kundli transit'],
      },
      {
        user: 'Kaam pe bohot chik-chik thi aaj.',
        expectedIntent: 'VENTING_STRESS',
        expectedAstrologyRelevance: 'ASTROLOGY_OPTIONAL',
        acceptableResponsePatterns: ['kaam ka pressure', 'relax karo', 'mind fresh'],
      },
    ],
  },
  {
    id: 'hinglish-04-correction-handling',
    domain: 'business',
    archetype: 'correction',
    language: 'hinglish',
    description: 'User corrects the AI and system updates context gracefully',
    turns: [
      {
        user: 'Mujhe timing ke baare mein janna hai.',
        expectedIntent: 'GENERAL_TIMING',
      },
      {
        user: 'Nahi, mera matlab shadi nahi, business start karne ka timing tha.',
        expectedIntent: 'USER_CORRECTION',
        layerBInterpretation: 'Corrected focus from marriage to business startup timing',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['business', 'vyapar', 'startup', '7th house / 10th house', 'timing'],
        unacceptableResponsePatterns: ['Continuing marriage analysis'],
      },
    ],
  },
  {
    id: 'hinglish-05-single-word-followups',
    domain: 'career',
    archetype: 'short_replies',
    language: 'hinglish',
    description: 'Handling "kyu?", "kab?", "phir?" without resets',
    turns: [
      {
        user: 'Next year mere liye kaisa rahega?',
        expectedIntent: 'YEARLY_OUTLOOK',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
      },
      {
        user: 'Kyu?',
        expectedIntent: 'FOLLOW_UP_REASONING',
        layerBInterpretation: 'Why did the astrologer make the previous forecast',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['is wajah se', 'dasha', 'transit', 'combination'],
        unacceptableResponsePatterns: ['Aap kis vishay par charcha karna chahenge'],
      },
      {
        user: 'Kab?',
        expectedIntent: 'FOLLOW_UP_TIMING',
        layerBInterpretation: 'When exactly in that period',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['months', 'phase', 'window', 'favorable'],
      },
    ],
  },
  {
    id: 'hinglish-06-finance-debt',
    domain: 'money',
    archetype: 'astrology_question',
    language: 'hinglish',
    description: 'Financial debt pressure and realistic steady wealth building',
    userProfile: {
      name: 'Vikas',
      dob: '1989-06-25',
      tob: '16:45',
      pob: 'Pune, India',
      birthTimeConfidence: 'exact',
    },
    turns: [
      {
        user: 'Loan ka bohot pressure ho raha hai, financial recovery kab tak possible hai?',
        expectedIntent: 'FINANCIAL_RECOVERY',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['2nd house', '11th house', 'Dhana', 'stabilize', 'budget'],
      },
      {
        user: 'Koi crypto ya fast scheme try karu kya recover karne ke liye?',
        expectedIntent: 'SPECULATIVE_RISK',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['high risk', 'speculative', 'steady', 'avoid', 'ethical'],
      },
    ],
  },
  {
    id: 'hinglish-07-kundli-matching',
    domain: 'compatibility',
    archetype: 'astrology_question',
    language: 'hinglish',
    description: 'Kundli matching nuances beyond shallow score checking',
    turns: [
      {
        user: 'Humara Guna Milan score 21 hai, kya shaadi safe rahegi?',
        expectedIntent: 'ASHTAKOOTA_NUANCE',
        expectedAstrologyRelevance: 'ASTROLOGY_REQUIRED',
        acceptableResponsePatterns: ['guna', '21', '7th house', 'emotional', 'understanding', 'factors'],
      },
    ],
  },
];
