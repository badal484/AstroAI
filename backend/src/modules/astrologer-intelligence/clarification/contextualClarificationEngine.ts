import type { ActiveConversationState } from '../context/conversationStateManager';
import type { NormalizedMessageResult } from '../normalizer/messageNormalizer';

export interface ContextualClarificationResult {
  question: string;
  responseMode: 'PRACTICAL_CONVERSATION' | 'EMOTIONAL_SUPPORT' | 'CONTEXTUAL_CLARIFICATION' | 'NO_ASTROLOGY';
  confidence: number;
}

export const contextualClarificationEngine = {
  /**
   * Generates an authentic, context-aware conversational response
   * WITHOUT defaulting to generic astrology menus ("personal life, career ya kuch aur?").
   */
  generateClarification(
    normalized: NormalizedMessageResult,
    _state: ActiveConversationState,
  ): ContextualClarificationResult {
    const text = normalized.normalized.toLowerCase().trim();
    const lang = normalized.detectedLanguage;

    // 0. Safety / Dignified Vedic Boundaries (Sexual / Explicit Inappropriate Requests)
    if (
      /\b(sex|sax|sax sux|nude|nudes|porn|porno|chudai|sambhog|intercourse|masturbat|masturbation|send pics|boobs|penis|vagina|horny|lust|kamvasna|kaam vasna)\b/i.test(
        text,
      ) ||
      /(सेक्स|संभोग|हस्तमैथुन|अश्लील|नग्न|कामवासना)/.test(text)
    ) {
      if (lang === 'hi') {
        return {
          question:
            'वैदिक ज्योतिष एक पवित्र आध्यात्मिक शास्त्र है जो जन्म कुंडली, ग्रह दशा और जीवन के कल्याण के लिए है। मैं केवल कुंडली, कर्म और विवाह/संबंधों के ज्योतिषीय योग पर मार्गदर्शन देता हूँ। यदि कुंडली या जीवन से संबंधित कोई प्रश्न हो तो बताएं।',
          responseMode: 'NO_ASTROLOGY',
          confidence: 1.0,
        };
      }
      if (lang === 'hinglish') {
        return {
          question:
            'Vedic Jyotish ek shastriya aur pavitra vidya hai jo kundli, karm aur jeevan margdarshan ke liye hai. Main keval janam kundli, grah dasha aur vivah/rishton ke anukool yog par charcha karta hoon. Agar kundli ya jeevan ke vishay mein koi prashna ho toh batayein.',
          responseMode: 'NO_ASTROLOGY',
          confidence: 1.0,
        };
      }
      return {
        question:
          'Vedic Jyotish is a sacred spiritual science dedicated to birth chart analysis, karmic transits, and life guidance. I only provide consultations on horoscope, planetary dashas, and relationship alignments. Please let me know if you have questions about your chart.',
        responseMode: 'NO_ASTROLOGY',
        confidence: 1.0,
      };
    }

    // 1. User Frustration or Abuse ("Tu kya bakwas kar raha hai", "lawda") (Phase 14)
    if (
      /\b(lawda|lauda|loda|chutiya|chutiye|gandu|gaandu|bhosdike|bhosadi|madarchod|motherfucker|chup kar|bakwas|bakwaas|tu kya bakwas|kya bakwas hai|shut up|stupid|idiot|harami|kamine|bewakoof|pagal hai kya)\b/i.test(
        text,
      )
    ) {
      if (lang === 'en') {
        return {
          question: "It seems you are frustrated. That is completely okay—tell me directly what felt unhelpful or inaccurate.",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      if (lang === 'hi') {
        return {
          question: "लगता है आप थोड़ा परेशान या नाराज हैं। कोई बात नहीं—सीधा बताइए कि आपको क्या बात गलत लगी।",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      return {
        question: "Lagta hai aap irritate ho. Koi baat nahi—seedha bataiye kya galat laga.",
        responseMode: 'PRACTICAL_CONVERSATION',
        confidence: 0.98,
      };
    }

    // 2. User Dismissal ("Nothing", "Kuch nahi", "Chhod", "Chhodo", "Rehne do") (Phase 4)
    if (/^(nothing|kuch nahi|kuch nhi|leave it|never mind|nevermind|forget it)[!.,\s]*$/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Alright. Whenever you feel like talking, feel free to share directly.",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      if (lang === 'hi') {
        return {
          question: "ठीक है। जब मन हो, जो भी बात है सीधा बता देना।",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      return {
        question: "Theek hai. Jab mann ho, jo bhi baat hai seedha bata dena.",
        responseMode: 'PRACTICAL_CONVERSATION',
        confidence: 0.98,
      };
    }

    if (/^(chhod|chhodo|chhod yaar|chhor|chhoro|rehne do|rehnde|rehnedo|bas rehne do)[!.,\s]*$/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Alright.",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      if (lang === 'hi') {
        return {
          question: "ठीक है।",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      return {
        question: "Theek hai.",
        responseMode: 'PRACTICAL_CONVERSATION',
        confidence: 0.98,
      };
    }

    // 3. User Continuation Prompt ("Boliye", "Bolo", "Bataiye", "Batao", "Suno") (Phase 4)
    if (/^(boli|boliye|bolo|batao|bataiye|suno|sun raha hu|haan boliye|haan bolo|sunao|kaho|kahiye)[!.,\s]*$/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Yes, go ahead. I am listening. Whatever is on your mind, you can share directly.",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      if (lang === 'hi') {
        return {
          question: "हाँ, बोलिए। मैं सुन रहा हूँ। जो भी मन में है, सीधा बता सकते हैं।",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.98,
        };
      }
      return {
        question: "Haan, boliye. Main sun raha hoon. Jo bhi mann mein hai, seedha bata sakte hain.",
        responseMode: 'PRACTICAL_CONVERSATION',
        confidence: 0.98,
      };
    }

    // 4. Short Negation ("Nahi") answering previous question (Phase 4)
    if (/^(nahi|nhi|na|no|nope)[!.,\s]*$/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Alright, understood.",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "ठीक है, समझ गया।",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.95,
        };
      }
      return {
        question: "Theek hai, samajh gaya.",
        responseMode: 'PRACTICAL_CONVERSATION',
        confidence: 0.95,
      };
    }

    // 5. Short Affirmation ("Haan", "Yes", "Okay") (Phase 4)
    if (/^(haan|ha|haa|h|hn|yes|yeah|sure|theek hai|thik hai|ok|okay)[!.,\s]*$/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Understood.",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "जी, समझ गया।",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.95,
        };
      }
      return {
        question: "Samajh gaya.",
        responseMode: 'PRACTICAL_CONVERSATION',
        confidence: 0.95,
      };
    }

    // 6. Ambiguous Physical Incident ("Road mein kyu gir gaya") (Phase 15)
    if (/road.*(gir|slip|accident|gaya)|(gir|slip).*road|kharab/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Oh no! Did you get hurt? Are you referring to literally falling on the road, or in the context of another situation?",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "अरे! चोट तो नहीं लगी? आप सचमुच सड़क पर गिरने की बात कर रहे हैं, या किसी अन्य परिस्थिति के संदर्भ में?",
          responseMode: 'PRACTICAL_CONVERSATION',
          confidence: 0.95,
        };
      }
      return {
        question: "Arre! Pehle yeh batao kahin chot toh nahi aayi na? Aap literally road par girne ki baat kar rahe hain, ya kisi aur situation ke sense mein?",
        responseMode: 'PRACTICAL_CONVERSATION',
        confidence: 0.95,
      };
    }

    // 7. Substance / Casual Venting ("Daru ka mann h") (Phase 7: NO ASTROLOGY)
    if (/daru|daaru|beer|alcohol|sharab|peene/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Sometimes in stress or exhaustion, one feels like unwinding like that. Did something specific happen today?",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "कभी-कभी तनाव या थकान में ऐसा मन कर सकता है। आज कुछ विशेष हुआ है क्या?",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      return {
        question: "Kabhi-kabhi stress ya thakan mein aisa mann kar sakta hai. Aaj kuch hua hai kya?",
        responseMode: 'NO_ASTROLOGY',
        confidence: 0.95,
      };
    }

    // 8. Hunger ("Bhook lagi hai") (Phase 7: NO ASTROLOGY)
    if (/bhook|bhookh|hungry/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Then please grab something good to eat first! Nutrition and vitality come first.",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "तो पहले कुछ अच्छा खा लीजिए! सेहत और ऊर्जा सबसे पहले जरूरी है।",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      return {
        question: "Toh pehle kuch achha kha lijiye! Sehat sabse pehle zaroori hai.",
        responseMode: 'NO_ASTROLOGY',
        confidence: 0.95,
      };
    }

    // 9. Broken phone ("Phone toot gaya") (Phase 7: NO ASTROLOGY)
    if (/phone toot|phone tut|mobile toot|phone break/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Oh no! Phone breaking is really inconvenient. Is the screen damaged or did it stop turning on?",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "अरे! फोन टूटना काफी परेशान करने वाला होता है। स्क्रीन टूटी है या चालू नहीं हो रहा?",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      return {
        question: "Arre! Phone toot gaya? Kaafi inconvenient ho jata hai. Screen tooti hai ya switch off ho gaya?",
        responseMode: 'NO_ASTROLOGY',
        confidence: 0.95,
      };
    }

    // 10. Traffic ("Aaj traffic bahut tha") (Phase 7: NO ASTROLOGY)
    if (/traffic/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Traffic can be truly exhausting. Are you home safely now or still on the road?",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "ट्रैफिक वाकई काफी थका देता है। अब घर पहुंच गए या अभी भी रास्ते में हैं?",
          responseMode: 'NO_ASTROLOGY',
          confidence: 0.95,
        };
      }
      return {
        question: "Traffic sach mein thaka deta hai. Ghar pahunch gaye ya abhi bhi raste mein ho?",
        responseMode: 'NO_ASTROLOGY',
        confidence: 0.95,
      };
    }

    // 11. Relationship Distress ("Meri girlfriend mujhse baat nahi kar rahi") (Phase 13: Empathy first)
    if (/girlfriend.*baat nahi|gf.*baat nahi|boyfriend.*baat nahi|bf.*baat nahi|partner.*baat nahi/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "I understand that silence hurts. Did this distance happen suddenly or after a specific disagreement or conversation?",
          responseMode: 'EMOTIONAL_SUPPORT',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "समझ सकता हूँ, जब बात बंद हो तो मन परेशान होना स्वाभाविक है। यह दूरी अचानक आई है या किसी बहस/लड़ाई के बाद?",
          responseMode: 'EMOTIONAL_SUPPORT',
          confidence: 0.95,
        };
      }
      return {
        question: "Samajh sakta hoon, jab ladai ya baat band ho toh mann bechain hota hai. Ye distance achanak hua hai ya kisi argument ke baad?",
        responseMode: 'EMOTIONAL_SUPPORT',
        confidence: 0.95,
      };
    }

    // 12. Breakup / Abandonment ("Meri girlfriend chhod ke chali gayi") (Phase 13)
    if (/chhod ke chali gayi|chhod ke chala gaya|chhod diya|breakup ho gaya/i.test(text)) {
      if (lang === 'en') {
        return {
          question: "Hearing this is genuinely difficult. What are you feeling most intensely right now—anger, sadness, or confusion?",
          responseMode: 'EMOTIONAL_SUPPORT',
          confidence: 0.95,
        };
      }
      if (lang === 'hi') {
        return {
          question: "यह सुनना वास्तव में कठिन है। इस समय सबसे ज्यादा क्या महसूस हो रहा है—गुस्सा, दुख या असमंजस?",
          responseMode: 'EMOTIONAL_SUPPORT',
          confidence: 0.95,
        };
      }
      return {
        question: "Ye sunna genuinely difficult hai. Abhi sabse zyada kya feel ho raha hai—gussa, sadness ya confusion?",
        responseMode: 'EMOTIONAL_SUPPORT',
        confidence: 0.95,
      };
    }

    // 13. General Natural Fallback without generic menus
    if (lang === 'en') {
      return {
        question: "I am listening. Feel free to share what is on your mind.",
        responseMode: 'CONTEXTUAL_CLARIFICATION',
        confidence: 0.8,
      };
    }
    if (lang === 'hi') {
      return {
        question: "हाँ, बताइए। जो भी बात है आप साझा कर सकते हैं।",
        responseMode: 'CONTEXTUAL_CLARIFICATION',
        confidence: 0.8,
      };
    }
    return {
      question: "Haan, batao. Jo bhi baat hai seedha bata sakte ho.",
      responseMode: 'CONTEXTUAL_CLARIFICATION',
      confidence: 0.8,
    };
  },
};
