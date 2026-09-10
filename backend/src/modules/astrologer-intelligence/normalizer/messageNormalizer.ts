/**
 * Advanced Message Normalizer for Hinglish, Romanized Hindi, and English.
 * Handles:
 * 1. Missing space segmentation (e.g. 'Roadnky' -> 'road kyu', 'shadikab' -> 'shadi kab')
 * 2. Repeated character collapse (e.g. 'kbbb' -> 'kab', 'soooch' -> 'soch', 'dhaaaadak' -> 'dhadak')
 * 3. Phonetic transliteration mapping & slang normalization (e.g. 'q'/'kyo' -> 'kyu', 'nhi' -> 'nahi', 'h'/'he' -> 'hai', 'rha' -> 'raha')
 * 4. Punctuation and case normalization
 */

export interface NormalizedMessageResult {
  rawMessage: string;
  normalizedMessage: string;
  original: string;
  normalized: string;
  tokens: string[];
  detectedLanguage: 'en' | 'hi' | 'hinglish';
  corrections: Record<string, string>;
  hasTypoOrSlang: boolean;
}

// Common Hinglish / Romanized Hindi word phonetic canonical forms
const HINGLISH_DICTIONARY: Record<string, string> = {
  // Interrogatives
  q: 'kyu',
  kyu: 'kyu',
  kyun: 'kyu',
  kyo: 'kyu',
  kyon: 'kyu',
  qyu: 'kyu',
  kb: 'kab',
  kbb: 'kab',
  kabb: 'kab',
  ks: 'kaisa',
  kse: 'kaise',
  kese: 'kaise',
  kaise: 'kaise',
  kaisa: 'kaisa',
  kaisi: 'kaisi',
  kidhar: 'kidhar',
  kdhr: 'kidhar',
  kaha: 'kaha',
  kahan: 'kaha',
  khan: 'kaha',
  kon: 'kaun',
  koun: 'kaun',
  kaun: 'kaun',
  kn: 'kaun',
  kya: 'kya',
  kyaa: 'kya',
  kye: 'kya',
  ky: 'kyu',

  // Auxiliaries & Pronouns
  h: 'hai',
  hn: 'hai',
  he: 'hai',
  hain: 'hai',
  hai: 'hai',
  hnn: 'hai',
  tha: 'tha',
  thi: 'thi',
  the: 'the',
  hu: 'hu',
  hoon: 'hu',
  hun: 'hu',
  mein: 'mein',
  me: 'mein',
  mai: 'mein',
  main: 'mein',
  mera: 'mera',
  meri: 'meri',
  mere: 'mere',
  mre: 'mere',
  mri: 'meri',
  mra: 'mera',
  tera: 'tera',
  teri: 'teri',
  tere: 'tere',
  tumhara: 'tumhara',
  tumhari: 'tumhari',
  tumhare: 'tumhare',
  aap: 'aap',
  aapka: 'aapka',
  aapki: 'aapki',
  aapke: 'aapke',
  usne: 'usne',
  unhone: 'unhone',
  uska: 'uska',
  uski: 'uski',
  uske: 'uske',
  unka: 'unka',
  unki: 'unki',
  unke: 'unke',
  isne: 'isne',
  iska: 'iska',
  iski: 'iski',
  iske: 'iske',
  yeh: 'yeh',
  ye: 'yeh',
  woh: 'woh',
  wo: 'woh',
  kuch: 'kuch',
  kuchh: 'kuch',
  koi: 'koi',
  sb: 'sab',
  sbb: 'sab',
  sab: 'sab',

  // Negations & Affirmations
  nhi: 'nahi',
  nhn: 'nahi',
  nai: 'nahi',
  na: 'nahi',
  nahi: 'nahi',
  nahin: 'nahi',
  ni: 'nahi',
  hnji: 'haan',
  hanji: 'haan',
  ha: 'haan',
  haan: 'haan',
  haa: 'haan',
  hnnji: 'haan',
  thik: 'theek',
  theek: 'theek',
  thk: 'theek',
  sahi: 'sahi',
  accha: 'achha',
  acha: 'achha',
  achha: 'achha',
  achaa: 'achha',

  // Verbs & Continuous markers
  rha: 'raha',
  raha: 'raha',
  rhe: 'rahe',
  rahe: 'rahe',
  rhi: 'rahi',
  rahi: 'rahi',
  kr: 'kar',
  kar: 'kar',
  krr: 'kar',
  kru: 'karu',
  karo: 'karo',
  kare: 'kare',
  karein: 'karein',
  karu: 'karu',
  karun: 'karu',
  krna: 'karna',
  karna: 'karna',
  krne: 'karne',
  karne: 'karne',
  hoga: 'hoga',
  hogi: 'hogi',
  honge: 'honge',
  hogyi: 'ho gayi',
  hogaya: 'ho gaya',
  hogya: 'ho gaya',
  gya: 'gaya',
  gaya: 'gaya',
  gyi: 'gayi',
  gayi: 'gayi',
  gye: 'gaye',
  gaye: 'gaye',
  gir: 'gir',
  gira: 'gira',
  giri: 'giri',
  gire: 'gire',
  smjh: 'samajh',
  samajh: 'samajh',
  samjh: 'samajh',
  aara: 'aa raha',
  aarha: 'aa raha',
  aaraha: 'aa raha',
  bol: 'bola',
  bola: 'bola',
  boli: 'boli',
  bole: 'bole',
  btaya: 'bataya',
  bataya: 'bataya',
  // Conversational Verbs, Prompts & Auxiliaries
  bataiye: 'bataiye',
  batao: 'batao',
  bata: 'batao',
  btao: 'batao',
  btayein: 'bataiye',
  bataiyein: 'bataiye',
  boliye: 'boliye',
  bolo: 'bolo',
  suno: 'suno',
  sun: 'suno',
  samjhao: 'samjhao',
  samjho: 'samjho',
  dekho: 'dekho',
  dekh: 'dekho',
  dekhna: 'dekhna',
  chahiye: 'chahiye',
  chahie: 'chahiye',
  chahe: 'chahe',
  chahiyein: 'chahiye',
  chahiyea: 'chahiye',
  chahiyehe: 'chahiye',
  karta: 'karta',
  karti: 'karti',
  karte: 'karte',
  karunga: 'karunga',
  karungi: 'karungi',
  rahega: 'rahega',
  rahegi: 'rahegi',
  aana: 'aana',
  jaana: 'jaana',
  aao: 'aao',
  jaao: 'jaao',
  baitho: 'baitho',
  baithiye: 'baithiye',
  piyo: 'piyo',
  pijiye: 'pijiye',
  lelo: 'lelo',
  dena: 'dena',
  rakho: 'rakho',
  rakhiye: 'rakhiye',

  // Temporal, Adverbs & Conjunctions
  phir: 'phir',
  fir: 'phir',
  fr: 'phir',
  abhi: 'abhi',
  ab: 'ab',
  pehle: 'pehle',
  phle: 'pehle',
  baad: 'baad',
  tab: 'tab',
  jab: 'jab',
  toh: 'toh',
  to: 'toh',
  aur: 'aur',
  ya: 'ya',
  lekin: 'lekin',
  magar: 'magar',
  isliye: 'isliye',
  kyunki: 'kyunki',
  kyuki: 'kyunki',
  kripya: 'kripya',
  kripyaa: 'kripya',
  thoda: 'thoda',
  thodi: 'thodi',
  thode: 'thode',
  zara: 'zara',
  jara: 'zara',
  bohot: 'bohot',
  bahut: 'bohot',
  bhot: 'bohot',
  bilkul: 'bilkul',
  blkl: 'bilkul',
  zyada: 'zyada',
  jyada: 'zyada',
  kam: 'kam',

  // Pronouns & Possessives
  hum: 'hum',
  hamara: 'hamara',
  hamari: 'hamari',
  hamare: 'hamare',
  apna: 'apna',
  apni: 'apni',
  apne: 'apne',
  mujhe: 'mujhe',
  mujhko: 'mujhe',
  mjhe: 'mujhe',
  tujhe: 'tujhe',
  tjhe: 'tujhe',
  inhone: 'inhone',

  // Nouns & Entities
  shadi: 'shadi',
  shaadi: 'shadi',
  vivah: 'shadi',
  sadi: 'shadi',
  career: 'career',
  carer: 'career',
  carrier: 'career',
  naukri: 'job',
  nokri: 'job',
  job: 'job',
  paisa: 'paisa',
  paise: 'paise',
  money: 'paisa',
  dhan: 'paisa',
  gf: 'girlfriend',
  girlfriend: 'girlfriend',
  bf: 'boyfriend',
  boyfriend: 'boyfriend',
  dil: 'dil',
  man: 'mann',
  mann: 'mann',
  bechain: 'bechain',
  bechaini: 'bechaini',
  dhadak: 'dhadak',
  dhaadak: 'dhadak',
  dhadkne: 'dhadakne',
  dhadkane: 'dhadakne',
  dhadakna: 'dhadakne',
  dhadakne: 'dhadakne',
  dhaadakne: 'dhadakne',
  dhadkan: 'dhadak',
  daru: 'daru',
  daaru: 'daru',
  sharāb: 'daru',
  road: 'road',
  sadak: 'road',
  kharab: 'kharab',
  khrb: 'kharab',
  chot: 'chot',
  pain: 'dard',
  dard: 'dard',
  tension: 'tension',
  stress: 'tension',
  gussa: 'gussa',
  gusse: 'gussa',
  mood: 'mood',
  scene: 'scene',
  ghar: 'ghar',
  wale: 'wale',
  gharwale: 'gharwale',
  parivar: 'parivar',
  maan: 'maan',
  raazi: 'raazi',
  mummy: 'mummy',
  papa: 'papa',
  parents: 'parents',
  rishta: 'rishta',
  rishte: 'rishte',
  baat: 'baat',
  bhai: 'bhai',
  bhaiya: 'bhai',
  bro: 'bhai',
  yar: 'yaar',
  yaar: 'yaar',
  waise: 'waise',
  wese: 'waise',
  vaise: 'waise',
  kal: 'kal',
  aaj: 'aaj',
  aj: 'aaj',
  parso: 'parso',
  din: 'din',
  raat: 'raat',
  sex: 'sex',
  kaam: 'kaam',
  vasna: 'vasna',
  sambhog: 'sambhog',
  ladai: 'ladai',
  jhagda: 'jhagda',
  office: 'office',
  saans: 'saans',
  paani: 'paani',
  pani: 'paani',
  college: 'college',
  admission: 'admission',
  padhai: 'padhai',
  padhna: 'padhna',
  shiksha: 'shiksha',
  vidya: 'vidya',
  school: 'school',
  university: 'university',
  exam: 'exam',
  exams: 'exam',
  entrance: 'entrance',
  result: 'result',
  rank: 'rank',
  stream: 'stream',
};

