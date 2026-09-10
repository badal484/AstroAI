export interface ShastraAphorism {
  id: string;
  source: string;
  topic: string;
  sanskrit: string;
  transliteration: string;
  englishMeaning: string;
  hindiMeaning: string;
  applicationGuideline: string;
}

export const SHASTRA_CORPUS: ShastraAphorism[] = [
  {
    id: 'bphs-kendra-trikona',
    source: 'Brihat Parashara Hora Shastra (Adhyaya 11)',
    topic: 'career',
    sanskrit: 'केन्द्रत्रिकोणेशसम्बन्धो राजयोगकरः स्मृतः।',
    transliteration: 'Kendra-trikoneśa-sambandho rāja-yoga-karaḥ smṛtaḥ.',
    englishMeaning:
      'The mutual association of lords of Kendra (action/quadrant) and Trikona (fortune/trine) houses creates the highest auspicious Raja Yoga.',
    hindiMeaning:
      'केन्द्र और त्रिकोण भावों के स्वामियों का शुभ संबंध जातक के जीवन में प्रबल राजयोग और अधिकार की स्थापना करता है।',
    applicationGuideline:
      'Quote when explaining why professional status and authority will rise after a temporary struggle.',
  },
  {
    id: 'saravali-shani-maturity',
    source: 'Saravali of Kalyanavarma (Chapter 30)',
    topic: 'career',
    sanskrit: 'शनिः परिपक्वकर्मफलप्रदाता धैर्येण सिद्धिं ददाति।',
    transliteration: 'Śaniḥ paripakva-karmaphala-pradātā dhairyeṇa siddhiṁ dadāti.',
    englishMeaning:
      'Saturn grants the ripened fruit of karma only after testing humility, endurance, and operational patience.',
    hindiMeaning:
      'शनि देव धैर्य और कठिन परिश्रम की परीक्षा लेकर ही स्थायी और सुदृढ़ सफलता प्रदान करते हैं।',
    applicationGuideline:
      'Quote when a seeker feels frustrated by delays or career stagnation during Saturn transit or dasha.',
  },
  {
    id: 'phaladeepika-guru-drishti',
    source: 'Phaladeepika of Mantreswara (Adhyaya 4)',
    topic: 'general',
    sanskrit: 'जीवदृष्ट्या हतं सर्वं दोषजालं विनश्यति।',
    transliteration: 'Jīva-dṛṣṭyā hataṁ sarvaṁ doṣa-jālaṁ vinaśyati.',
    englishMeaning:
      'The sacred aspect (Drishti) of Jupiter destroys thousands of planetary afflictions and dissolves impending malefic karmas.',
    hindiMeaning:
      'बृहस्पति (गुरु) की अमृतमयी दृष्टि समस्त ग्रह दोषों के जाल को नष्ट कर कल्याण करती है।',
    applicationGuideline:
      'Quote when Jupiter is casting a 5th, 7th, or 9th aspect on afflicted houses to offer profound hope.',
  },
  {
    id: 'bphs-kalatra-sukha',
    source: 'Brihat Parashara Hora Shastra (Adhyaya 14)',
    topic: 'relationship',
    sanskrit: 'कलत्रभावनाथे शुभयुते दृष्टे वा दाम्पत्यसौख्यम्।',
    transliteration: 'Kalatra-bhāvanāthe śubha-yute dṛṣṭe vā dāmpatya-saukhyam.',
    englishMeaning:
      'When the 7th lord of partnership is conjoined or aspected by natural benefics (Venus/Jupiter), marital harmony is assured after the clearing of transit fog.',
    hindiMeaning:
      'सप्तमेश पर शुभ ग्रहों की दृष्टि होने से वैवाहिक जीवन में समझ, प्रेम और सामंजस्य की पुनर्स्थापना होती है।',
    applicationGuideline:
      'Quote when analyzing relationship misunderstandings and assuring the seeker of upcoming reconciliation.',
  },
  {
    id: 'tajika-ithasala-prashna',
    source: 'Tajika Neelakanthi (Prashna Tantra)',
    topic: 'prashna',
    sanskrit: 'शीघ्रगतेर्मन्दगतेश्च दीप्तांशयोगे फलसिद्धिः।',
    transliteration: 'Śīghra-gater-manda-gateśca dīptāṁśa-yoge phala-siddhiḥ.',
    englishMeaning:
      'When the faster planet approaches the slower planet within their orb of light (Ithasala Yoga), the desire is fulfilled without delay.',
    hindiMeaning:
      'जब लग्नेश और कार्येश के मध्य शुभ इत्थशाल योग बनता है, तो कार्य की सिद्धि निश्चित समय में होती है।',
    applicationGuideline:
      'Quote during Horary Prashna readings when predicting positive outcomes for exams, interviews, or deals.',
  },
  {
    id: 'jataka-parijata-dhana',
    source: 'Jataka Parijata (Adhyaya 7)',
    topic: 'wealth',
    sanskrit: 'धनेशे लाभगे वापि लाभेशे धनगे सति महाधनयोगः।',
    transliteration: 'Dhaneśe lābhage vāpi lābheśe dhanage sati mahā-dhana-yogaḥ.',
    englishMeaning:
      'When the 2nd lord of accumulated wealth and the 11th lord of recurring gains exchange houses or aspect, an unbreakable Dhana Yoga is formed.',
    hindiMeaning:
      'द्वितीयेश और एकादशेश का परस्पर संबंध जीवन में अखंड धन और आय के नए स्रोत खोलता है।',
    applicationGuideline:
      'Quote when analyzing wealth flow, investments, or relief from debt traps.',
  },
];

export const shastraPramana = {
  /**
   * Find relevant scriptural aphorism based on topic and planetary context
   */
  getRelevantAphorism(topic: string): ShastraAphorism | null {
    const t = topic.toLowerCase();
    let match = SHASTRA_CORPUS.find((item) => item.topic === t);
    if (!match) {
      match = SHASTRA_CORPUS.find((item) => item.topic === 'general') || SHASTRA_CORPUS[0];
    }
    return match ?? null;
  },

  getAllAphorisms(): ShastraAphorism[] {
    return SHASTRA_CORPUS;
  },
};
