import { CoreIntent } from './intentTypes';

export interface IntentMatcher {
  intent: CoreIntent;
  patterns: RegExp[];
  requiresClarification?: boolean;
}

export const INTENT_MATCHERS: IntentMatcher[] = [
  // 1. Safety First (Immediate Priority)
  {
    intent: CoreIntent.CRISIS_SELF_HARM,
    patterns: [
      /\b(suicide|kill myself|end my life|want to die|mar jau|zindagi khatam|jeena nahi chahta|marne ka man)\b/i,
      /(आत्महत्या|मरना चाहता|जान देना|जीना नहीं चाहता)/,
    ],
  },
  {
    intent: CoreIntent.UNSAFE_PREDICTION,
    patterns: [
      /\b(will i die|kab marunga|death date|when will i die|aayu kitni hai|kab mrityu hogi|exact date of death)\b/i,
      /(कब मरूंगा|मृत्यु कब होगी|मौत कब होगी|आयु कितनी है)/,
    ],
  },
  {
    intent: CoreIntent.MEDICAL_QUERY,
    patterns: [
      /\b(cancer|tumor|heart attack|bimari|disease|diagnose|cure my disease|dawai|doctor|treatment)\b/i,
      /(बीमारी|कैंसर|इलाज|दवाई|डॉक्टर)/,
    ],
  },

  // 2. Greetings & Conversational Intake
  {
    intent: CoreIntent.GREETING_INTAKE,
    patterns: [
      /^(hi|hello|hey|heya|good morning|good evening|good afternoon|namaste|pranam|namaskar|pranaam|radhe radhe|jai shri krishna|jai shree ram|pranam pandit ji|pranam guruji|pranam acharya ji|pranam acharyaji|namaste pandit ji|namaste acharya ji)[!.,\s]*$/i,
      /^(प्रणाम|नमस्ते|नमस्कार|राधे राधे|जय श्री कृष्णा|जय श्री राम|सुप्रभात|प्रणाम आचार्य जी|प्रणाम गुरुजी)[!.,\s]*$/,
      /\b(pranam acharya ji|pranam guruji|namaste acharya ji|namaste pandit ji|radhe radhe acharya ji)\b/i,
    ],
  },

  // 2b. Short Conversational Acknowledgments (Haan, Achha, Hmm, OK)
  {
    intent: CoreIntent.SHORT_ACKNOWLEDGMENT,
    patterns: [
      /^(haan|ha|haa|h|achha|achha ji|acha|theek hai|thik hai|thik|theek|hmm|hmmm|hmmmm|ok|okay|k|yes|yep|sure|got it|samajh gaya|samajh gayi|samajh gaya ji)[!.,\s]*$/i,
      /^(हाँ|हां|अच्छा|ठीक है|हम्म|समझ गया|समझ गई|जी)[!.,\s]*$/,
    ],
  },

  // 2c. Ambiguous Emotions & Physiological Sensations ("Dil dhadkne laga", "Confused hoon", "daru ka mann", etc.)
  {
    intent: CoreIntent.AMBIGUOUS_EMOTION,
    requiresClarification: true,
    patterns: [
      /\b(dil dhadak|dil dhadkne|dhadkan|heart racing|dil tez|heart beat|heartbeat|dil ghabra|mann ghabra)\b/i,
      /\b(main bahut confused hoon|bahut confused hoon|confused hoon|kuch samajh nahi aa raha|mujhe samajh nahi aa raha|sab kharab ho raha|sab kharab lag raha|bahut anxiety|anxiety ho rahi|bechaini ho rahi|mann ashant)\b/i,
      /\b(daru|daaru|beer|alcohol|sharab|sharaab|peene ka man|peene ka mann|daru ka man|daru ka mann|daaru ka man|daaru ka mann|daru peene|party karne|chill karne)\b/i,
      /\b(bore ho raha|mood off|mood kharab|man nahi lag raha|mann nahi lag raha|aaj man udaas|aaj mann udas|thak gaya|thakan ho rahi|neend nahi aa rahi)\b/i,
      /(दिल धड़कने लगा|दिल धड़क रहा|दिल की धड़कन|घबराहट हो रही|बेचैन हूं|बहुत कन्फ्यूज हूं|कुछ समझ नहीं आ रहा|सब खराब हो रहा|दारू का मन|शराब पीने का मन|मूड खराब|बोर हो रहा|मन नहीं लग रहा|नींद नहीं आ रही)/,
    ],
  },

  // 2d. Casual Pleasantries, Venting & Thanks
  {
    intent: CoreIntent.CASUAL_CHAT,
    patterns: [
      /^(thanks|thank you|shukriya|dhanyawad|dhanyavaad|kya haal hai|how are you|kaise ho|aap kaise hain|aur batao|kya chal raha hai|kya chal raha|kuch nahi|bas aise hi)[!.,\s]*$/i,
      /^(धन्यवाद|शुक्रिया|आप कैसे हैं|क्या हाल है|और बताओ|कुछ नहीं|बस ऐसे ही)[!.,\s]*$/,
      /\b(aur batao|kya haal chaal|sab theek|kuch sunao|kuch baat karo)\b/i,
    ],
  },

  // 3. Career Confusion & Ambiguity (Requires Clarification)
  {
    intent: CoreIntent.CAREER_DECISION,
    requiresClarification: true,
    patterns: [
      /\b(confused about my career|career me confusion|career confusion|career.*confused|samajh nahi aa raha career|kya karu career me|career me kya karu)\b/i,
      /(करियर में कन्फ्यूजन|करियर को लेकर असमंजस|करियर में क्या करूं)/,
    ],
  },

  // 4. Period Forecasts (6 months / 1 year)
  {
    intent: CoreIntent.PERIOD_FORECAST_6M,
    patterns: [
      /\b(next 6 months|coming 6 months|next 6 month|agle 6 mahine|agle 6 mahino|6 months look like|6 month forecast)\b/i,
      /(अगले 6 महीने|अगले छह महीने)/,
    ],
  },
  {
    intent: CoreIntent.PERIOD_FORECAST_1Y,
    patterns: [
      /\b(next year|coming year|agle saal|next 1 year|1 year forecast|this year forecast)\b/i,
      /(अगले साल|आने वाले साल)/,
    ],
  },

  // 3. Memory Recall & Continuity Queries
  {
    intent: CoreIntent.MEMORY_RECALL_QUERY,
    patterns: [
      /\b(remember (that|when)|we (talked|discussed|spoke) about|jo baat ki thi|pichhli baar|yaad hai|last time we|jo discussion kiya tha|woh jo tumne last time bola tha|jo pehle bataya tha)\b/i,
      /(पिछली बार|याद है|हमने बात की थी|जो पहले बताया था)/,
    ],
  },

  // 4. Marriage Timing (Handles all permutations including reversed word order)
  {
    intent: CoreIntent.MARRIAGE_TIMING,
    patterns: [
      // Hinglish permutations: "shadi kab", "kab ... shadi", "vivah kab", "kab ... vivah"
      /\b(shadi|shaadi|vivah|marriage|wedding|rishta)\b.*\b(kab|when|yog|timing|age|umar|date|window|saal|year)\b/i,
      /\b(kab|when|kis age|kis umar|kab tak)\b.*\b(shadi|shaadi|vivah|marriage|wedding|biyah|byah)\b/i,
      /\b(when will i (get )?marry|when is my marriage|when will i get married|marriage timing|wedding timing)\b/i,
      /\b(shaadi ka yog|shadi ka yog|vivah yog|shadi hone ke chance|shadi ke chances)\b/i,
      // Devanagari Hindi
      /(शादी|विवाह|ब्याह).*(कब|योग|मुहूर्त|समय|उम्र|आयु)/,
      /(कब|किस उम्र में).*(शादी|विवाह)/,
    ],
  },

  // 5. Marriage Prospects & Nature
  {
    intent: CoreIntent.MARRIAGE_PROSPECTS,
    patterns: [
      /\b(love (marriage )?ya arranged|arranged (marriage )?ya love|love or arranged|love marriage hogi ya arranged|arrange marriage hogi ya love)\b/i,
      /\b(shadi me delay|shaadi me deri|marriage delay|late marriage|shadi kyu nahi ho rahi|delay kyu hai)\b/i,
      /(लव मैरिज या अरेंज्ड|अरेंज मैरिज|शादी में देरी|विवाह में विलंब|लव मैरिज होगी या अरेंज)/,
    ],
  },

  // 6. Partner Characteristics
  {
    intent: CoreIntent.PARTNER_CHARACTERISTICS,
    patterns: [
      /\b(jeevansathi kaisa|partner kaisa|spouse nature|partner characteristics|husband kaisa|wife kaisi|who will i marry|life partner)\b/i,
      /(जीवनसाथी कैसा|पति कैसा|पत्नी कैसी|जीवनसाथी का स्वभाव)/,
    ],
  },

  // 7. Relationship Conflict & Today's Discord (Interpersonal Conflict)
  {
    intent: CoreIntent.RELATIONSHIP_CONFLICT,
    patterns: [
      // Conflict terms
      /\b(ladai|ladayi|jhagda|fight|argument|conflict|kalesh|unban|anban)\b.*\b(kyu|why|reason|aaj|today|partner|gf|girlfriend|bf|boyfriend|wife|husband|patni|pati)\b/i,
      /\b(kyu|why|aaj|today)\b.*\b(ladai|ladayi|jhagda|fight|argument|conflict|kalesh|unban|anban)\b/i,
      /\b(aaj ladai|aaj jhagda|ladai kyu|jhagda kyu)\b/i,
      // Silence / Non-communication / Breakup
      /\b(girlfriend|gf|boyfriend|bf|partner|wife|husband|patni|pati|woh|wo)\b.*\b(baat nahi|not talking|door|cheat|dhokha|block|breakup|naraz|gussa)\b/i,
      /\b(baat nahi kar rah|baat nahi ho rahi|breakup ho gaya|patch up|rishte me problem|relationship issue|door ho gaya|door ho gayi|naraz hai)\b/i,
      /(लड़ाई|झगड़ा|अनबन|विवाद|बात नहीं कर रही|बात नहीं कर रहा|ब्रेकअप|नाराज|गुस्सा|आज लड़ाई क्यों हुई|लड़ाई क्यों)/,
    ],
  },

  // 8. Relationship Compatibility
  {
    intent: CoreIntent.RELATIONSHIP_COMPATIBILITY,
    patterns: [
      /\b(compatibility|kundli milan|gun milan|kya meri shadi isse|match score|are we compatible|kundali milan)\b/i,
      /(कुंडली मिलान|गुण मिलान|संगतता|मैच स्कोर)/,
    ],
  },

  // 9. Love Life & Finding a Partner
  {
    intent: CoreIntent.LOVE_LIFE,
    patterns: [
      /\b(find someone|find love|find a partner|never find|love life|pyaar milega|true love|koi pasand hai|relationship future|relationship chalega|chalega relationship|future of relationship|akela reh|akeli reh|single kab tak)\b/i,
      /(प्यार मिलेगा|सच्चा प्यार|अकेला रहूंगा|कोई मिलेगा|लव लाइफ|रिलेशनशिप चलेगा|रिश्ता चलेगा)/,
    ],
  },

  // 10. Job Change & Career Decision
  {
    intent: CoreIntent.JOB_CHANGE,
    patterns: [
      /\b(job change|switch job|nayi naukri|nayi job|switch field|job switch|job badlu|naukri badlu|change karu job|badlav karu|career change)\b/i,
      /\b(should i change (my )?job|job change karu ya nahi|job chhod du)\b/i,
      /(नौकरी बदलूं|जॉब चेंज|नई नौकरी|नौकरी छोड़ दूं|करियर में बदलाव|नौकरी में बदलाव)/,
    ],
  },

  // 11. Career Timing (When will I get a job)
  {
    intent: CoreIntent.CAREER_TIMING,
    patterns: [
      /\b(job|naukri|placement|interview|career)\b.*\b(kab|when|lagi|milegi|timing|window)\b/i,
      /\b(kab|when)\b.*\b(job|naukri|placement|selection|promotion)\b/i,
      /\b(kab lagegi naukri|job kab milegi|naukri kab milegi|placement kab hoga|job kab lagegi)\b/i,
      /(नौकरी कब लगेगी|जॉब कब मिलेगी|प्लेसमेंट कब होगा|जॉब कब|नौकरी कब)/,
    ],
  },

  // 12. Promotion & Growth
  {
    intent: CoreIntent.PROMOTION_GROWTH,
    patterns: [
      /\b(promotion|appraisal|career growth|tarakki|senior post|hike|salary hike)\b/i,
      /(पदोन्नति|प्रमोशन|तरक्की|सैलरी हाइक)/,
    ],
  },

  // 13. Business & Entrepreneurship
  {
    intent: CoreIntent.BUSINESS_VENTURE,
    patterns: [
      /\b(business karu|startup|vyapar|dukan|business success|business me fayda|business mein growth|business growth|growth in business|apna kaam shuru)\b/i,
      /(व्यापार|बिजनेस|नया काम|स्टार्टअप|दुकान|बिजनेस में ग्रोथ|व्यापार में वृद्धि)/,
    ],
  },

  // 14. Compound Queries (Priority before broad domains)
  {
    intent: CoreIntent.COMPOUND_MARRIAGE_CAREER,
    patterns: [
      /\b(shaadi ke baad career|marriage.*impact on career|after marriage.*career|career.*after marriage|shadi ke baad job|vivah ke baad career|shaadi.*career|career.*shaadi)\b/i,
      /(शादी के बाद करियर|विवाह के बाद नौकरी|शादी.*करियर)/,
    ],
  },

  // 15. Career General
  {
    intent: CoreIntent.CAREER_GENERAL,
    patterns: [
      /\b(career|job|naukri|profession|work life|kaam dhandha|mera career kaisa)\b/i,
      /(करियर|नौकरी|व्यवसाय|काम धंधा|करियर कैसा रहेगा)/,
    ],
  },

  // 16. Finances & Debt
  {
    intent: CoreIntent.DEBT_EXPENSES,
    patterns: [
      /\b(karz|loan|debt|kharche|heavy expenses|paisa ruk nahi raha|loss ho gaya|udhaar)\b/i,
      /(कर्ज|उधार|खर्च|नुकसान|लोन)/,
    ],
  },
  {
    intent: CoreIntent.INVESTMENT_GUIDANCE,
    patterns: [
      /\b(stock market|invest|mutual fund|crypto|share market|trading|gold buy)\b/i,
      /(निवेश|शेयर बाजार|ट्रेडिंग)/,
    ],
  },
  {
    intent: CoreIntent.WEALTH_TIMING,
    patterns: [
      /\b(paisa|paise|wealth|dhan|income|aarthik)\b.*\b(kab|when|improve|badhega|sudhregi|sudhar)\b/i,
      /\b(paise kab improve|dhan labh kab|wealth timing|rich kab|aarthik sthiti kab sudhregi|paise ki sthiti kab sudhregi)\b/i,
      /(पैसे कब बढ़ेंगे|धन लाभ कब|आर्थिक स्थिति कब सुधरेगी|पैसे की स्थिति कब सुधरेगी|पैसे कब)/,
    ],
  },
  {
    intent: CoreIntent.FINANCE_GENERAL,
    patterns: [
      /\b(money|wealth|paisa|paise|dhan|finance|financial future|financial condition)\b/i,
      /(धन|पैसा|आर्थिक स्थिति|फाइनेंस)/,
    ],
  },

  // 17. Daily Horoscope & Today's Guidance
  {
    intent: CoreIntent.TODAY_GUIDANCE,
    patterns: [
      /\b(aaj ka din kaisa|today horoscope|aaj ka rashifal|today rashifal|how is my day today|aaj kaisa rahega)\b/i,
      /(आज का दिन कैसा|आज का राशिफल|आज कैसा रहेगा)/,
    ],
  },
  {
    intent: CoreIntent.DAILY_LUCKY_FACT,
    patterns: [
      /\b(lucky colou?r|shubh rang|lucky number|shubh ank|lucky time|shubh samay|shubh muhurat)\b/i,
      /(शुभ रंग|लकी कलर|शुभ अंक|लकी नंबर|शुभ मुहूर्त)/,
    ],
  },

  // 18. Education & Foreign Travel
  {
    intent: CoreIntent.EDUCATION_HIGHER_STUDIES,
    patterns: [
      /\b(master'?s|higher studies|post graduation|phd|mba|higher education|padhai|admission|college|degree)\b/i,
      /(उच्च शिक्षा|मास्टर्स|पढ़ाई|एडमिशन|कॉलेज)/,
    ],
  },
  {
    intent: CoreIntent.FOREIGN_TRAVEL_SETTLEMENT,
    patterns: [
      /\b(abroad|foreign|videsh|visa|foreign settlement|foreign travel|bahar jane ka yog|videsh yatra)\b/i,
      /(विदेश यात्रा|विदेश सेटलमेंट|वीजा|विदेश)/,
    ],
  },

  // 19. Health & Vitality
  {
    intent: CoreIntent.HEALTH_VITALITY,
    patterns: [
      /\b(health|swasthya|tabiyat|sehat|vitality|physical health|energy level)\b/i,
      /(स्वास्थ्य|तबीयत|सेहत|ऊर्जा)/,
    ],
  },

  // 20. Property & Vehicle
  {
    intent: CoreIntent.PROPERTY_VEHICLE,
    patterns: [
      /\b(ghar khareedna|makaan|property|zameen|new house|buy home|buy flat|gaadi|vehicle|car khareedna)\b/i,
      /(घर खरीदना|मकान|प्रॉपर्टी|गाड़ी|जमीन)/,
    ],
  },

  // 21. Astrological Periods & Remedies
  {
    intent: CoreIntent.DASHA_ANALYSIS,
    patterns: [
      /\b(mahadasha|antardasha|current dasha|shani ki dasha|rahu dasha|guru dasha|sade sati)\b/i,
      /(महादशा|अंतर्दशा|साढ़े साती|राहु दशा|शनि दशा)/,
    ],
  },
  {
    intent: CoreIntent.REMEDIES_UPAY,
    patterns: [
      /\b(upay|remedy|remedies|graha shanti|puja|mantra|gemstone|ratna)\b/i,
      /(उपाय|शांति|रत्न|मंत्र|पूजा)/,
    ],
  },
  {
    intent: CoreIntent.GENERAL_LIFE_READING,
    patterns: [
      /\b(life me kya chal raha|general reading|overall life|kundli dekhein|chart analysis|bhavishya|mere baare mein batao|kundli dekho)\b/i,
      /(कुंडली देखें|भविष्य कैसा रहेगा|जीवन में क्या चल रहा|मेरे बारे में बताओ)/,
    ],
  },
];
