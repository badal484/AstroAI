import type { InteractiveWidget, QuickReplyChip, SupportedLanguage } from '@astroai/shared-types';
import { SupportedLanguage as SupportedLanguageValue } from '@astroai/shared-types';
import { prashnaEngine } from '../astrology-context/prashnaEngine';
import type { FilteredAstrologyContext } from '../astrology-context/contextBuilder';
import type { CoreIntent } from '../intent/intentTypes';

export interface WidgetGenerationInput {
  userMessage: string;
  intent: CoreIntent;
  language: SupportedLanguage;
  astrology: FilteredAstrologyContext;
}

export interface WidgetGenerationOutput {
  interactiveWidget: InteractiveWidget | null;
  quickReplyChips: QuickReplyChip[];
  audioDurationSeconds: number | null;
}

export const interactiveWidgetEngine = {
  synthesize(input: WidgetGenerationInput): WidgetGenerationOutput {
    const text = input.userMessage.toLowerCase();
    const { language, astrology, intent } = input;
    const prashna = prashnaEngine.castPrashna();

    let interactiveWidget: InteractiveWidget | null = null;

    // 1. Detect Temple Puja / Anushthan Queries
    const isPujaBookingQuery =
      /puja|pooja|anushthan|havan|yajna|rudrabhishek|bhat puja|temple|tirtha|prasad|sankalpa/i.test(text);

    // 2. Detect Dasha / Mahadasha / Life-Timeline Queries
    const isDashaQuery =
      /dasha|mahadasha|antardasha|vimshottari|period|life phase|running cycle|planetary cycle/i.test(text);

    // 3. Detect Palmistry / Samudrika Queries
    const isPalmistryQuery =
      /palm|hand|hath|rekha|hastarekha|samudrika|mount|fate line|life line|heart line|head line/i.test(text);

    // 4. Detect Spontaneous Horary / Prashna Queries
    const isDirectPrashnaQuery =
      /prashna|will i|kya hoga|lost|mil jayega|chances of|selection|pass or fail|outcome/i.test(text);

    // 5. Detect Muhurat / Travel / Spontaneous Timing Queries
    const isTimingOrTravelQuery =
      /jana|travel|muhurat|timing|time|kab|date|today|aaj|shuru|start|interview|deal|meeting|buy|purchase/i.test(text);

    // 6. Detect Remedy / Upay / Dosha / Mantra Queries
    const isRemedyQuery =
      /upay|remedy|remedies|mantra|daan|gemstone|ratna|shanti|nivaran|sade sati|manglik|kaal sarp/i.test(text);

    if (isPujaBookingQuery) {
      interactiveWidget = {
        type: 'puja_booking',
        title: language === SupportedLanguageValue.HINDI ? 'वैदिक तीर्थ अनुष्ठान एवं संकल्प' : 'Vedic Temple Puja & Sankalpa',
        subtitle: language === SupportedLanguageValue.HINDI ? 'श्री महाकालेश्वर एवं काशी विश्वनाथ' : 'Sacred Jyotirlinga & Tirtha Sanctuaries',
        data: {
          recommendedPujaId: 'puja-mahamrityunjaya',
          title: 'Maha Mrityunjaya Anushthan & Rudrabhishek',
          templeName: 'Shri Mahakaleshwar Jyotirlinga, Ujjain',
          deity: 'Lord Shiva (Mahakal)',
          startingPriceINR: 1100,
          creditsRequired: 22,
          benefits: ['Ayu Vardhana & Longevity', 'Shield against Maraka Grahas', 'Dispels deep fear & karmic burdens'],
          upcomingTithi: 'Upcoming Pradosham & Somwar Special',
          isLiveStreamAvailable: true,
          isPrasadDeliveryAvailable: true,
        },
      };
    } else if (isDashaQuery) {
      interactiveWidget = {
        type: 'dasha_timeline',
        title: language === SupportedLanguageValue.HINDI ? 'विम्शोत्तरी महादशा एवं जीवन चक्र' : 'Vimshottari Dasha Celestial Timeline',
        subtitle: '120-Year Cyclic Planetary Transit Navigator',
        data: {
          currentMahadasha: 'VENUS (शुक्र महादशा)',
          currentAntardasha: 'JUPITER (गुरु अंतर्दशा)',
          auspiciousScore: 94,
          nature: 'BENEFIC',
          focusKeywords: ['Dhana & Prosperity', 'Spiritual Wisdom', 'Creative Expansion'],
          effects: 'Golden alignment for spiritual ascent, high-value career growth, and wealth.',
          activeRemedy: 'Recite Sri Suktam on Fridays and offer yellow flowers to Brihaspati.',
        },
      };
    } else if (isPalmistryQuery) {
      interactiveWidget = {
        type: 'palmistry_analysis',
        title: language === SupportedLanguageValue.HINDI ? 'हस्तरेखा सामुद्रिक विश्लेषण' : 'Palmistry & Samudrika Reading',
        subtitle: language === SupportedLanguageValue.HINDI ? 'हस्त रेखाएं एवं ग्रह पर्वत' : 'Sacred Palm Lines & Mounts',
        data: {
          hand: 'Right (Dominant)',
          elementalType: 'Earth (Prithvi)',
          overallScore: 89,
          lines: {
            lifeLine: { name: 'Jeevan Rekha', prominence: 'Deep & Unbroken', vitality: 'Strong Prana' },
            heartLine: { name: 'Hridaya Rekha', prominence: 'Extending to Jupiter Mount', quality: 'Devotional & Loyal' },
            headLine: { name: 'Mastiṣka Rekha', prominence: 'Long & Sloping', focus: 'Strategic Foresight' },
            fateLine: { name: 'Bhagya Rekha', prominence: 'Ascending to Saturn', career: 'Self-Earned Rise' },
          },
          mounts: [
            { name: 'Jupiter (Guru)', status: 'Well-Developed', score: 88 },
            { name: 'Sun (Surya)', status: 'Radiant', score: 82 },
            { name: 'Venus (Shukra)', status: 'High Vitality', score: 85 },
          ],
          synthesis: 'Your palm lines confirm strong administrative and strategic foresight with powerful protection from Guru Parvat.',
        },
      };
    } else if (isDirectPrashnaQuery) {
      interactiveWidget = {
        type: 'prashna_chart',
        title: language === SupportedLanguageValue.HINDI ? 'प्रश्न कुंडली एवं फल' : 'Horary Prashna Kundli & Verdict',
        subtitle: `${prashna.prashnaLagna} Lagna • ${prashna.moonNakshatra} Nakshatra`,
        data: {
          prashnaLagna: prashna.prashnaLagna,
          moonNakshatra: prashna.moonNakshatra,
          moonSign: prashna.moonSign,
          verdict: 'Favorable (शुभ फल)',
          verdictBadge: 'favorable',
          timingEstimate: 'Within 18 to 35 days under upcoming transit support',
          yoga: 'Muthasila / Ithasala Yoga (इत्थशाल योग)',
          remedy: 'Offer water to Surya Dev at dawn and recite Om Namah Shivaya 21 times.',
        },
      };
    } else if (isTimingOrTravelQuery) {
      const isAuspicious = prashna.currentChoghadiya.type === 'shubh' || prashna.currentChoghadiya.type === 'amrit' || prashna.currentChoghadiya.type === 'labh';
      interactiveWidget = {
        type: 'muhurat',
        title: language === SupportedLanguageValue.HINDI ? 'आज का शुभ मुहूर्त एवं पंचांग' : 'Today’s Shubh Muhurat & Timings',
        subtitle: language === SupportedLanguageValue.HINDI ? `प्रश्ना लग्न: ${prashna.prashnaLagna}` : `Prashna Lagna: ${prashna.prashnaLagna}`,
        data: {
          prashnaLagna: prashna.prashnaLagna,
          moonNakshatra: prashna.moonNakshatra,
          moonSign: prashna.moonSign,
          rahuKaal: prashna.rahuKaal,
          abhijitMuhurat: prashna.abhijitMuhurat,
          currentChoghadiya: prashna.currentChoghadiya.name,
          favorableDirections: prashna.favorableDirections.join(', '),
          verdict: prashna.verdict,
          rating: isAuspicious ? 'auspicious' : prashna.currentChoghadiya.type === 'char' ? 'moderate' : 'inauspicious',
        },
      };
    } else if (isRemedyQuery) {
      interactiveWidget = {
        type: 'remedy',
        title: language === SupportedLanguageValue.HINDI ? 'वैदिक उपाय एवं मंत्र साधना' : 'Vedic Remedies & Upay',
        subtitle: language === SupportedLanguageValue.HINDI ? 'ग्रह शांति एवं सकारात्मक ऊर्जा' : 'Planetary Harmonization',
        data: {
          mantra: 'ॐ नमः शिवाय || ॐ गं गणपतये नमः',
          targetGraha: 'Brihaspati (Jupiter) & Mangal (Mars)',
          deity: 'Lord Ganesha & Lord Shiva',
          bestDay: 'Monday / Thursday (Somwar / Guruwar)',
          gemstoneOrDaan: 'Feed birds / cows, offer water (Arghya) to Surya Dev at dawn',
          ritual: 'Chant the mantra 108 times during Brahma Muhurat (4:30 AM - 6:00 AM) with a calm mind.',
          sankalpaAvailable: true,
          sankalpaDays: 21,
          dailyChants: 108,
        },
      };
    } else if (astrology.available && astrology.relevantPlanets && astrology.relevantPlanets.length >= 2) {
      // Synthesize planetary strength gauge for key planets
      const planetStrengths = astrology.relevantPlanets.slice(0, 3).map((p, idx) => {
        const score = 60 + ((idx * 17) % 35);
        let status = 'Favorable';
        let color = '#22c55e';
        if (score >= 80) {
          status = 'Exalted / Strong';
          color = '#eab308';
        } else if (score < 50) {
          status = 'Needs Energization';
          color = '#ef4444';
        }
        return {
          planet: p.planet,
          sign: p.sign,
          house: p.house,
          score,
          status,
          color,
        };
      });

      interactiveWidget = {
        type: 'planetary_strength',
        title: language === SupportedLanguageValue.HINDI ? 'ग्रह बल एवं सामर्थ्य' : 'Planetary Strength & Dignity',
        subtitle: language === SupportedLanguageValue.HINDI ? 'सक्रिय ग्रहों का प्रभाव' : 'Active Graha Potency',
        data: {
          planets: planetStrengths,
          overallStrength: '82%',
          primaryBenefic: astrology.relevantPlanets[0]?.planet ?? 'Jupiter',
        },
      };
    } else if (astrology.available && astrology.ascendant) {
      interactiveWidget = {
        type: 'kundli_snapshot',
        title: language === SupportedLanguageValue.HINDI ? 'कुंडली ग्रह स्थिति' : 'Birth Chart Planetary Snapshot',
        subtitle: `${astrology.ascendant.sign} Lagna • ${astrology.moonNakshatra?.name ?? 'Chandra'} Nakshatra`,
        data: {
          ascendant: astrology.ascendant.sign,
          moonNakshatra: astrology.moonNakshatra?.name ?? 'Rohini',
          activeDasha: astrology.currentDasha ? `${astrology.currentDasha.planet} (${astrology.currentDasha.antardasha ?? 'Antar'})` : 'Planetary Dasha Active',
          keyPlanets: astrology.relevantPlanets.slice(0, 4).map((p) => ({
            planet: p.planet,
            sign: p.sign,
            house: p.house,
          })),
        },
      };
    }

    // Generate Contextual Quick-Reply Chips
    const quickReplyChips = generateQuickReplyChips(intent, language, isTimingOrTravelQuery, isRemedyQuery);

    // Audio duration (e.g. 45 seconds for Acharya Vani)
    const audioDurationSeconds = 48;

    return {
      interactiveWidget,
      quickReplyChips,
      audioDurationSeconds,
    };
  },
};

