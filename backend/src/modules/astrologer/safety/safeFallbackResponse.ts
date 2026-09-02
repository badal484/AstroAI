import { SupportedLanguage } from '@astroai/shared-types';

/**
 * Last-resort fixed response used only if a generated response fails
 * safety validation twice in a row (see `astrologer.service.ts`) —
 * guarantees the final output handed back is always safe even if
 * generation itself misbehaves, without ever surfacing the unsafe draft.
 */
const SAFE_FALLBACK_RESPONSES: Record<SupportedLanguage, string> = {
  [SupportedLanguage.ENGLISH]:
    "I want to be careful not to overstate anything here with more certainty than I actually have. Could you tell me a bit more about what you'd like to know, and I'll share what your chart suggests — without promising anything as guaranteed?",
  [SupportedLanguage.HINDI]:
    'मैं यहां कुछ भी ज़रूरत से ज़्यादा पक्के तौर पर नहीं कहना चाहता/चाहती। क्या आप थोड़ा और बता सकते हैं कि आप क्या जानना चाहते हैं? मैं बताऊंगा/बताऊंगी कि आपकी कुंडली क्या संकेत देती है — बिना किसी गारंटी के।',
  [SupportedLanguage.HINGLISH]:
    'Main yahan kuch bhi zaroorat se zyada certain hoke nahi kehna chahta/chahti. Aap thoda aur bata sakte hain ki aap kya jaanna chahte hain? Main batata/batati hoon ki aapki kundli kya suggest karti hai — bina kisi guarantee ke.',
};

export function getSafeFallbackResponse(language: SupportedLanguage): string {
  return SAFE_FALLBACK_RESPONSES[language];
}