// Patterns where two concatenated words need splitting (e.g. 'roadnky', 'shadikab', 'jobkab', 'girgaya')
const CONCATENATED_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\broadnkyu?\b/gi, replacement: 'road kyu' },
  { pattern: /\broadnky\b/gi, replacement: 'road kyu' },
  { pattern: /\broadpe\b/gi, replacement: 'road pe' },
  { pattern: /\broadmein\b/gi, replacement: 'road mein' },
  { pattern: /\broadpar\b/gi, replacement: 'road par' },
  { pattern: /\bshadikab\b/gi, replacement: 'shadi kab' },
  { pattern: /\bshaadikab\b/gi, replacement: 'shadi kab' },
  { pattern: /\bjobkab\b/gi, replacement: 'job kab' },
  { pattern: /\bcareerkaisa\b/gi, replacement: 'career kaisa' },
  { pattern: /\bkyuhua\b/gi, replacement: 'kyu hua' },
  { pattern: /\bgirgaya\b/gi, replacement: 'gir gaya' },
  { pattern: /\bgirgya\b/gi, replacement: 'gir gaya' },
  { pattern: /\bmerishadi\b/gi, replacement: 'meri shadi' },
  { pattern: /\bmerishaadi\b/gi, replacement: 'meri shadi' },
  { pattern: /\bkabkarein\b/gi, replacement: 'kab karein' },
  { pattern: /\baajkaisa\b/gi, replacement: 'aaj kaisa' },
  { pattern: /\bmoodoff\b/gi, replacement: 'mood off' },
  { pattern: /\bdilbechain\b/gi, replacement: 'dil bechain' },
  { pattern: /\bdaruka\b/gi, replacement: 'daru ka' },
  { pattern: /\busnereply\b/gi, replacement: 'usne reply' },
  { pattern: /\bcollegemein\b/gi, replacement: 'college mein' },
  { pattern: /\badmissionkab\b/gi, replacement: 'admission kab' },
  { pattern: /\bpadhaikab\b/gi, replacement: 'padhai kab' },
  { pattern: /\bkyakaru\b/gi, replacement: 'kya karu' },
  { pattern: /\bsamajhnahi\b/gi, replacement: 'samajh nahi' },
  { pattern: /\baajmere\b/gi, replacement: 'aaj mere' },
  { pattern: /\bkuchachha\b/gi, replacement: 'kuch achha' },
  { pattern: /\bhogakya\b/gi, replacement: 'hoga kya' },
];

