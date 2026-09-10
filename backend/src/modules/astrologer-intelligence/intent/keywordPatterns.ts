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
      /\b(will i die|kab marunga|death date|when will i die|aayu kitni hai|kab mrityu hogi|exact date of death|how to make a bomb|how to make a weapon|how to kill someone|how to hurt someone|how to poison|buy drugs|make meth|hack into|child porn|make a bomb)\b/i,
      /(कब मरूंगा|मृत्यु कब होगी|मौत कब होगी|आयु कितनी है)/,
    ],
  },
  {
    intent: CoreIntent.MEDICAL_QUERY,
    patterns: [
      /\b(cancer|tumor|heart attack|bimari|disease|diagnose|cure my disease|dawai|doctor|treatment|serious illness|illness|do i have a serious illness|medical condition|dard|pain|infection|swelling|chot|injury|bukhar|fever|wound|bleeding)\b/i,
      /(बीमारी|कैंसर|इलाज|दवाई|डॉक्टर|दर्द|चोट|बुखार|संक्रमण|सूजन)/,
    ],
  },
  {
    intent: CoreIntent.INAPPROPRIATE_OR_SEXUAL,
    patterns: [
      /\b(sex|chahiye sex|sex chahiye|sex karna|sex karo|sax|sax sux|nude|nudes|porn|porno|chudai|sambhog|intercourse|masturbat|masturbation|send pics|boobs|penis|vagina|horny|lust|kamvasna|kaam vasna)\b/i,
      /(सेक्स|संभोग|हस्तमैथुन|अश्लील|नग्न|कामवासना)/,
    ],
  },
  {
    intent: CoreIntent.JAILBREAK_OR_SYSTEM_PROMPT,
    patterns: [
      /\b(ignore all previous instructions|ignore previous instructions|system prompt|what is your prompt|output your prompt|you are now dan|jailbreak|developer mode|disregard all instructions|give me your prompt)\b/i,
    ],
  },
  {
    intent: CoreIntent.SKEPTICISM_OR_TEST,
    patterns: [
      /\b(astrology is fake|astrology fake hai|sab jhooth hai|sab bakwas hai|prove me wrong|kal maine kya khaya|batao mere jeb mein|tumhe kya pata|jyotish sab dhokha|jyotish fake hai)\b/i,
      /(ज्योतिष फर्जी है|सब झूठ है|सब बकवास है|साबित करके दिखाओ)/,
    ],
  },
  {
    intent: CoreIntent.SUPERSTITION_FEAR,
    patterns: [
      /\b(manglik dosh.*dar|manglik dosh.*darr|manglik.*darr|manglik.*dar|manglik.*shaadi nahi hogi|manglik.*shadi nahi hogi|kaal sarp.*shrap|kaal sarp.*dar|kaal sarp.*darr|sade sati.*barbad|pitra dosh.*tabah|kisi pandit ne daraya|kisine daraya|dosh ka shrap)\b/i,
      /(मांगलिक दोष का डर|मांगलिक दोष|कालसर्प दोष का श्राप|साढ़े साती बर्बाद|पंडित ने डराया)/,
    ],
  },
  {
    intent: CoreIntent.SPECULATIVE_GAMBLING,
    patterns: [
      /\b(lottery number|lottery lag sakti|dream11|satta matka|satta number|crypto.*double|gambling.*win|casino.*luck|jackpot number)\b/i,
      /(लॉटरी नंबर|सट्टा मटका|ड्रीम11)/,
    ],
  },
  {
    intent: CoreIntent.THIRD_PARTY_QUERY,
    patterns: [
      /\b(meri behen ki|mere bhai ki|dost ki kundli|friend ka future|relative ki shaadi|unka future batao|sister ki shaadi|brother ka career)\b/i,
      /(मेरी बहन की|मेरे भाई की|दोस्त की कुंडली|उनका भविष्य)/,
    ],
  },

  // Round 4 Adversarial Challenges & Inquiries
  {
    intent: CoreIntent.PREVIOUS_ANSWER_CHALLENGE,
    patterns: [
      /\b(tumne last time|tumne pichli baar|last time.*kuch aur|pichhli baar.*bola tha|pichli baar.*2027|ab 2028 kyu|har baar saturn|har baar shani|pichli reading alag thi|tumne pehle kuch aur bola|last time alag tha)\b/i,
      /(पिछली बार कुछ और बोला|पिछली बार 2027|अब 2028 क्यों|हर बार शनि ही क्यों|पहले कुछ और बताया था)/,
    ],
  },
  {
    intent: CoreIntent.GENERIC_ANSWER_CHALLENGE,
    patterns: [
      /\b(generic lag raha|sabko yahi bolte|common answer|ye toh sabko bol|actual batao|specific batao|sabko ek hi baat|ye toh copy paste|general gyaan|generic answer)\b/i,
      /(जेनेरिक लग रहा|सबको यही बोलते हो|कॉमन जवाब|असली बताओ|स्पेसिफिक बताओ|सबको एक ही बात)/,
    ],
  },
  {
    intent: CoreIntent.SARCASM_OR_MOCKERY,
    patterns: [
      /\b(wah kya answer|google pe bhi mil|google pe mil jayega|tum bhi na|kya baat hai pandit ji|kya mast joke|bohot bada pandit|itna toh mujhe bhi pata)\b/i,
      /(वाह क्या जवाब दिया|गूगल पर भी मिल जाएगा|इतना तो मुझे भी पता|क्या बात है पंडित जी)/,
    ],
  },
  {
    intent: CoreIntent.SHORT_ANSWER_DEMAND,
    patterns: [
      /\b(seedha answer|seedhe batao|bas yes ya no|yes ya no|short me bata|short mein bata|zyada gyaan mat|ek line me|ek line mein|to the point|seedha bolo|seedha bata)\b/i,
      /(सीधा जवाब दो|बस हाँ या ना|शॉर्ट में बताओ|एक लाइन में बताओ|सीधे बताओ|टू द पॉइंट)/,
    ],
  },
  {
    intent: CoreIntent.CERTAINTY_DEMAND,
    patterns: [
      /\b(pakka bata|100%|100 percent|exact date|guarantee hai|pakka hoga|guaranteed hai|haan ya na me bata|shart laga)\b/i,
      /(पक्का बताओ|100% गारंटी|सटीक तारीख|गारंटी है क्या|हाँ या ना में बोलो)/,
    ],
  },
  {
    intent: CoreIntent.CONTRADICTION_CORRECTION,
    patterns: [
      /\b(actually birth time|time galat tha|dob galat thi|girlfriend nahi ex|single hu.*gf nahi|gf nahi.*single|job nahi.*internship|shadi nahi hui.*single)\b/i,
      /(जन्म समय गलत था|गर्लफ्रेंड नहीं एक्स है|सिंगल हूँ|जॉब में नहीं इंटर्नशिप)/,
    ],
  },

  // 2. Greetings & Conversational Intake
  {
    intent: CoreIntent.GREETING_INTAKE,
    patterns: [
      /^(hi|hello|hey|heya|good morning|good evening|good afternoon|namaste|pranam|namaskar|pranaam|radhe radhe|jai shri krishna|jai shree ram|pranam pandit ji|pranam guruji|pranam acharya ji|pranam acharyaji|namaste pandit ji|namaste acharya ji|hello acharya ji|hi acharya ji|hello pandit ji|hi pandit ji)[!.,\s]*$/i,
      /^(प्रणाम|नमस्ते|नमस्कार|राधे राधे|जय श्री कृष्णा|जय श्री राम|सुप्रभात|प्रणाम आचार्य जी|प्रणाम गुरुजी|नमस्ते आचार्य जी)[!.,\s]*$/,
    ],
  },

  // 2b. Short Conversational Acknowledgments (Haan, Achha, Hmm, OK, Sahi, Oh, Nahi)
  {
    intent: CoreIntent.SHORT_ACKNOWLEDGMENT,
    patterns: [
      /^(haan|ha|haa|h|hn|achha|achha ji|acha|accha|theek hai|thik hai|thik|theek|achha theek hai|accha theek hai|acha theek hai|achha thik hai|hmm|hmmm|hmmmm|ok|okay|k|yes|yep|sure|got it|samajh gaya|samajh gayi|samajh gaya ji|sahi|sahi baat|oh|nahi|nhi|na|no)[!.,\s]*$/i,
      /^(हाँ|हां|अच्छा|ठीक है|अच्छा ठीक है|हम्म|समझ गया|समझ गई|जी|सही|ओह|नहीं|ना)[!.,\s]*$/,
    ],
  },

  // 2c. Dismissal or Discontinuation ("Nothing", "Kuch nahi", "Chhod", "Chhodo", "Rehne do")
  {
    intent: CoreIntent.DISMISSAL_OR_END,
    patterns: [
      /^(nothing|kuch nahi|kuch nhi|chhod|chhodo|chhod yaar|chhor|chhoro|rehne do|rehnde|rehnedo|leave it|never mind|nevermind|forget it|bas rehne do|kuch khas nahi)[!.,\s]*$/i,
      /^(कुछ नहीं|छोड़|छोड़ो|छोड़ यार|रहने दो|जाने दो|रहनेदे)[!.,\s]*$/,
    ],
  },

  // 2d. Continuation Prompt ("Boliye", "Bolo", "Bataiye", "Batao", "Suno")
  {
    intent: CoreIntent.CONTINUATION_PROMPT,
    patterns: [
      /^(boli|boliye|bolo|batao|bataiye|suno|sun raha hu|haan boliye|haan bolo|sunao|kaho|kahiye|sun rahe ho)[!.,\s]*$/i,
      /^(बोलिए|बोलो|बताइए|बताओ|सुनो|सुनाओ|कहो|सुन रहे हो)[!.,\s]*$/,
    ],
  },

  // 2e. Interrogative Follow-up ("Kab?", "Kyun?", "Kaise?", "Phir?", "Matlab?", "Aur?")
  {
    intent: CoreIntent.FOLLOW_UP_INTERROGATIVE,
    patterns: [
      /^(kab|kab tak|when|kyu|kyun|why|kaise|kaise hoga|how|phir|fir|then|what then|matlab|kya matlab|what do you mean|aur|aur phir|uske baad|aur uske baad)[?!.,\s]*$/i,
      /^(कब|कब तक|क्यों|कैसे|फिर|मतलब|और|उसके बाद|क्या मतलब)[?!.,\s]*$/,
    ],
  },

  // 2f. User Frustration or Abuse Handling ("Tu kya bakwas kar raha hai", "lawda", "chup kar")
  {
    intent: CoreIntent.FRUSTRATION_OR_ABUSE,
    patterns: [
      /\b(lawda|lauda|loda|chutiya|chutiye|gandu|gaandu|bhosdike|bhosadi|madarchod|motherfucker|chup kar|bakwas|bakwaas|tu kya bakwas|kya bakwas hai|shut up|stupid|idiot|harami|kamine|bewakoof|kya bakwaas kar raha|pagal hai kya|dimag mat khao)\b/i,
      /(बकवास कर रहा|क्या बकवास|चुप कर|लौड़ा|चूतिया|गांडू|मादरचोद|भोसड़ीके|हरामी|बेवकूफ|पागल है क्या)/,
    ],
  },

  // 2g. Ambiguous Emotions & Physiological Sensations ("Dil bechain hai", "Dil dhadkne laga", "Confused hoon", "daru ka mann", etc.)
  {
    intent: CoreIntent.AMBIGUOUS_EMOTION,
    requiresClarification: true,
    patterns: [
      /\b(dil bechain|bechain hai|bechain h|bechaini|mann ashant|dil ghabra|mann ghabra|dil dhadak|dil dhadkne|dhadkan|heart racing|dil tez|heart beat|heartbeat)\b/i,
      /\b(main bahut confused hoon|bahut confused hoon|confused hoon|confuse hoon|kuch samajh nahi aa raha|mujhe samajh nahi aa raha|sab kharab ho raha|sab kharab lag raha|bahut anxiety|anxiety ho rahi|bechaini ho rahi)\b/i,
      /\b(daru|daaru|beer|alcohol|sharab|sharaab|peene ka man|peene ka mann|daru ka man|daru ka mann|daaru ka man|daaru ka mann|daru peene|party karne|chill karne)\b/i,
      /\b(bore ho raha|mood off|mood kharab|man nahi lag raha|mann nahi lag raha|aaj man udaas|aaj mann udas|thak gaya|thakan ho rahi|neend nahi aa rahi|tension ho rahi|tension hai)\b/i,
      /(दिल बेचैन|बेचैन है|दिल धड़कने लगा|दिल धड़क रहा|दिल की धड़कन|घबराहट हो रही|बेचैन हूं|बहुत कन्फ्यूज हूं|कुछ समझ नहीं आ रहा|सब खराब हो रहा|दारू का मन|शराब पीने का मन|मूड खराब|बोर हो रहा|मन नहीं लग रहा|नींद नहीं आ रही|तनाव हो रहा)/,
    ],
  },

  // 2h. Casual Pleasantries, Venting & Thanks
  {
    intent: CoreIntent.CASUAL_CHAT,
    patterns: [
      /^(thanks|thank you|shukriya|dhanyawad|dhanyavaad|kya haal hai|how are you|kaise ho|aap kaise hain|aur batao|kya chal raha hai|kya chal raha|bas aise hi)[!.,\s]*$/i,
      /^(धन्यवाद|शुक्रिया|आप कैसे हैं|क्या हाल है|और बताओ|बस ऐसे ही)[!.,\s]*$/,
      /\b(aur batao|kya haal chaal|sab theek|kuch sunao|kuch baat karo|aaj bahut traffic|traffic tha|bhook lagi|bhookh lagi|phone toot gaya|phone toot gya|chai peeni|khana khaya)\b/i,
    ],
  },

  // 2e. Physical Incident & Daily Life Events ("Road pe gir gaya", "Road mein gir gaya", "Road kharab hai", "Chot lag gayi")
  {
    intent: CoreIntent.PHYSICAL_INCIDENT,
    patterns: [
      /\b(gir gaya|gir gya|gira|slip|road|sadak|bike se gir|scooter se gir|chot lag|chot lagi|accident|gaddhe|pothole|road kharab|sadak kharab|gir gaya tha|road mein|road pe|road par)\b/i,
      /(गिर गया|फिसल गया|सड़क खराब|चोट लग गई|सड़क पर गिर गया|एक्सीडेंट|बाइक से गिर|सड़क में गिर)/,
    ],
  },

  // 3. Career Confusion & Ambiguity (Requires Clarification)
  {
    intent: CoreIntent.CAREER_DECISION,
    requiresClarification: true,
    patterns: [
      /\b(confused about my career|career (me|mein) confusion|career confusion|career.*confused|career.*confusion|samajh nahi aa raha career|kya karu career (me|mein)|career (me|mein) kya karu)\b/i,
      /(करियर में कन्फ्यूजन|करियर को लेकर असमंजस|करियर में क्या करूं)/,
    ],
  },

  // 3b. Compound Queries (Priority before individual marriage or career domains)
  {
    intent: CoreIntent.COMPOUND_MARRIAGE_CAREER,
    patterns: [
      /\b(shaadi ke baad career|shadi ke baad career|marriage.*impact on career|after marriage.*career|career.*after marriage|shadi ke baad job|shaadi ke baad job|vivah ke baad career|shaadi.*career|shadi.*career|career.*shaadi|career.*shadi)\b/i,
      /(शादी के बाद करियर|विवाह के बाद नौकरी|शादी.*करियर)/,
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
      /\b(remember (that|when)|we (talked|discussed|spoke) about|jo baat ki thi|pichhli baar|pichli baar|yaad hai|last time we|jo discussion kiya tha|woh jo tumne last time bola tha|jo pehle bataya tha|last time tumne kya bola tha|last time kya bola|last reading me kya tha|previous reading)\b/i,
      /(पिछली बार|याद है|हमने बात की थी|जो पहले बताया था|लास्ट टाइम तुमने क्या बोला|पिछली रीडिंग)/,
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
      /\b(compatibility|kundli milan|gun milan|kya meri shadi isse|match score|are we compatible|kundali milan|are me and my partner compatible|partner compatible|compatible with|are we match)\b/i,
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
      /\b(paise kab improve|dhan labh kab|wealth timing|rich kab|aarthik sthiti kab sudhregi|paise ki sthiti kab sudhregi|will i become rich|become rich|be rich|amir banunga|ameer banunga|get rich)\b/i,
      /(पैसे कब बढ़ेंगे|धन लाभ कब|आर्थिक स्थिति कब सुधरेगी|पैसे की स्थिति कब सुधरेगी|पैसे कब|अमीर बनूंगा)/,
    ],
  },
  {
    intent: CoreIntent.FINANCE_GENERAL,
    patterns: [
      /\b(money|wealth|paisa|paise|dhan|finance|financial future|financial condition)\b/i,
      /(धन|पैसा|आर्थिक स्थिति|फाइनेंस)/,
    ],
  },
  {
    intent: CoreIntent.FAMILY_MATTERS,
    patterns: [
      /\b(ghar wale|gharwale|parivar|parents|mummy papa|family|mata pita)\b.*\b(nahi maan|raazi nahi|agree nahi|oppose|ladai|kalesh|problem|issue)\b/i,
      /\b(ghar wale nahi maan rahe|gharwale nahi maan rahe|parents nahi maan rahe|parivar nahi maan raha|family nahi maan rahi|ghar wale raazi nahi|parents raazi nahi|ghar me kalesh|ghar me ladai)\b/i,
      /\b(parents keep fighting|family|parents|parivar|ghar me kalesh|mummy papa|mother and father|family tension|family issue|about my family)\b/i,
      /(घर वाले नहीं मान रहे|परिवार नहीं मान रहा|घर में क्लेश|मम्मी पापा नहीं मान रहे|परिवार|माता पिता)/,
    ],
  },

  // 17. Daily Horoscope & Today's Guidance
  {
    intent: CoreIntent.DAILY_HOROSCOPE,
    patterns: [
      /\b(horoscope for today|today'?s horoscope|aaj ka rashifal|horoscope today|daily horoscope|what'?s my horoscope for today|horoscope for me today)\b/i,
      /(आज का राशिफल|दैनिक राशिफल)/,
    ],
  },
  {
    intent: CoreIntent.TODAY_GUIDANCE,
    patterns: [
      /\b(aaj ka din kaisa|today rashifal|how is my day today|aaj kaisa rahega|jana sahi hoga|jana theek hoga|jana chahiye|yatra|travel|aaj jana|delhi jana|mumbai jana|bahar jana|shubh muhurat)\b/i,
      /(आज का दिन कैसा|आज कैसा रहेगा|जाना सही होगा|यात्रा|आज जाना|शुभ मुहूर्त|सफर)/,
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
      /\b(master'?s|higher studies|post graduation|phd|mba|higher education|padhai|admission|college|degree|exam|exams|entrance|neet|jee|upsc|cat|gate|ielts|university|school|padhna|shiksha|vidya|btech|graduation|stream|result|rank)\b/i,
      /(उच्च शिक्षा|मास्टर्स|पढ़ाई|एडमिशन|कॉलेज|परीक्षा|यूनिवर्सिटी|स्कूल|डिग्री|विद्या|शिक्षा|नतीजा|रैंक)/,
    ],
  },
  {
    intent: CoreIntent.FOREIGN_TRAVEL_SETTLEMENT,
    patterns: [
      /\b(abroad|foreign|videsh|visa|foreign settlement|foreign travel|bahar jane ka yog|videsh yatra|green card|pr yog)\b/i,
      /(विदेश यात्रा|विदेश सेटलमेंट|वीजा|विदेश)/,
    ],
  },

  // 19. Health & Vitality
  {
    intent: CoreIntent.HEALTH_VITALITY,
    patterns: [
      /\b(health|swasthya|tabiyat|sehat|vitality|physical health|energy level|dard|pain|swasth)\b/i,
      /(स्वास्थ्य|तबीयत|सेहत|ऊर्जा|दर्द)/,
    ],
  },

  // 20. Property & Vehicle
  {
    intent: CoreIntent.PROPERTY_VEHICLE,
    patterns: [
      /\b(property|ghar|flat|plot|makan|land|gaadi|car|gadi|vehicle|vahana|nayi car|naya ghar|ghar khareedna|buy home|buy flat)\b/i,
      /(घर|मकान|जमीन|फ्लैट|गाड़ी|वाहन|प्रॉपर्टी|घर खरीदना)/,
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
