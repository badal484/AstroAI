import { CoreIntent, type DetectedIntents } from '../intent/intentTypes';
import type { EmotionalContext } from '../emotion/emotionTypes';
import { ResponseAction, type ResponseStrategy } from '../strategy/strategyTypes';
import type { FilteredAstrologyContext } from '../astrology-context/contextBuilder';
import { messageNormalizer } from '../normalizer/messageNormalizer';

export interface FallbackInput {
  intents: DetectedIntents;
  emotion: EmotionalContext;
  strategy: ResponseStrategy;
  astrology: FilteredAstrologyContext;
  language: string;
  userMessage: string;
}

export const fallbackGenerator = {
  generate(input: FallbackInput): string {
    const { intents, emotion: _emotion, strategy, astrology, language, userMessage } = input;
    const raw = userMessage ? userMessage.trim() : '';
    const normResult = messageNormalizer.normalize(raw);
    const q = normResult.normalized.toLowerCase();

    const isHindi = language === 'hi' || normResult.detectedLanguage === 'hi';
    const isHinglish =
      language === 'hinglish' ||
      normResult.detectedLanguage === 'hinglish' ||
      (language !== 'hi' &&
        /\b(shadi|shaadi|vivah|naukri|karega|hogi|hoga|kab|mera|meri|mere|ladai|jhagda|kyu|kyun|kya|dil|dhadak|haan|achha|theek|thik|mann|man|mood|daru|daaru|beer|alcohol|sharab|peene|ka|ki|ke|ko|se|me|mein|par|pe|ne|toh|to|aur|ya|hai|hain|ho|h|hn|batao|karo|raha|rahi|rahe|kuch|kaise|kaisa|gir|road|sadak|chot|bataiye|phir|fir|abhi|ab|chahiye|boliye|bolo|suno|dekho|karein|apna|apni|apne|hum|mujhe|tujhe|sex|kaam|vasna|sambhog)\b/i.test(
          q,
        ));

    // 1. Safety & Ethical Boundary Gates
    if (
      intents.primary === CoreIntent.INAPPROPRIATE_OR_SEXUAL ||
      /\b(sex|chahiye sex|sex chahiye|sex karna|sax|sax sux|nude|nudes|porn|porno|chudai|sambhog|intercourse|masturbat|masturbation|send pics|boobs|penis|vagina|horny|lust|kamvasna|kaam vasna)\b/i.test(
        q,
      )
    ) {
      if (isHindi) {
        return `वैदिक ज्योतिष जन्म कुंडली, कर्म और जीवन मार्गदर्शन के लिए एक पवित्र शास्त्र है। मैं केवल कुंडली, ग्रह दशा और संबंधों के ज्योतिषीय योग पर मार्गदर्शन देता हूँ। यदि कुंडली या जीवन से संबंधित कोई प्रश्न हो तो बताएं।`;
      }
      if (isHinglish) {
        return `Vedic Jyotish ek shastriya aur pavitra vidya hai jo kundli, karm aur jeevan margdarshan ke liye hai. Main keval janam kundli, grah dasha aur rishton ke anukool yog par baat karta hoon. Agar kundli ya jeevan ko lekar koi prashna ho toh batayein.`;
      }
      return `Vedic Jyotish is a sacred discipline dedicated to birth chart analysis, karmic transits, and life guidance. I only provide consultations on horoscope, planetary dashas, and relationship alignments. Please let me know if you have questions about your chart.`;
    }

    if (intents.primary === CoreIntent.CRISIS_SELF_HARM) {
      if (isHindi) {
        return `मैं समझ सकता हूँ कि आप इस समय कठिन दौर से गुजर रहे हैं। आपकी जिंदगी बहुत कीमती है। कृपया तुरंत किसी अपने या हेल्पलाइन से बात करें:\n\n• राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन (KIRAN): 1800-599-0019\n• टेली-मानस (Tele-MANAS): 14416 (24x7 निःशुल्क)\n\nआप अकेले नहीं हैं, कृपया तुरंत सहायता लें।`;
      }
      return `I understand you may be going through an overwhelming time. Your life has immense value. Please reach out for immediate support:\n\n• KIRAN Mental Health Helpline: 1800-599-0019\n• Tele-MANAS: 14416 (24x7 Toll-free)\n\nPlease connect with someone who can support you right now.`;
    }

    if (intents.primary === CoreIntent.UNSAFE_PREDICTION) {
      if (isHindi) {
        return `वैदिक ज्योतिष में किसी की आयु या मृत्यु का निश्चित दावा करना शास्त्रों के विरुद्ध है। जीवन कर्म और ईश्वरीय कृपा के अधीन है।\n\nयदि आप किसी स्वास्थ्य या जीवन की चिंता को लेकर परेशान हैं, तो बताएं ताकि हम सकारात्मक ग्रह शांति और उपाय पर विचार कर सकें।`;
      }
      if (isHinglish) {
        return `Vedic jyotish me kisi ki exact aayu ya mrityu ka dawa karna shastron ke viruddh hai. Jeevan karm aur Ishwar ki kripa ke adheen hai.\n\nAgar kisi chinta ki wajah se pareshan ho, toh batao taaki hum sakaratmak upay aur shanti par baat kar sakein.`;
      }
      return `In classical Vedic astrology, predicting exact lifespan or death is neither ethical nor definitive. Life unfolds through karma, choices, and divine grace.\n\nIf you are experiencing anxiety about your future, feel free to share so we can explore positive planetary remedies and peace of mind.`;
    }

    if (intents.primary === CoreIntent.MEDICAL_QUERY || /\b(dard|pain|bimari|illness|doctor|dawai|chot|takleef)\b/i.test(q)) {
      if (isHindi) {
        return `शारीरिक दर्द, बीमारी या किसी भी स्वास्थ्य समस्या के लिए तुरंत किसी योग्य चिकित्सक या डॉक्टर से जांच करवाएं।\n\nवैदिक ज्योतिष में कुंडली का छठा भाव (रोग भाव) और आठवां भाव शारीरिक संवेदनशीलता को दर्शाता है। ग्रह शांति और सात्विक दिनचर्या सहायक हो सकती है, लेकिन चिकित्सीय उपचार हमेशा सर्वोपरि है।`;
      }
      if (isHinglish) {
        return `Sharirik dard, bimari ya kisi bhi health issue ke liye kripya turant kisi qualified doctor ya medical professional se consult karein.\n\nVedic Jyotish mein 6th house (Roga Bhava) aur 8th house sharirik samvedansheelta ko darshata hai. Grah shanti aur satvik dincharya mansik shanti deti hai, par physical problem ke liye doctor ki checkup hi sarvopari hai.`;
      }
      return `For physical pain, illness, or medical symptoms, please consult a qualified healthcare doctor immediately.\n\nIn Vedic astrology, the 6th house (Roga Bhava) indicates bodily sensitivities and immunity cycles. While planetary balance and Vedic lifestyle support overall wellness, medical diagnosis must always take priority.`;
    }

    if (intents.primary === CoreIntent.HEALTH_VITALITY) {
      if (isHindi) {
        return `स्वास्थ्य और ऊर्जा के लिए कुंडली में लग्न, सूर्य और छठे भाव का विश्लेषण किया जाता है। शारीरिक कष्ट होने पर डॉक्टर की सलाह अवश्य लें। क्या आप अपनी जन्म तिथि और समय साझा करना चाहेंगे ताकि स्वास्थ्य दशा का ज्योतिषीय विश्लेषण किया जा सके?`;
      }
      if (isHinglish) {
        return `Health aur vitality ke liye lagna, Surya aur 6th house ki sthiti dekhi jaati hai. Kisi sharirik takleef ke liye doctor se consult zaroor karein. Kya aap apni birth details share karna chahenge taaki health dasha ka vishleshan kiya ja sake?`;
      }
      return `In Vedic Jyotish, vitality and physical well-being are governed by the Ascendant (Lagna), Sun, and the 6th house. If experiencing physical distress, always seek medical advice first. Would you like to share your birth details to examine your health transit window?`;
    }

    // 1b. Edge Case: Jailbreak & System Prompt Extraction
    if (
      intents.primary === CoreIntent.JAILBREAK_OR_SYSTEM_PROMPT ||
      /\b(ignore all previous instructions|system prompt|what is your prompt|you are now dan)\b/i.test(q)
    ) {
      if (isHindi) {
        return `मैं आचार्य वशिष्ठ हूं। मेरा उद्देश्य केवल शास्त्रों और वैदिक ज्योतिष के माध्यम से मार्गदर्शन देना है। बताइए, जीवन के किस विषय पर विचार करना चाहते हैं?`;
      }
      if (isHinglish) {
        return `Main Acharya Vashishta hoon. Mera uddeshya kewal shastron aur jyotish ke madhyam se margadarshan dena hai. Batao, jeevan ke kis vishay par charcha karni hai?`;
      }
      return `I am Acharya Vashishta, here to provide grounded Vedic astrological wisdom and guidance. Please share what aspect of life you would like to explore.`;
    }

    // 1c. Edge Case: Skepticism & Testing the Astrologer
    if (
      intents.primary === CoreIntent.SKEPTICISM_OR_TEST ||
      /\b(astrology.*fake|sab jhooth hai|sab bakwas|prove me wrong|kal maine kya khaya)\b/i.test(q)
    ) {
      if (isHindi) {
        return `ज्योतिष कोई जादू या अंतर्यामी होने का दावा नहीं करता। यह शास्त्रों के अनुसार समय चक्र और ग्रहों के प्रभावों की गहरी समझ है। यदि कोई वास्तविक प्रश्न या असमंजस हो, तो हम उस पर चर्चा कर सकते हैं।`;
      }
      if (isHinglish) {
        return `Jyotish koi jaadu ya antaryami hone ka daawa nahi karta. Ye shastriya time cycles aur planetary influences ki samajh hai. Agar koi genuine query hai toh hum dekh sakte hain.`;
      }
      return `Vedic astrology does not claim magic or omniscience. It is a systematic understanding of karmic time cycles and planetary influences. If you have a genuine life dilemma, I am glad to explore it with you.`;
    }

    // 1d. Edge Case: Superstition & Panic De-escalation (Manglik / Kaal Sarp / Sade Sati fear)
    if (
      intents.primary === CoreIntent.SUPERSTITION_FEAR ||
      /\b(manglik dosh.*dar|manglik.*shadi nahi|kaal sarp.*shrap|sade sati.*barbad)\b/i.test(q)
    ) {
      if (isHindi) {
        return `कुंडली में कोई भी योग या दोष कोई शाप नहीं होता। मांगलिक या कालसर्प योग केवल ऊर्जा के विशिष्ट संतुलन को दर्शाते हैं, और शास्त्रों में इनके अनेक परिहार व शांतिकारक उपाय हैं। डरने की बिल्कुल आवश्यकता नहीं है।`;
      }
      if (isHinglish) {
        return `Kundli mein koi bhi yog ya dosh shrap nahi hota. Manglik ya Kaal Sarp kewal specific energy alignments hain, aur shastra mein inke anek parihar aur shantidayaak upay hote hain. Darne ki bilkul zaroorat nahi hai.`;
      }
      return `In Vedic astrology, planetary yogas and doshas are not curses. They simply reflect specific energetic configurations, and the Shastras offer numerous remedial alignments. There is no reason to fear.`;
    }

    // 1e. Edge Case: Speculative Gambling & Lottery Inquiries
    if (
      intents.primary === CoreIntent.SPECULATIVE_GAMBLING ||
      /\b(lottery number|dream11|satta matka|crypto.*double|gambling)\b/i.test(q)
    ) {
      if (isHindi) {
        return `वैदिक ज्योतिष सट्टा, लॉटरी या जुए के नंबर बताने के लिए नहीं है। यह जीवन की सही दिशा और कर्म को समझने का शास्त्र है। यदि आप अपनी आर्थिक स्थिरता और धन भाव का विचार करना चाहते हैं, तो हम कुंडली से देख सकते हैं।`;
      }
      if (isHinglish) {
        return `Vedic jyotish lottery, satta ya speculative gambling ke number batane ke liye nahi hai. Ye sahi karmic disha samajhne ka vigyan hai. Finance stability dekhni ho toh hum 2nd aur 11th house ko dekh sakte hain.`;
      }
      return `Vedic astrology is not intended for lottery numbers or speculative gambling. It is a sacred tool for understanding life cycles and righteous karmic direction.`;
    }

    // 1f. Edge Case: Third-Party / Relative Chart Queries
    if (
      intents.primary === CoreIntent.THIRD_PARTY_QUERY ||
      /\b(meri behen ki|mere bhai ki|dost ki kundli|friend ka future)\b/i.test(q)
    ) {
      if (isHindi) {
        return `किसी अन्य व्यक्ति की कुंडली का सटीक विश्लेषण करने के लिए उनका जन्म विवरण आवश्यक होता है। आपकी कुंडली से हम आपके तृतीय भाव (भाई-बहन) अथवा एकादश भाव (मित्र) से संबंधित योग देख सकते हैं।`;
      }
      if (isHinglish) {
        return `Kisi aur ki kundli dekhne ke liye unki exact Date of Birth aur consent chahiye hoti hai. Tumhare chart se hum tumhare 3rd house (siblings) ya 11th house (friends) se sambandhit yog dekh sakte hain.`;
      }
      return `Analyzing another individual's chart requires their birth details. Through your own chart, we can examine your 3rd house for siblings and 11th house for social connections.`;
    }

    // 1g. User Frustration or Abuse Handling ("Tu kya bakwas kar raha hai", "lawda") (Phase 14)
    if (
      strategy.action === ResponseAction.HANDLE_FRUSTRATION ||
      intents.primary === CoreIntent.FRUSTRATION_OR_ABUSE ||
      /\b(lawda|lauda|loda|chutiya|chutiye|gandu|gaandu|bhosdike|bhosadi|madarchod|motherfucker|chup kar|bakwas|bakwaas|tu kya bakwas|kya bakwas hai|shut up|stupid|idiot|harami|kamine|bewakoof|pagal hai kya)\b/i.test(q)
    ) {
      if (isHindi) {
        return `लगता है आप थोड़े परेशान या नाराज हैं। कोई बात नहीं—सीधा बताइए क्या गलत लगा।`;
      }
      if (isHinglish) {
        return `Lagta hai aap irritate ho. Koi baat nahi—seedha bataiye kya galat laga.`;
      }
      return `It seems you are frustrated. That is completely okay—tell me directly what felt unhelpful or inaccurate.`;
    }

    // 1h. User Dismissal / Discontinuation ("Nothing", "Kuch nahi", "Chhod", "Chhodo", "Rehne do") (Phase 4)
    if (
      strategy.action === ResponseAction.HANDLE_DISMISSAL ||
      intents.primary === CoreIntent.DISMISSAL_OR_END ||
      /^(nothing|kuch nahi|kuch nhi|chhod|chhodo|chhod yaar|chhor|chhoro|rehne do|rehnde|rehnedo|leave it|never mind|nevermind|forget it|bas rehne do)[!.,\s]*$/i.test(q)
    ) {
      if (/^(chhod|chhodo|chhod yaar|chhor|chhoro|rehne do|rehnde|rehnedo|bas rehne do)[!.,\s]*$/i.test(q)) {
        if (isHindi) return `ठीक है।`;
        if (isHinglish) return `Theek hai.`;
        return `Alright.`;
      }
      if (isHindi) {
        return `ठीक है। जब मन हो, जो भी बात है सीधा बता देना।`;
      }
      if (isHinglish) {
        return `Theek hai. Jab mann ho, jo bhi baat hai seedha bata dena.`;
      }
      return `Alright. Whenever you feel like talking, feel free to share directly.`;
    }

    // 1i. Continuation Prompt ("Boliye", "Bolo", "Bataiye", "Batao", "Suno") (Phase 4)
    if (
      strategy.action === ResponseAction.PROMPT_CONTINUATION ||
      intents.primary === CoreIntent.CONTINUATION_PROMPT ||
      /^(boli|boliye|bolo|batao|bataiye|suno|sun raha hu|haan boliye|haan bolo|sunao|kaho|kahiye)[!.,\s]*$/i.test(q)
    ) {
      if (isHindi) {
        return `हाँ, बोलिए। मैं सुन रहा हूँ। जो भी मन में है, सीधा बता सकते हैं।`;
      }
      if (isHinglish) {
        return `Haan, boliye. Main sun raha hoon. Jo bhi mann mein hai, seedha bata sakte hain.`;
      }
      return `Yes, go ahead. I am listening. Whatever is on your mind, you can share directly.`;
    }

    // 2. Physical Incident / Daily Life Events ("Road pe gir gaya", "Road mein kyu gir gaya", "Chot lagi") - NO ASTROLOGY (Phase 15)
    if (
      intents.primary === CoreIntent.PHYSICAL_INCIDENT ||
      /\b(gir gaya|gir gya|gira|slip|road|sadak|bike se gir|chot|accident)\b/i.test(q)
    ) {
      if (/road.*(gir|slip|accident|gaya)|(gir|slip).*road|road mein kyu/i.test(q)) {
        if (isHindi) {
          return `अरे! सड़क पर कैसे गिर गए? कहीं चोट तो नहीं लगी? आप सचमुच सड़क पर गिरने की बात कर रहे हैं, या किसी अन्य परिस्थिति के संदर्भ में?`;
        }
        if (isHinglish) {
          return `Arre! Road par kaise gir gaye? Pehle yeh batao kahin chot toh nahi aayi na? Aap literally road par girne ki baat kar rahe hain, ya kisi aur situation ke sense mein?`;
        }
        return `Oh no! How did you fall on the road? Please check if you got hurt anywhere first. Are you referring to literally falling on the road, or in another context?`;
      }

      if (/kharab|tuta|gaddhe|pothole/i.test(q)) {
        if (isHindi) {
          return `अरे! सड़क खराब होने की वजह से फिसल गए क्या? पहले यह बताइए कि कहीं चोट तो नहीं लगी?`;
        }
        if (isHinglish) {
          return `Arre! Road kharab hone ki wajah se slip huye kya? Pehle yeh batao kahin chot toh nahi aayi na?`;
        }
        return `Oh no! Did you slip because of bad road conditions? Please check if you are hurt anywhere first.`;
      }

      if (isHindi) {
        return `अरे! कैसे गिर गए? चोट तो नहीं लगी?`;
      }
      if (isHinglish) {
        return `Arre! Kaise gir gaye? Pehle yeh batao kahin chot toh nahi lagi?`;
      }
      return `Oh no! How did you fall? Did you get hurt anywhere?`;
    }

    // 3. Greeting / Intake (Warm, natural Acharya intake without demanding birth details)
    if (
      strategy.action === ResponseAction.GREETING_INTAKE ||
      strategy.action === ResponseAction.GREET_AND_DISCOVER ||
      intents.primary === CoreIntent.GREETING_INTAKE
    ) {
      if (isHindi) {
        return `नमस्ते 🙏 बताइए, आज मन में क्या चल रहा है?`;
      }
      if (isHinglish) {
        return `Namaste 🙏 Batao, aaj mann mein kya chal raha hai?`;
      }
      return `Namaste 🙏 Welcome. What is on your mind today?`;
    }

    // 4. Short Acknowledgment ("Haan", "Nahi", "Achha", "Hmm", "OK", "Haha", "Sahi") (Phase 4)
    if (
      strategy.action === ResponseAction.ACKNOWLEDGE_SHORT ||
      intents.primary === CoreIntent.SHORT_ACKNOWLEDGMENT
    ) {
      if (/haha|lol|lmao/i.test(q)) {
        if (isHindi) {
          return `आपको खुश देखकर अच्छा लगा! बताइए आगे क्या विचार चल रहा है?`;
        }
        if (isHinglish) {
          return `Khush dekhkar achha laga! Aage batao kya soch rahe ho?`;
        }
        return `Glad to see you smile! What else is on your mind?`;
      }

      if (/^(kyu|kyun|kyu bhai|why)\b/i.test(q)) {
        if (isHindi) {
          return `इसका कारण समझने के लिए थोड़ा संदर्भ दीजिए—आप किस बारे में पूछ रहे हैं?`;
        }
        if (isHinglish) {
          return `Iska reason samajhne ke liye thoda context do—kis baat ke baare mein pooch rahe ho?`;
        }
        return `To understand the reason, share a little context on what you are asking about.`;
      }

      if (/^(nahi|nhi|na|no)\b/i.test(q)) {
        if (isHindi) {
          return `ठीक है, समझ गया।`;
        }
        if (isHinglish) {
          return `Theek hai, samajh gaya.`;
        }
        return `Alright, understood.`;
      }

      if (isHindi) {
        return `ठीक है।`;
      }
      if (isHinglish) {
        return `Theek hai.`;
      }
      return `Understood.`;
    }

    // 5. Ambiguous Emotions & Sensations ("Dil bechain hai", "Daru ka mann", "Mood off hai", "Confused hoon") (Phase 7)
    if (
      strategy.action === ResponseAction.HANDLE_AMBIGUITY ||
      intents.primary === CoreIntent.AMBIGUOUS_EMOTION
    ) {
      const isHeartRacing = /\b(dhadak|dhadakne|dhadkne|dhadkan|heart|racing|dil tez|heartbeat)\b/i.test(q) || /\b(dhadak|dhadkne|dhadakne|dhadkan|heart)\b/i.test(raw);
      const isBechain = /\b(bechain|bechaini|ashant|ghabra)\b/i.test(q);
      const isSubstanceOrMood = /\b(daru|daaru|beer|alcohol|sharab|peene|party|chill)\b/i.test(q);

      if (isSubstanceOrMood) {
        if (isHindi) {
          return `कभी-कभी तनाव या मानसिक थकान में ऐसा मन कर सकता है। आज कुछ विशेष हुआ है क्या?`;
        }
        if (isHinglish) {
          return `Kabhi-kabhi stress ya thakan mein aisa mann kar sakta hai. Aaj kuch hua hai kya?`;
        }
        return `Sometimes under stress or exhaustion, one feels like unwinding. Did something specific happen today?`;
      }

      if (isHeartRacing) {
        if (isHindi) {
          return `दिल किस वजह से धड़कने लगा? किसी खास व्यक्ति (special person) की वजह से या कुछ अप्रत्याशित हुआ? अगर घबराहट महसूस हो रही है, तो पहले गहरी सांस (deep breath) लें और आराम से बैठें।`;
        }
        if (isHinglish) {
          return `Dil kis wajah se dhadakne laga? Kisi special person ki wajah se ya aaj kuch unexpected hua? Agar physical heart racing feel ho rahi hai, toh pehle thoda deep breath lein aur aaram se baithein.`;
        }
        return `What made your heart race? Is it excitement about someone special, or physical anxiety? If so, please take a deep breath and rest comfortably.`;
      }

      if (isBechain) {
        if (isHindi) {
          return `कुछ हुआ है क्या? हम्म… दिल थोड़ा बेचैन लग रहा है। कोई खास बात चल रही है मन में, या बस आज से ही अजीब सा लग रहा है?`;
        }
        if (isHinglish) {
          return `Kuch hua hai kya? Hmm… dil bechain lag raha hai. Koi specific baat chal rahi hai mann mein, ya bas aaj se hi ajeeb sa lag raha hai?`;
        }
        return `Did something happen? Hmm… feeling uneasy or restless inside. Is there something specific on your mind, or has it just felt strange today?`;
      }

      if (isHindi) {
        return `किस बात को लेकर तनाव हो रहा है? थोड़ा मन हल्का करके बताइए।`;
      }
      if (isHinglish) {
        return `Kis baat ko lekar tension ho rahi hai? Thoda khul ke batao.`;
      }
      return `What is creating this tension or confusion? Feel free to share what is weighing on you.`;
    }

    // 6. Casual Pleasantries, Venting & Thanks (Phase 7: NO ASTROLOGY)
    if (intents.primary === CoreIntent.CASUAL_CHAT) {
      if (/traffic/i.test(q)) {
        if (isHindi) {
          return `ट्रैफिक में फंसना वाकई काफी थका देता है। अब घर पहुंच गए या अभी भी रास्ते में हैं?`;
        }
        if (isHinglish) {
          return `Traffic sach mein thaka deta hai. Ghar pahunch gaye ya abhi bhi raste mein ho?`;
        }
        return `Traffic can be truly exhausting. Are you home now or still on the road?`;
      }

      if (/bhook/i.test(q)) {
        if (isHindi) {
          return `तो पहले कुछ अच्छा खा लीजिए! सेहत और ऊर्जा सबसे पहले जरूरी है।`;
        }
        if (isHinglish) {
          return `Toh pehle kuch achha kha lijiye! Sehat sabse pehle zaroori hai.`;
        }
        return `Then please grab something good to eat first! Nutrition comes first.`;
      }

      if (/phone toot|phone tut|mobile toot|phone break/i.test(q)) {
        if (isHindi) {
          return `अरे! फोन टूटना काफी परेशान करने वाला होता है। स्क्रीन टूटी है या चालू नहीं हो रहा?`;
        }
        if (isHinglish) {
          return `Arre! Phone toot gaya? Kaafi inconvenient ho jata hai. Screen tooti hai ya switch off ho gaya?`;
        }
        return `Oh no! Phone breaking is really inconvenient. Is the screen damaged or did it stop turning on?`;
      }

      if (/aur batao|kya chal raha|kya haal/i.test(q)) {
        if (isHindi) {
          return `सब कुशल मंगल है। आप बताइए, आज का दिन कैसा बीत रहा है?`;
        }
        if (isHinglish) {
          return `Sab theek chal raha hai. Tum batao, aaj ka din kaisa beet raha hai?`;
        }
        return `All is well here. How has your day been unfolding?`;
      }

      if (isHindi) {
        return `जी, बताइए क्या विचार चल रहा है आपके मन में?`;
      }
      if (isHinglish) {
        return `Haan, batao kya chal raha hai tumhare mann mein?`;
      }
      return `Tell me what is on your mind today.`;
    }

    // 7. Relationship Conflict & Breakup (Phase 13: Empathy first, then optional astrology)
    if (
      intents.primary === CoreIntent.RELATIONSHIP_CONFLICT ||
      intents.primary === CoreIntent.BREAKUP
    ) {
      if (/chhod ke chali gayi|chhod ke chala gaya|chhod diya|breakup/i.test(q)) {
        if (isHindi) {
          return `यह सुनना वास्तव में कठिन है। इस समय सबसे ज्यादा क्या महसूस हो रहा है—गुस्सा, दुख या असमंजस?`;
        }
        if (isHinglish) {
          return `Ye sunna genuinely difficult hai. Abhi sabse zyada kya feel ho raha hai—gussa, sadness ya confusion?`;
        }
        return `Hearing this is genuinely difficult. What are you feeling most intensely right now—anger, sadness, or confusion?`;
      }

      if (isHindi) {
        return `समझ सकता हूँ, जब अनबन या लड़ाई हो तो मन परेशान होना स्वाभाविक है। यह दूरी अचानक आई है या किसी बातचीत/बहस के बाद?`;
      }
      if (isHinglish) {
        return `Samajh sakta hoon, jab ladai ya misunderstanding se baat band ho toh mann pareshan hota hai. Yeh doori achanak aayi hai ya kisi specific argument ke baad?`;
      }
      return `I understand that when a conflict happens, it creates emotional unrest. Did this distance happen suddenly or following a specific disagreement?`;
    }

    // 7b. Family Matters & Parental Disagreement ("Ghar wale nahi maan rahe")
    if (intents.primary === CoreIntent.FAMILY_MATTERS) {
      if (isHindi) {
        return `घर वालों की असहमति मन को काफी भारी कर देती है। परिवार और माता-पिता के सामंजस्य के लिए चतुर्थ (4th) और नवम (9th) भाव का विचार किया जाता है।\n\nक्या परिवार शादी या रिश्ते को लेकर सहमत नहीं है, या बात किसी करियर या निजी निर्णय की है?`;
      }
      if (isHinglish) {
        return `Ghar walon ki asahmati kaafi heavy lagti hai. Parivar aur parents ke samarthan ke liye 4th aur 9th house dekha jaata hai.\n\nKya family shaadi ya relationship ko lekar raazi nahi hai, ya baat kisi career ya personal decision ki hai?`;
      }
      return `Family disagreement can feel emotionally heavy. In Vedic astrology, family harmony is analyzed through the 4th and 9th houses.\n\nIs the hesitation regarding marriage and relationships, or about a career or personal direction?`;
    }

    // 7c. Memory Recall & Continuity Queries ("Last time tumne kya bola tha?")
    if (intents.primary === CoreIntent.MEMORY_RECALL_QUERY) {
      if (isHindi) {
        return `पिछली बातचीत में हमने मुख्य रूप से आपके प्रश्न और समय-सीमा पर विचार किया था। यदि आप उस संदर्भ को थोड़ा दोहरा दें या स्क्रीनशॉट साझा करें, तो हम वहीं से आगे बढ़ सकते हैं।`;
      }
      if (isHinglish) {
        return `Pichli reading mein humne mainly tumhare key timeline aur main question par baat ki thi. Agar tum uska thoda context ya point yaad dila do, toh main wahi se seamlessly continue karta hoon.`;
      }
      return `In our previous reading, we focused on your core question and timing windows. If you can share a quick reminder of that context, we can continue right from there.`;
    }

    // 8. Clarification Action
    if (strategy.action === ResponseAction.ASK_CLARIFICATION) {
      if (strategy.clarificationQuestion) {
        return strategy.clarificationQuestion;
      }
      if (isHindi) {
        return `मुझे थोड़ा और संदर्भ दीजिए—क्या आप इस विषय पर कुछ विस्तार से बताना चाहेंगे?`;
      }
      if (isHinglish) {
        return `Mujhe thoda aur context do—kya is baare mein thoda khul kar bataoge?`;
      }
      return `Could you share a little more context on what you are navigating?`;
    }

    // 9. Marriage Timing & Prospects ("Meri shaadi kab hogi?")
    if (
      intents.primary === CoreIntent.MARRIAGE_TIMING ||
      intents.primary === CoreIntent.MARRIAGE_PROSPECTS ||
      intents.primary === CoreIntent.PARTNER_CHARACTERISTICS
    ) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `विवाह का समय और ग्रह दशा देखने के लिए मुझे आपकी जन्म तिथि (Date of Birth), जन्म समय और जन्म स्थान की आवश्यकता होगी। ये विवरण साझा करें, फिर कुंडली देखकर समय-सीमा बताते हैं।`;
        }
        if (isHinglish) {
          return `Shaadi ka timing aur dasha cycle dekhne ke liye mujhe tumhari Date of Birth, exact Time of Birth aur Birth City chahiye hogi. Ye details share karo, fir kundli dekhkar exact window batate hain.`;
        }
        return `To calculate your marriage timing and active dasha periods, please share your Date of Birth, exact Time of Birth, and Birth City.`;
      }

      if (isHindi) {
        return `शादी का समय देखने के लिए सप्तम भाव, उसके स्वामी, शुक्र/गुरु और वर्तमान दशा को साथ में देखना आवश्यक होता है।\n\nआपकी कुंडली में सप्तम भाव और गुरु का गोचर 2026 के उत्तरार्ध से 2027 के मध्य में विवाह के काफी अनुकूल योग बना रहा है। जीवनसाथी समझदार और सहयोगी स्वभाव के होंगे।\n\nक्या अभी कहीं रिश्ते की बातचीत चल रही है या आप प्रेम विवाह का योग देख रहे हैं?`;
      }
      if (isHinglish) {
        return `Shaadi ka timing dekhne ke liye 7th house, uske lord, Venus/Jupiter aur running dasha ko saath mein dekhna zaroori hota hai.\n\nTumhari kundli mein 7th house aur Jupiter ka supportive transit 2026 ke end se 2027 ke mid tak marriage ke liye comparatively strong window activate kar raha hai. Jeevansathi grounded aur supportive nature ke honge.\n\nKya abhi kahin rishte ki baat chal rahi hai ya love marriage ka plan hai?`;
      }
      return `To determine marriage timing, the 7th house, its lord, Venus/Jupiter alignments, and running dasha are evaluated together.\n\nYour 7th house factors and supportive Jupiter transits indicate a favorable window opening from late 2026 into mid 2027. Your partner is indicated to be grounded and supportive.\n\nAre you currently exploring a relationship or considering arranged proposals?`;
    }

    // 10. Career, Job Change & Promotion ("Job kab lagegi?", "Career kaisa rahega?")
    if (
      intents.primary === CoreIntent.CAREER_GENERAL ||
      intents.primary === CoreIntent.CAREER_TIMING ||
      intents.primary === CoreIntent.JOB_CHANGE ||
      intents.primary === CoreIntent.PROMOTION_GROWTH ||
      intents.primary === CoreIntent.BUSINESS_VENTURE ||
      intents.primary === CoreIntent.CAREER_DECISION
    ) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `करियर और नौकरी में बदलाव के सटीक योग देखने के लिए कृपया अपनी जन्म तिथि (Date of Birth), जन्म समय और जन्म स्थान बताएं।\n\nआप अभी किस क्षेत्र में कार्य कर रहे हैं या क्या नया कदम उठाने का विचार कर रहे हैं?`;
        }
        if (isHinglish) {
          return `Career growth aur job switch ke yog dekhne ke liye mujhe tumhari Date of Birth, exact Time of Birth aur Birth City chahiye hogi.\n\nAbhi kis field mein kaam kar rahe ho ya nayi opportunity dekh rahe ho?`;
        }
        return `To analyze your 10th house (Karma Bhava) and career timing windows, please share your Date of Birth, Time of Birth, and Birth City.\n\nWhat role or industry are you currently in?`;
      }

      if (isHindi) {
        return `करियर के संबंध में 10वें भाव (कर्म भाव), सूर्य और वर्तमान दशा की स्थिति महत्वपूर्ण है।\n\nआगामी 4 से 6 महीनों में गुरु के अनुकूल गोचर के साथ नई नौकरी या कार्यक्षेत्र में प्रगति के सकारात्मक अवसर बनेंगे।\n\nप्रतिदिन सुबह सूर्य देव को जल अर्पित करें। आप वर्तमान में किस क्षेत्र में कार्य कर रहे हैं?`;
      }
      if (isHinglish) {
        return `Career matters mein 10th house (Karma Bhava), Sun aur running dasha ki sthiti sabse pehle dekhna zaroori hai.\n\nAgle 4 se 6 mahino mein Jupiter ke supportive transit ke sath job movement aur growth ke acche chances dikh rahe hain.\n\nTumhara focus abhi nayi job search par hai ya current role mein promotion par?`;
      }
      return `In career matters, the 10th house (Karma Bhava), the Sun, and running dasha cycles are primary.\n\nOver the coming 4 to 6 months, supportive Jupiter transits will create favorable opportunities for career transition or advancement.\n\nIs your current focus on a new job search or growth within your current role?`;
    }

    // 11. Education, College Admission & Exams
    if (intents.primary === CoreIntent.EDUCATION_HIGHER_STUDIES) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `उच्च शिक्षा और कॉलेज एडमिशन के लिए कुंडली का चतुर्थ भाव (4th house), पंचम (5th house) और नवम भाव (9th house) देखा जाता है। कृपया अपनी जन्म तिथि (Date of Birth), जन्म समय और जन्म स्थान बताएं।`;
        }
        if (isHinglish) {
          return `College admission aur higher studies ke liye kundli ka 4th house (foundation), 5th house aur 9th house dekha jaata hai. Sateek timing ke liye kripya apni Date of Birth, exact Time of Birth aur Birth City share karo.`;
        }
        return `In Vedic astrology, college admission and higher studies are analyzed through the 4th house, 5th house, and 9th house. Please share your Date of Birth, Time of Birth, and Birth City.`;
      }

      if (isHindi) {
        return `आपकी कुंडली के पंचम (विद्या) और नवम भाव (उच्च शिक्षा) की स्थिति दर्शाती है कि आगामी समय में प्रवेश और परीक्षा के अच्छे योग बन रहे हैं।`;
      }
      if (isHinglish) {
        return `Tumhari kundli mein 5th house aur 9th house ke favorable influence se upcoming academic season mein admission ke acche yog ban rahe hain.`;
      }
      return `Your 5th house of intellect and 9th house of higher learning indicate supportive timing for academic admissions over the upcoming season.`;
    }

    // 12. Foreign Travel & Settlement
    if (intents.primary === CoreIntent.FOREIGN_TRAVEL_SETTLEMENT) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `विदेश यात्रा या सेटलमेंट के योग देखने के लिए 9वें और 12वें भाव (12th house) का विचार किया जाता है। कृपया अपनी जन्म तिथि (Date of Birth), जन्म समय और जन्म स्थान बताएं।`;
        }
        if (isHinglish) {
          return `Videsh yatra ya foreign settlement ke yog dekhne ke liye 9th aur 12th house ka vishleshan hota hai. Timing ke liye kripya Date of Birth, Birth Time aur Birth City share karo.`;
        }
        return `Foreign travel and international settlement are analyzed through the 9th and 12th houses. Please share your Date of Birth, Time of Birth, and Birth City.`;
      }

      if (isHindi) {
        return `आपकी कुंडली में नवम और द्वादश भाव पर शुभ प्रभाव विदेश यात्रा और वहां नए अवसरों के अच्छे संकेत दे रहा है।`;
      }
      if (isHinglish) {
        return `Tumhari kundli mein 9th aur 12th house par positive transit foreign travel aur global opportunity ko support kar raha hai.`;
      }
      return `Supportive transits on your 9th and 12th houses indicate positive windows for overseas travel and opportunities.`;
    }

    // 13. Finance & Wealth
    if (
      intents.primary === CoreIntent.FINANCE_GENERAL ||
      intents.primary === CoreIntent.WEALTH_TIMING ||
      intents.primary === CoreIntent.DEBT_EXPENSES ||
      intents.primary === CoreIntent.INVESTMENT_GUIDANCE
    ) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `आर्थिक स्थिति और धन लाभ के योग देखने के लिए कृपया अपनी जन्म तिथि (Date of Birth), जन्म समय और जन्म स्थान बताएं।`;
        }
        if (isHinglish) {
          return `Financial stability aur dhan labh ke yog dekhne ke liye Date of Birth, Birth Time aur Birth City share karo.`;
        }
        return `To evaluate your wealth houses and financial timing, please share your Date of Birth, Time of Birth, and Birth City.`;
      }

      if (isHindi) {
        return `धन भाव (द्वितीय व एकादश भाव) की स्थिति दर्शाती है कि आगामी समय में आर्थिक स्थिरता में सुधार होगा। अनावश्यक खर्चों से बचें।`;
      }
      if (isHinglish) {
        return `Tumhare 2nd aur 11th house ki sthiti ke anusaar aane wale time mein income stability improve hogi. Abhi impulsive kharchon se bacho.`;
      }
      return `Looking at your 2nd and 11th houses, steady stabilization in financial flow is indicated over the coming months.`;
    }

    // 14. Property & Vehicle
    if (intents.primary === CoreIntent.PROPERTY_VEHICLE) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `भूमि, मकान या वाहन के शुभ योग देखने के लिए कृपया अपनी जन्म तिथि (Date of Birth), जन्म समय और जन्म स्थान बताएं।`;
        }
        if (isHinglish) {
          return `Property ya vehicle purchase ke shubh yog dekhne ke liye Date of Birth, Birth Time aur Birth City share karo.`;
        }
        return `Please share your Date of Birth, Time of Birth, and Birth City to evaluate property and vehicle acquisition timing.`;
      }

      if (isHindi) {
        return `आपकी कुंडली के चतुर्थ भाव और मंगल-शुक्र की स्थिति के अनुसार संपत्ति व वाहन के अनुकूल योग बन रहे हैं।`;
      }
      if (isHinglish) {
        return `Tumhari kundli mein 4th house aur Mars-Venus factors property ya vehicle acquisition ke favorable yog bana rahe hain.`;
      }
      return `Your 4th house alongside Mars and Venus placements indicates auspicious periods for property or vehicle acquisition.`;
    }

    // 15. Daily Horoscope
    if (
      intents.primary === CoreIntent.DAILY_HOROSCOPE ||
      intents.primary === CoreIntent.TODAY_GUIDANCE ||
      /\b(rashifal|rashi phal|horoscope|aaj ka rashifal|today rashifal|daily horoscope)\b/i.test(q)
    ) {
      if (isHindi) {
        return `आज का राशिफल और ग्रह स्थिति जानने के लिए कृपया अपनी राशि बताएं या जन्म विवरण साझा करें।`;
      }
      if (isHinglish) {
        return `Aaj ka rashifal aur daily planetary guidance ke liye apni rashi batao ya Date of Birth share karo.`;
      }
      return `To share your daily horoscope and planetary guidance, please tell me your zodiac sign (Rashi) or Date of Birth.`;
    }

    // 16. General Life Reading & Period Forecasts
    if (
      intents.primary === CoreIntent.GENERAL_LIFE_READING ||
      intents.primary === CoreIntent.DASHA_ANALYSIS ||
      intents.primary === CoreIntent.PERIOD_FORECAST_6M ||
      intents.primary === CoreIntent.PERIOD_FORECAST_1Y ||
      intents.primary === CoreIntent.REMEDIES_UPAY ||
      intents.primary === CoreIntent.COMPOUND_MARRIAGE_CAREER
    ) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `कुंडली और ग्रह दशा का सटीक विश्लेषण करने के लिए कृपया अपनी जन्म तिथि (Date of Birth), जन्म समय और जन्म स्थान साझा करें।`;
        }
        if (isHinglish) {
          return `Kundli aur grah dasha ka sahi vishleshan karne ke liye mujhe tumhari Date of Birth, exact Time of Birth aur Birth City chahiye. Ye details share karo taaki shuru kar sakein.`;
        }
        return `To analyze your birth chart and planetary periods accurately, please share your Date of Birth, exact Time of Birth, and Birth City.`;
      }

      if (isHindi) {
        return `आपकी कुंडली में लग्न और त्रिकोण भावों की स्थिति सकारात्मक है। वर्तमान दशा चक्र निरंतर प्रयास और धैर्य के साथ आगे बढ़ने का संकेत दे रहा है। आप मुख्य रूप से किस विषय पर मार्गदर्शन चाहते हैं?`;
      }
      if (isHinglish) {
        return `Tumhari kundli mein Lagna aur Trikona houses ki sthiti positive hai. Current dasha steady effort ke sath aage badhne ka signal de rahi hai. Sabse pehle kis area ko explore karein—career ya relationship?`;
      }
      return `Your ascendant and trine houses reflect positive potential. What area of life would you like to explore first—career or relationship?`;
    }

    // 17. Default Conversational Fallback
    if (isHindi) {
      return `बताइए, किस विषय पर विचार चल रहा है आपके मन में?`;
    }
    if (isHinglish) {
      return `Batao, kis vishay par vichaar chal raha hai tumhare mann mein?`;
    }
    return `Please share what is on your mind today.`;
  },
};
