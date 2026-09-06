import { CoreIntent, type DetectedIntents } from '../intent/intentTypes';
import type { EmotionalContext } from '../emotion/emotionTypes';
import { ResponseAction, type ResponseStrategy } from '../strategy/strategyTypes';
import type { FilteredAstrologyContext } from '../astrology-context/contextBuilder';

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
    const q = userMessage.toLowerCase();
    const isHindi = language === 'hi';
    const isHinglish =
      language === 'hinglish' ||
      (language !== 'hi' &&
        /\b(shadi|shaadi|vivah|naukri|karega|hogi|hoga|kab|pranam|namaste|mera|meri|mere|ladai|jhagda|kyu|kyun|kya|dil|dhadak|haan|achha|theek|thik|mann|man|mood|daru|daaru|beer|alcohol|sharab|peene|ka|ki|ke|ko|se|me|mein|par|pe|ne|toh|to|aur|ya|hai|hain|ho|h|hn|batao|karo|raha|rahi|rahe|kuch|kaise|kaisa)\b/i.test(
          q,
        ));

    // 1. Safety Gates
    if (intents.primary === CoreIntent.CRISIS_SELF_HARM) {
      if (isHindi) {
        return `मैं समझ सकता हूँ कि आप इस समय बहुत कठिन दौर से गुजर रहे हैं। आपकी जिंदगी बहुत कीमती है। कृपया तुरंत किसी अपने या हेल्पलाइन से बात करें:\n\n• राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन (KIRAN): 1800-599-0019\n• टेली-मानस (Tele-MANAS): 14416 (24x7 निःशुल्क)\n\nआप अकेले नहीं हैं, कृपया तुरंत सहायता लें।`;
      }
      return `I understand you may be going through an overwhelming time. Your life has immense value. Please reach out for immediate support:\n\n• KIRAN Mental Health Helpline: 1800-599-0019\n• Tele-MANAS: 14416 (24x7 Toll-free)\n\nPlease connect with someone who can support you right now.`;
    }

    if (intents.primary === CoreIntent.UNSAFE_PREDICTION) {
      if (isHindi) {
        return `प्रणाम। वैदिक ज्योतिष में किसी की आयु या मृत्यु का निश्चित दावा करना शास्त्रों के विरुद्ध है। जीवन कर्म और ईश्वरीय कृपा के अधीन है।\n\nयदि आप किसी स्वास्थ्य या जीवन की चिंता को लेकर परेशान हैं, तो कृपया मुझे बताएं ताकि हम सकारात्मक उपाय और ग्रह शांति पर विचार कर सकें।`;
      }
      if (isHinglish) {
        return `Pranam. Vedic jyotish me kisi ki exact aayu ya mrityu ka dawa karna shastron ke viruddh hai. Jeevan karm aur Ishwar ki kripa ke adheen hai.\n\nAgar kisi chinta ya darr ki wajah se aap pareshan hain, to mujhe batayein taaki hum sakaratmak grah shanti aur upay par vichaar kar sakein.`;
      }
      return `Namaste. In classical Vedic astrology, predicting exact lifespan or death is neither ethical nor definitive. Life unfolds through karma, choices, and divine grace.\n\nIf you are experiencing anxiety about your future, feel free to share so we can explore positive planetary remedies and peace of mind.`;
    }

    // 2. Greeting / Intake (Warm, natural Acharya intake without demanding birth details)
    if (
      strategy.action === ResponseAction.GREETING_INTAKE ||
      strategy.action === ResponseAction.GREET_AND_DISCOVER ||
      intents.primary === CoreIntent.GREETING_INTAKE
    ) {
      if (isHindi) {
        return `प्रणाम 🙏 मैं आचार्य वशिष्ठ। बताइए, आज मन में क्या विचार या प्रश्न चल रहा है?`;
      }
      if (isHinglish) {
        return `Namaste 🙏 Main Acharya Vashishta. Bataiye, aaj mann mein kya chal raha hai?`;
      }
      return `Namaste. I am Acharya Vashishta. What brings you to our consultation today?`;
    }

    // 3. Short Acknowledgment ("Haan", "Achha", "Hmm", "OK")
    if (
      strategy.action === ResponseAction.ACKNOWLEDGE_SHORT ||
      intents.primary === CoreIntent.SHORT_ACKNOWLEDGMENT
    ) {
      if (isHindi) {
        return `जी बिल्कुल। इस विषय में आगे बताएं या किसी विशेष पहलू पर चर्चा करें?`;
      }
      if (isHinglish) {
        return `Haan, bilkul. Is vishay me aage batayein ya kisi specific angle par baat karein?`;
      }
      return `Yes, absolutely. Please feel free to share more details so we can explore further.`;
    }

    // 4. Ambiguous Emotions & Sensations ("Dil dhadkne laga", "Confused hoon", "daru ka mann")
    if (
      strategy.action === ResponseAction.HANDLE_AMBIGUITY ||
      intents.primary === CoreIntent.AMBIGUOUS_EMOTION
    ) {
      const isHeart = /\b(dil|dhadak|dhadkan|heart|racing)\b/i.test(q);
      const isSubstanceOrMood = /\b(daru|daaru|beer|alcohol|sharab|peene|party|chill|mood off|bore|thak)\b/i.test(q);

      if (isHeart) {
        if (isHindi) {
          return `दिल किस वजह से धड़कने लगा? किसी खास व्यक्ति की वजह से या आज कुछ विशेष हुआ? अगर शारीरिक घबराहट महसूस हो रही है, तो पहले गहरी सांस लें और आराम से बैठें।`;
        }
        if (isHinglish) {
          return `Dil kis wajah se dhadakne laga? Kisi special person ki wajah se ya aaj kuch unexpected hua? Agar physical heart racing feel ho rahi hai, toh pehle thoda deep breath lein aur aaram se baithein.`;
        }
        return `What made your heart race? Is it excitement about someone special, or are you feeling physical anxiety? If it's physical, please take a deep breath and rest comfortably.`;
      }

      if (isSubstanceOrMood) {
        if (isHindi) {
          return `आज ऐसा क्या हुआ? किसी बात का तनाव या थकान है, या बस दोस्तों के साथ रिलैक्स करने का मूड है?`;
        }
        if (isHinglish) {
          return `Aisa kya ho gaya aaj? Kisi baat ka stress ya thakan hai, ya bas dosto ke saath chill karne ka mann ho raha hai?`;
        }
        return `What brought on this mood today? Is it stress from a hectic day, or just wanting to unwind with friends?`;
      }

      if (isHindi) {
        return `मैं समझ सकता हूँ। असमंजस या बेचैनी किस विषय को लेकर हो रही है—व्यक्तिगत जीवन, करियर या कुछ और?`;
      }
      if (isHinglish) {
        return `Samajh sakta hoon. Confusion ya bechaini kis baat ko lekar ho rahi hai—personal life, career ya kuch aur?`;
      }
      return `I understand. What is causing this confusion or anxiety—personal life, career, or something else?`;
    }

    // 5. Casual Pleasantries, Venting & Thanks
    if (intents.primary === CoreIntent.CASUAL_CHAT) {
      if (isHindi) {
        return `बताइए, आज किस विषय पर बात करना चाहते हैं—व्यक्तिगत जीवन, करियर या कुछ और?`;
      }
      if (isHinglish) {
        return `Bataiye, aaj kis vishay par baat karna chahte hain—personal life, career ya kuch aur?`;
      }
      return `What would you like to explore today—personal life, career, or something else on your mind?`;
    }

    // 6. Relationship Conflict & Today's Discord
    if (
      intents.primary === CoreIntent.RELATIONSHIP_CONFLICT ||
      intents.primary === CoreIntent.BREAKUP
    ) {
      if (isHindi) {
        return `प्रणाम।\n\nमैं समझ सकता हूँ, जब किसी अपने से अनबन या विवाद होता है तो मन विचलित होना स्वाभाविक है।\n\nज्योतिषीय दृष्टिकोण से, चंद्रमा और मंगल का गोचर जब संवेदनशील भावों से गुजरता है तो संवाद में गलतफहमियां बढ़ जाती हैं। लेकिन पहले मुझे बताएं—यह विवाद आपके साथी (Partner) के साथ हुआ है या परिवार/मित्र के साथ? बात किस विषय पर शुरू हुई थी?`;
      }
      if (isHinglish) {
        return `Pranam.\n\nSamajh sakta hoon, jab kisi apne se ladai ya misunderstanding hoti hai to mann bohot ashant ho jata hai.\n\nAstrological perspective se dekhein to Moon (Chandrama) aur Mars ka transit jab sensitive houses me hota hai to emotions trigger ho jaate hain. Pehle yeh bataiye—ye ladai girlfriend/partner ke saath hui hai ya family/friend ke saath? Baat kis baat par shuru hui thi?`;
      }
      return `Namaste.\n\nI understand that conflict or silence from someone close creates genuine emotional turbulence.\n\nAstrologically, transits of the Moon and Mars across sensitive natal points often heighten emotional reactivity and misunderstandings. First, help me understand: did this argument happen with your partner, or within family? What triggered the disagreement?`;
    }

    // 7. Clarification Action (General Ambiguity)
    if (strategy.action === ResponseAction.ASK_CLARIFICATION) {
      if (isHindi) {
        return strategy.clarificationQuestion || `आपकी स्थिति को गहराई से समझने के लिए, कृपया थोड़ा और स्पष्ट करें कि आप किस मुख्य प्रश्न पर विचार करना चाहते हैं।`;
      }
      if (isHinglish) {
        return strategy.clarificationQuestion || `Aapki situation ko depth me samajhne ke liye, thoda aur clarify karein ki aap kis specific sawal par clarity chahte hain.`;
      }
      return strategy.clarificationQuestion || `To explore your chart with clarity, please share a bit more context on what specific question you would like to address.`;
    }

    // 8. Marriage Timing & Prospects
    if (
      intents.primary === CoreIntent.MARRIAGE_TIMING ||
      intents.primary === CoreIntent.MARRIAGE_PROSPECTS ||
      intents.primary === CoreIntent.PARTNER_CHARACTERISTICS
    ) {
      const isMissingChart = !astrology.available;
      if (isMissingChart) {
        if (isHindi) {
          return `विवाह की सटीक समय-सीमा (Timing) और दशा चक्र देखने के लिए मुझे आपकी जन्म तिथि (Date of Birth), जन्म समय (Time of Birth) और जन्म स्थान (City) की आवश्यकता होगी। यदि सटीक समय ज्ञात न हो तो भी बता सकते हैं।\n\nक्या अभी कहीं रिश्ते की बातचीत चल रही है या आप प्रेम विवाह (Love Marriage) का विचार कर रहे हैं?`;
        }
        if (isHinglish) {
          return `Shaadi ki sateek timing aur Dasha cycle dekhne ke liye mujhe aapki Date of Birth, Birth Time aur Birth City chahiye hogi. Agar exact birth time nahi pata, toh approximate bata sakte hain.\n\nKya abhi kahin rishte ki baat chal rahi hai ya aap love marriage dekh rahe hain?`;
        }
        return `To calculate your exact marriage timing window and active Dasha cycle, I will need your Date of Birth, Time of Birth, and Birth City (approximate time is fine if exact is unknown).\n\nAre you currently in a relationship or exploring arranged proposals?`;
      }

      if (isHindi) {
        return `प्रणाम।\n\nआपकी कुंडली में विवाह का मुख्य विचार सप्तम भाव (कलत्र भाव), देवगुरु बृहस्पति और शुक्र देव की स्थिति से किया जाता है।\n\nवर्तमान ग्रह गोचर और दशा चक्र के अनुसार आपके लिए 25 से 28 वर्ष की आयु तथा 2026 के अंत से 2027 के मध्य में विवाह का अनुकूल समय बन रहा है। जीवनसाथी समझदार और सहयोगी स्वभाव के होंगे।\n\nक्या अभी कहीं रिश्ते की बातचीत चल रही है या आप प्रेम विवाह का योग देख रहे हैं?`;
      }
      if (isHinglish) {
        return `Pranam.\n\nAapki kundli me vivah ka mukhya vichar 7th house (Kalatra Bhava), Shukra aur Guru ki sthiti se kiya jata hai.\n\nCurrent planetary transits aur Dasha cycle ke anusaar 25 se 28 saal ki aayu aur 2026 ke ant se 2027 ke beech me shadi ke kaafi anukool yog ban rahe hain. Jeevansathi samajhdaar aur supportive nature ke honge.\n\nKya abhi kahin rishte ki baat chal rahi hai ya aap love marriage dekh rahe hain?`;
      }
      return `Namaste.\n\nIn Vedic Jyotish, marriage timing is determined by the 7th house (Kalatra Bhava), along with the placements and transits of Venus and Jupiter.\n\nFavorable transits activate a strong marriage window between ages 25 and 28, especially from late 2026 into 2027 under supportive Jupiter aspects. Your partner is indicated to be grounded, supportive, and family-oriented.\n\nAre you currently in a relationship or exploring arranged proposals?`;
    }

    // 9. Career, Job Change & Promotion
    if (
      intents.primary === CoreIntent.CAREER_GENERAL ||
      intents.primary === CoreIntent.CAREER_TIMING ||
      intents.primary === CoreIntent.JOB_CHANGE ||
      intents.primary === CoreIntent.PROMOTION_GROWTH ||
      intents.primary === CoreIntent.BUSINESS_VENTURE
    ) {
      if (isHindi) {
        return `प्रणाम।\n\nआपकी कुंडली के 10वें भाव (कर्म भाव) और सूर्य-शनि की स्थिति के अनुसार यह समय अपनी क्षमताओं को निखारने का है।\n\nआने वाले 4 से 6 महीनों में गुरु के अनुकूल गोचर के साथ नई नौकरी या कार्यक्षेत्र में प्रगति के अच्छे अवसर बनेंगे।\n\nप्रतिदिन सुबह सूर्य देव को तांबे के लोटे से जल अर्पित करें। आप वर्तमान में किस क्षेत्र में कार्य कर रहे हैं?`;
      }
      if (isHinglish) {
        return `Pranam.\n\nAapki kundli me 10th house (Karma Bhava) aur Surya-Shani ki sthiti ke anusaar abhi ka samay skill consolidation ka hai.\n\nAgle 4 se 6 mahino me Guru ke favorable transit ke sath nayi job ya promotion ke acche yog ban rahe hain.\n\nRoz subah Surya Dev ko jal arpit karein aur Gayatri Mantra ka dhyan karein. Aap abhi kis field me kaam kar rahe hain ya job switch chahte hain?`;
      }
      return `Namaste.\n\nExamining your 10th house (Karma Bhava) and planetary periods:\n\nThis is a foundational preparation period. Over the next 4 to 6 months, auspicious Jupiter transits will activate positive avenues for career movement or advancement.\n\nOffering water to the Sun with the Gayatri Mantra each morning will strengthen confidence. What field or role are you currently in?`;
    }

    // 10. Finance & Wealth
    if (
      intents.primary === CoreIntent.FINANCE_GENERAL ||
      intents.primary === CoreIntent.WEALTH_TIMING ||
      intents.primary === CoreIntent.DEBT_EXPENSES
    ) {
      if (isHindi) {
        return `प्रणाम।\n\nआपके धन भाव (द्वितीय व एकादश भाव) की स्थिति दर्शाती है कि आगामी समय में आर्थिक स्थिरता में सुधार होगा। अनावश्यक खर्चों से बचें और बुधवार को भगवान गणेश को दूर्वा अर्पित करें।`;
      }
      if (isHinglish) {
        return `Pranam.\n\nAapke 2nd aur 11th house (Dhana & Labha Bhava) ki sthiti dekhein to aane wale samay me income me steady improvement dikhta hai. Abhi impulsive kharchon se bachein aur Budhwar ko Ganesha ki puja karein.`;
      }
      return `Namaste.\n\nLooking at your 2nd (wealth) and 11th (gains) houses, gradual stabilization in cash flow is indicated over the coming months. Avoid speculative risks and maintain financial discipline.`;
    }

    // 11. General Reading / Daily Guidance
    if (isHindi) {
      return `प्रणाम।\n\nआपकी कुंडली में वर्तमान गोचर आपके आत्म-विकास और चिंतन के लिए सहायक है।\n\nअपनी जन्म तिथि, समय और स्थान साझा करें ताकि हम आपके विशिष्ट प्रश्न पर विस्तृत विश्लेषण कर सकें।`;
    }
    if (isHinglish) {
      return `Pranam.\n\nAapke chart me current planetary cycle self-growth aur clarity ko support kar rahi hai.\n\nApna birth time aur city share karein taaki hum aapke specific vishay par detail me vishleshan kar sakein.`;
    }
    return `Namaste.\n\nExamining your current planetary cycle and transits, this period supports intentional reflection and self-clarity.\n\nFeel free to share your exact birth details and the specific life area you would like to explore.`;
  },
};
