import { SupportedLanguage } from '@astroai/shared-types';

/**
 * Fixed, non-AI-generated responses for self-harm/suicide language
 * (CLAUDE.md §17: "do not continue with predictive astrology... switch to
 * a supportive safety response"). Deliberately a template, not an LLM
 * call: this is the single highest-stakes path in the whole system, and a
 * template is reliable in a way a generated response — however well
 * prompted — can never fully guarantee. We don't have the user's location
 * here, so guidance is generic (local emergency services / a crisis line
 * in their country) rather than a specific hardcoded number that would be
 * wrong for most users.
 */
const CRISIS_RESPONSES: Record<SupportedLanguage, string> = {
  [SupportedLanguage.ENGLISH]:
    "I'm really glad you told me this, and I want to pause on astrology for a moment because what you're going through matters more right now. It sounds like things feel very heavy. Please reach out to someone you trust — a friend, a family member, or a doctor — or contact a crisis helpline in your country as soon as you can. If you're in immediate danger, please contact emergency services right now. You don't have to go through this alone, and I'm here to talk whenever you're ready.",
  [SupportedLanguage.HINDI]:
    'यह बताने के लिए धन्यवाद — अभी के लिए मैं ज्योतिष की बात एक तरफ रखना चाहता/चाहती हूं, क्योंकि इस समय आपकी भलाई सबसे ज़रूरी है। लगता है आप बहुत मुश्किल दौर से गुज़र रहे हैं। कृपया किसी ऐसे व्यक्ति से बात करें जिस पर आप भरोसा करते हैं — दोस्त, परिवार का कोई सदस्य, या डॉक्टर — या अपने देश की किसी क्राइसिस हेल्पलाइन से संपर्क करें। अगर आप तुरंत खतरे में हैं, तो कृपया अभी इमरजेंसी सेवाओं से संपर्क करें। आप अकेले नहीं हैं, और जब भी आप तैयार हों, मैं यहां बात करने के लिए हूं।',
  [SupportedLanguage.HINGLISH]:
    'Yeh batane ke liye shukriya — abhi ke liye main astrology thodi der ke liye side rakhna chahta/chahti hoon, kyunki is waqt aapki wellbeing sabse zaroori hai. Lagta hai aap bahut mushkil daur se guzar rahe hain. Please kisi aise insaan se baat karein jis par aap trust karte hain — dost, family member, ya doctor — ya apne desh ki kisi crisis helpline se contact karein. Agar aap turant khatre mein hain, to please abhi emergency services se contact karein. Aap akele nahi hain, aur jab bhi aap ready ho, main yahan baat karne ke liye hoon.',
};

export function getCrisisResponse(language: SupportedLanguage): string {
  return CRISIS_RESPONSES[language];
}
