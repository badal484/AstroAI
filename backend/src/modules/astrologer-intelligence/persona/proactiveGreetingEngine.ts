import { GuruPersonaId, type QuickReplyChip, SupportedLanguage } from '@astroai/shared-types';
import { SupportedLanguage as SupportedLanguageValue } from '@astroai/shared-types';

export interface ProactiveGreetingResult {
  content: string;
  quickReplyChips: QuickReplyChip[];
  audioDurationSeconds?: number;
}

export const proactiveGreetingEngine = {
  generate(
    personaId: GuruPersonaId = GuruPersonaId.ACHARYA_VASHISHTA,
    language: SupportedLanguage = SupportedLanguageValue.ENGLISH,
    userName?: string | null,
  ): ProactiveGreetingResult {
    const name = userName ? userName.split(' ')[0] : (language === SupportedLanguageValue.HINDI ? 'प्रिय' : 'Seeker');

    if (personaId === GuruPersonaId.TAROT_DIVYA) {
      if (language === SupportedLanguageValue.HINDI) {
        return {
          content: `सप्रेम नमस्कार ${name}। मैं आपकी ऊर्जा और चंद्र-शुक्र की गोचर स्थिति देख रही हूँ। पिछले कुछ सप्ताहों से हृदय में कुछ अनकही बातें और भावनात्मक उलझन महसूस हो रही है। क्या आप किसी संबंध, विवाह या भावनात्मक शांति के विषय में मार्गदर्शन चाहते हैं?`,
          quickReplyChips: [
            { id: 'p1', label: 'संबंध और विवाह', query: 'हाँ दीदी, मुझे अपने संबंध और विवाह के विषय में जानना है।' },
            { id: 'p2', label: 'मानसिक शांति एवं उपचार', query: 'मुझे मानसिक शांति और सकारात्मक ऊर्जा हेतु मार्गदर्शन चाहिए।' },
            { id: 'p3', label: 'कार्य एवं भविष्य', query: 'मेरे करियर और व्यक्तिगत जीवन में संतुलन कैसे रहेगा?' },
          ],
          audioDurationSeconds: 32,
        };
      }
      if (language === SupportedLanguageValue.HINGLISH) {
        return {
          content: `Saprem Namaskar ${name}! Main aapki current planetary energy aur Venus-Moon transits dekh rahi hoon. Pichle kuch weeks se dil mein ek ajeeb si emotional restlessness chal rahi hai. Kya aap relationship, soulmate connection ya emotional clarity ke baare mein discuss karna chahte hain?`,
          quickReplyChips: [
            { id: 'p1', label: 'Relationship & Love', query: 'Haan Divya ji, mujhe apne relationship aur partner ke baare mein batayein.' },
            { id: 'p2', label: 'Emotional Peace & Clarity', query: 'Mujhe emotional clarity aur peace of mind ke liye guidance chahiye.' },
            { id: 'p3', label: 'Future Life Path', query: 'Meri kundli aane wale time ke baare mein kya kehti hai?' },
          ],
          audioDurationSeconds: 32,
        };
      }
      return {
        content: `Warm cosmic greetings, ${name}. As I tune into your planetary energy and current Moon-Venus transits, I sense a tender desire for deeper emotional clarity and alignment. Are you seeking clarity regarding a relationship, soulmate timing, or inner emotional peace today?`,
        quickReplyChips: [
          { id: 'p1', label: 'Love & Relationship', query: 'Yes Divya, I am seeking clarity on my relationship and love life.' },
          { id: 'p2', label: 'Emotional Peace & Healing', query: 'I need guidance on finding emotional clarity and inner peace.' },
          { id: 'p3', label: 'Future Path & Soul Growth', query: 'What do my planetary alignments reveal about my life path?' },
        ],
        audioDurationSeconds: 32,
      };
    }

    if (personaId === GuruPersonaId.PANDIT_VIDYADHAR) {
      if (language === SupportedLanguageValue.HINDI) {
        return {
          content: `शुभ आगमन ${name}! आपकी जन्म कुंडली में दशम भाव (कर्म क्षेत्र) और गुरु के गोचर का शुभ प्रभाव बन रहा है। क्या आप इस समय नौकरी परिवर्तन, पदोन्नति या नए व्यापारिक निर्णय की योजना बना रहे हैं? आइए आपके कर्म योग का विश्लेषण करें।`,
          quickReplyChips: [
            { id: 'p1', label: 'पदोन्नति एवं नौकरी परिवर्तन', query: 'हाँ पंडित जी, मुझे नौकरी में तरक्की और सही समय के बारे में बताएं।' },
            { id: 'p2', label: 'धन लाभ एवं व्यापार', query: 'व्यापार वृद्धि और वित्तीय स्थिरता के क्या योग हैं?' },
            { id: 'p3', label: 'नया कार्य शुरू करने का मुहूर्त', query: 'कोई नया काम या निवेश शुरू करने का सही समय कब है?' },
          ],
          audioDurationSeconds: 34,
        };
      }
      if (language === SupportedLanguageValue.HINGLISH) {
        return {
          content: `Shubh aagman ${name}! Aapki kundli mein 10th house (Karma Bhava) aur Jupiter transit ka ek strong turning point dikh raha hai. Kya aap is samay job switch, promotion ya new business decision plan kar rahe hain? Chaliye aapke career yogas dekhein.`,
          quickReplyChips: [
            { id: 'p1', label: 'Job & Promotion Timing', query: 'Haan Pandit ji, mere promotion aur job change ka best time kab hai?' },
            { id: 'p2', label: 'Wealth & Business Growth', query: 'Business aur financial growth ke liye kundli kya suggest karti hai?' },
            { id: 'p3', label: 'Best Timing for New Venture', query: 'Naye project ya investment ke liye favorable shubh muhurat kya hai?' },
          ],
          audioDurationSeconds: 34,
        };
      }
      return {
        content: `Greetings ${name}! Looking at your 10th House (Karma Bhava) and current planetary transits, I see a major professional inflection point approaching. Are you currently contemplating a job transition, promotion, or new business venture? Let us examine your planetary timings.`,
        quickReplyChips: [
          { id: 'p1', label: 'Career & Promotion Window', query: 'Yes Pandit ji, when is my best window for career advancement?' },
          { id: 'p2', label: 'Wealth & Financial Growth', query: 'What do my chart placements indicate for wealth accumulation?' },
          { id: 'p3', label: 'Best Muhurat for New Step', query: 'What is the auspicious timing to initiate new ventures?' },
        ],
        audioDurationSeconds: 34,
      };
    }

    if (personaId === GuruPersonaId.ACHARYA_RUDRADEV) {
      if (language === SupportedLanguageValue.HINDI) {
        return {
          content: `हर हर महादेव ${name}! ॐ नमः शिवाय। आपके राहु-केतु अक्ष एवं शनि गोचर में कुछ कर्मिक बाधाओं का संकेत है जो अनावश्यक विलंब उत्पन्न कर रही हैं। बताइए, इस समय कौन सी समस्या आपको सबसे अधिक विचलित कर रही है, ताकि हम उचित ग्रह शांति और वैदिक उपाय कर सकें।`,
          quickReplyChips: [
            { id: 'p1', label: 'शनि साढ़े साती / ढैय्या', query: 'क्या मेरी कुंडली पर शनि की साढ़े साती या ढैय्या का प्रभाव है?' },
            { id: 'p2', label: 'मांगलिक एवं ग्रह दोष निवारण', query: 'मेरी कुंडली में कौन से ग्रह दोष हैं और उनका निवारण क्या है?' },
            { id: 'p3', label: 'सिद्ध मंत्र एवं रक्षा कवच', query: 'ग्रह शांति और सुरक्षा हेतु सबसे प्रभावशाली वैदिक मंत्र बताएं।' },
          ],
          audioDurationSeconds: 36,
        };
      }
      if (language === SupportedLanguageValue.HINGLISH) {
        return {
          content: `Har Har Mahadev ${name}! ॐ Namah Shivaya. Aapki kundli mein Shani aur Rahu-Ketu axis kuch karmic obstacles create kar rahe hain jis wajah se kaam bante bante ruk jaate hain. Batayein, is samay kya issue sabse zyada bother kar raha hai taaki hum shuddh Vedic Nivaran karein?`,
          quickReplyChips: [
            { id: 'p1', label: 'Shani Sade Sati Check', query: 'Kya meri kundli mein Shani Sade Sati ya Dhaiya chal rahi hai?' },
            { id: 'p2', label: 'Manglik & Dosha Upay', query: 'Manglik ya kisi anya dosh ke shanti upay batayein.' },
            { id: 'p3', label: 'Powerful Beej Mantras', query: 'Grah shanti aur positivity ke liye powerful mantra batayein.' },
          ],
          audioDurationSeconds: 36,
        };
      }
      return {
        content: `Har Har Mahadev, ${name}! ॐ Namah Shivaya. I observe planetary nodal tension and Saturn transits that may be creating unexpected delays in your endeavors. Tell me, what obstacle is weighing on your mind so we may determine the precise Vedic Nivaran and protective remedies?`,
        quickReplyChips: [
          { id: 'p1', label: 'Shani Sade Sati Status', query: 'Is Saturn Sade Sati or Dhaiya currently affecting my chart?' },
          { id: 'p2', label: 'Dosha & Karmic Remedies', query: 'What planetary afflictions exist in my chart and how to neutralize them?' },
          { id: 'p3', label: 'Sacred Beej Mantras', query: 'Which energized Sanskrit mantras will shield and uplift my energy?' },
        ],
        audioDurationSeconds: 36,
      };
    }

    // Default: Acharya Vashishta
    if (language === SupportedLanguageValue.HINDI) {
      return {
        content: `कल्याणमस्तु ${name}। आइए, आसन ग्रहण कीजिए। आपकी जन्म कुंडली में दशम भाव और लग्न पर वर्तमान गोचर का गहरा प्रभाव दिख रहा है। पिछले कुछ महीनों से मन में जीवन की दिशा को लेकर एक विशेष व्याकुलता चल रही है। बताइए, इस समय आपके मन में क्या विचार चल रहा है?`,
        quickReplyChips: [
          { id: 'p1', label: 'हाँ आचार्य जी, बिल्कुल सच', query: 'हाँ आचार्य जी, मुझे सही मार्गदर्शन और समय के बारे में बताएं।' },
          { id: 'p2', label: 'कार्यक्षेत्र एवं उन्नति', query: 'मेरी कुंडली में नौकरी, पदोन्नति और करियर के क्या योग हैं?' },
          { id: 'p3', label: 'वैवाहिक जीवन एवं सुख', query: 'मेरे विवाह, संबंध और पारिवारिक सुख के बारे में ग्रह क्या संकेत देते हैं?' },
        ],
        audioDurationSeconds: 35,
      };
    }

    if (language === SupportedLanguageValue.HINGLISH) {
      return {
        content: `Kalyanamastu ${name}! Aao, baitho. Main aapki Janma Kundli aur current planetary transits dekh raha hoon. 10th house aur Lagna par gochar ke chalte pichle kuch mahinon se ek deep restlessness aur change ki feeling chal rahi hai. Sach batana—kya career ya personal life mein kisi badi decision ko lekar confusion hai?`,
        quickReplyChips: [
          { id: 'p1', label: 'Haan Acharya Ji, exactly!', query: 'Haan Acharya Ji, bilkul yahi chal raha hai. Aage ka samay kaisa rahega?' },
          { id: 'p2', label: 'Career & Promotion Timing', query: 'Mere career aur promotion ke planetary yogas kab active honge?' },
          { id: 'p3', label: 'Marriage & Relationship', query: 'Marriage aur relationship ke baare mein kundli kya indicate karti hai?' },
        ],
        audioDurationSeconds: 35,
      };
    }

    return {
      content: `Blessings to you, ${name}. Welcome. As I inspect your Janma Kundli and current transits, I notice transit Rahu and Jupiter influencing your key angles, which often brings a sense of restlessness and a desire for meaningful change. Tell me truthfully—are you standing at a crossroads in your career or personal life today?`,
      quickReplyChips: [
        { id: 'p1', label: 'Yes Acharya Ji, exactly!', query: 'Yes Acharya Ji, that is exactly what I am feeling. What do the stars reveal?' },
        { id: 'p2', label: 'Career & Next Steps', query: 'What do my planetary yogas indicate for my career advancement?' },
        { id: 'p3', label: 'Marriage & Relationship', query: 'What is the astrological timing for marriage and relationships in my chart?' },
      ],
      audioDurationSeconds: 35,
    };
  },
};