function generateQuickReplyChips(
  _intent: CoreIntent,
  language: SupportedLanguage,
  isTiming: boolean,
  isRemedy: boolean,
): QuickReplyChip[] {
  if (language === SupportedLanguageValue.HINDI) {
    if (isTiming) {
      return [
        { id: 'h1', label: 'शुभ मुहूर्त का विस्तार', query: 'इस कार्य के लिए सबसे उत्तम समय कब रहेगा?', icon: 'sparkles' },
        { id: 'h2', label: 'यात्रा/कार्य हेतु उपाय', query: 'कार्य में पूर्ण सफलता के लिए क्या उपाय करें?', icon: 'om' },
        { id: 'h3', label: 'गोचर ग्रह प्रभाव', query: 'आज के ग्रह गोचर का मेरे ऊपर क्या प्रभाव है?', icon: 'planet' },
      ];
    }
    if (isRemedy) {
      return [
        { id: 'h1', label: 'मंत्र जाप विधि', query: 'इस मंत्र का जाप कितने दिन और किस समय करना चाहिए?', icon: 'om' },
        { id: 'h2', label: 'रत्न एवं दान', query: 'क्या मुझे कोई विशेष रत्न धारण करना चाहिए या दान करना चाहिए?', icon: 'gem' },
        { id: 'h3', label: 'शुभ परिणाम कब मिलेंगे', query: 'इन उपायों का प्रभाव कितने समय में दिखाई देने लगेगा?', icon: 'sparkles' },
      ];
    }
    return [
      { id: 'h1', label: 'शुभ मुहूर्त पूछें', query: 'इस विषय में आगे बढ़ने का शुभ समय कब है?', icon: 'sparkles' },
      { id: 'h2', label: 'सरल वैदिक उपाय', query: 'कृपया इस स्थिति को अनुकूल बनाने हेतु सरल वैदिक उपाय बताएं।', icon: 'om' },
      { id: 'h3', label: 'वर्तमान ग्रह दशा', query: 'मेरी वर्तमान महादशा और अंतर्दशा का इसपर क्या प्रभाव है?', icon: 'planet' },
    ];
  }

  if (language === SupportedLanguageValue.HINGLISH) {
    if (isTiming) {
      return [
        { id: 'hg1', label: 'Shubh Muhurat Details', query: 'Is karye ke liye sabse best timing kab rahegi?', icon: 'sparkles' },
        { id: 'hg2', label: 'Travel & Success Upay', query: 'Karye mein success ke liye kaun sa upay karein?', icon: 'om' },
        { id: 'hg3', label: 'Planetary Transit Impact', query: 'Aaj ke grah gochar ka kya asar rahega?', icon: 'planet' },
      ];
    }
    if (isRemedy) {
      return [
        { id: 'hg1', label: 'Mantra Chanting Ritual', query: 'Is mantra ko kab aur kitni baar chant karna chahiye?', icon: 'om' },
        { id: 'hg2', label: 'Gemstone & Daan Guidance', query: 'Kya mujhe koi gemstone pehanna chahiye ya daan karna chahiye?', icon: 'gem' },
        { id: 'hg3', label: 'Expected Results Timing', query: 'In remedies ka positive effect kab tak dikhega?', icon: 'sparkles' },
      ];
    }
    return [
      { id: 'hg1', label: 'Shubh Muhurat dekhein', query: 'Iske liye shubh muhurat aur timing kya hai?', icon: 'sparkles' },
      { id: 'hg2', label: 'Vedic Remedies & Upay', query: 'Is sthiti ke liye koi shubh Vedic upay aur mantra batayein.', icon: 'om' },
      { id: 'hg3', label: 'Current Dasha Analysis', query: 'Meri current Mahadasha aur Antardasha ka ispar kya impact hai?', icon: 'planet' },
    ];
  }

  // English
  if (isTiming) {
    return [
      { id: 'en1', label: 'Auspicious Window', query: 'What is the most auspicious window to proceed with this?', icon: 'sparkles' },
      { id: 'en2', label: 'Vedic Remedies for Success', query: 'What remedies ensure smooth success and protection?', icon: 'om' },
      { id: 'en3', label: 'Planetary Transit Guidance', query: 'How does today’s planetary transit influence this action?', icon: 'planet' },
    ];
  }
  if (isRemedy) {
    return [
      { id: 'en1', label: 'Mantra Chanting Rules', query: 'What are the rules, time, and count for chanting this mantra?', icon: 'om' },
      { id: 'en2', label: 'Gemstone & Charity Advice', query: 'Are there specific gemstones or charitable offerings recommended for me?', icon: 'gem' },
      { id: 'en3', label: 'Timeline of Positive Shift', query: 'When can I expect to see positive shifts after performing these remedies?', icon: 'sparkles' },
    ];
  }
  return [
    { id: 'en1', label: 'Auspicious Timing', query: 'When is the most favorable time to take action on this?', icon: 'sparkles' },
    { id: 'en2', label: 'Recommended Remedies', query: 'What authentic Vedic remedies or mantras can help harmonize this situation?', icon: 'om' },
    { id: 'en3', label: 'Planetary Dasha Influence', query: 'How is my current planetary dasha shaping this life aspect?', icon: 'planet' },
  ];
}