/**
 * Collapses 3+ identical consecutive letters to max 2 letters.
 * e.g., 'soooch' -> 'soch', 'haaaan' -> 'haan', 'kbbbb' -> 'kb'
 */
function collapseRepeatedLetters(text: string): string {
  return text.replace(/(.)\1{2,}/gi, '$1$1');
}

export const messageNormalizer = {
  normalize(rawMessage: string): NormalizedMessageResult {
    const original = rawMessage ? rawMessage.trim() : '';
    if (!original) {
      return {
        rawMessage: '',
        normalizedMessage: '',
        original: '',
        normalized: '',
        tokens: [],
        detectedLanguage: 'en',
        corrections: {},
        hasTypoOrSlang: false,
      };
    }

    const corrections: Record<string, string> = {};
    let processed = original.toLowerCase();

    // 1. Collapse excessive repeated characters (e.g. 'plsssss' -> 'plss')
    const collapsed = collapseRepeatedLetters(processed);
    if (collapsed !== processed) {
      processed = collapsed;
    }

    // 2. Fix known concatenated word combos (e.g. 'roadnky' -> 'road kyu')
    for (const { pattern, replacement } of CONCATENATED_PATTERNS) {
      if (pattern.test(processed)) {
        const matched = processed.match(pattern)?.[0];
        if (matched) {
          corrections[matched] = replacement;
        }
        processed = processed.replace(pattern, replacement);
      }
    }

    // 3. Remove punctuation except essential symbols, split into tokens
    const cleanPunctuation = processed.replace(/[^\w\s\u0900-\u097F]/g, ' ');
    const rawTokens = cleanPunctuation.split(/\s+/).filter(Boolean);

    // 4. Token-by-token canonical dictionary normalization
    const normalizedTokens: string[] = [];
    let hinglishWordCount = 0;
    let englishWordCount = 0;

    for (const token of rawTokens) {
      const canonical = HINGLISH_DICTIONARY[token];
      if (canonical) {
        if (canonical !== token) {
          corrections[token] = canonical;
        }
        // Canonical might be multiple words (e.g. 'aara' -> 'aa raha')
        const parts = canonical.split(/\s+/);
        normalizedTokens.push(...parts);
        hinglishWordCount++;
      } else {
        normalizedTokens.push(token);
        if (/^[a-z]+$/.test(token)) {
          englishWordCount++;
        }
      }
    }

    const normalized = normalizedTokens.join(' ');
    const hasTypoOrSlang = Object.keys(corrections).length > 0;

    // Detect language: Devanagari -> 'hi', Hinglish vs English grammar tokens
    let detectedLanguage: 'en' | 'hi' | 'hinglish' = 'en';
    const isEnglishSentence = /^(what|when|where|why|how|who|which|is|are|can|could|would|should|will|do|does|did|tell|please|i am|i have|my|can you|could you)\b/i.test(original.trim());

    if (/[\u0900-\u097F]/.test(original)) {
      detectedLanguage = 'hi';
    } else if (isEnglishSentence && englishWordCount >= hinglishWordCount) {
      detectedLanguage = 'en';
    } else if (
      hinglishWordCount > 0 ||
      /^(ha|haan|nahi|kya|kyu|kab|kaisa|kaisi|kaise|mera|meri|mere|tera|teri|tere|aap|aapka|aapki|aapke|dil|mann|bhai|yaar|waise|aaj|kal|batao|bataiye|suno|dekho|chahiye|ab|abhi|phir|fir|theek|sahi|achha)\b/i.test(normalized) ||
      /\b(hai|hain|hoon|tha|thi|the|raha|rahi|rahe|karo|karein|karna|hoga|hogi|mein|par|pe|se|ko|ka|ki|ke)\b/i.test(normalized)
    ) {
      detectedLanguage = 'hinglish';
    }

    return {
      rawMessage: original,
      normalizedMessage: normalized,
      original,
      normalized,
      tokens: normalizedTokens,
      detectedLanguage,
      corrections,
      hasTypoOrSlang,
    };
  },
};
