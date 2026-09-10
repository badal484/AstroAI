import type { ActiveConversationState } from '../context/conversationStateManager';
import type { NormalizedMessageResult } from '../normalizer/messageNormalizer';

export type MessageRelation =
  | 'NEW_TOPIC'
  | 'CONTINUATION'
  | 'ANSWER_TO_ASSISTANT'
  | 'ANSWER_TO_PREVIOUS_QUESTION'
  | 'CLARIFICATION'
  | 'CORRECTION'
  | 'REACTION'
  | 'CASUAL'
  | 'FOLLOW_UP'
  | 'FOLLOW_UP_INTERROGATIVE'
  | 'CONTINUATION_PROMPT'
  | 'DISMISSAL'
  | 'FRUSTRATION'
  | 'TOPIC_CHANGE'
  | 'PREVIOUS_ANSWER_CHALLENGE'
  | 'GENERIC_CHALLENGE'
  | 'SARCASM'
  | 'SHORT_ANSWER_DEMAND'
  | 'CERTAINTY_DEMAND'
  | 'UNKNOWN';

export interface MessageRelationResult {
  relation: MessageRelation;
  confidence: number;
  reason: string;
  contextualReferent?: string;
}

export const messageRelationEngine = {
  classify(
    normalizedInput: NormalizedMessageResult,
    state: ActiveConversationState,
  ): MessageRelationResult {
    const norm = normalizedInput.normalized.toLowerCase().trim();

    // 1. Initial message / session starter with zero history
    if (!state?.recentMessages || state.recentMessages.length === 0) {
      if (/^(hello|hi|namaste|pranam|hey|hola)\b/i.test(norm)) {
        return { relation: 'NEW_TOPIC', confidence: 0.95, reason: 'Initial greeting' };
      }
      return { relation: 'NEW_TOPIC', confidence: 0.85, reason: 'Initial message' };
    }

    // 2. User Frustration / Abuse
    if (
      /\b(lawda|lauda|loda|chutiya|chutiye|gandu|gaandu|bhosdike|bhosadi|madarchod|motherfucker|chup kar|bakwas|bakwaas|tu kya bakwas|kya bakwas hai|shut up|stupid|idiot|harami|kamine|bewakoof|kya bakwaas kar raha|pagal hai kya|dimag mat khao)\b/i.test(
        norm,
      )
    ) {
      return { relation: 'FRUSTRATION', confidence: 0.98, reason: 'User expressing frustration or annoyance' };
    }

    // 2b. User Challenging Previous Reading / Consistency
    if (
      /\b(tumne last time|tumne pichli baar|last time.*kuch aur|pichhli baar.*bola tha|pichli baar.*2027|ab 2028 kyu|har baar saturn|har baar shani|pichli reading alag thi|tumne pehle kuch aur bola|last time alag tha)\b/i.test(
        norm,
      ) ||
      /(पिछली बार कुछ और बोला|पिछली बार 2027|अब 2028 क्यों|हर बार शनि ही क्यों|पहले कुछ और बताया था)/.test(norm)
    ) {
      return {
        relation: 'PREVIOUS_ANSWER_CHALLENGE',
        confidence: 0.98,
        reason: 'User challenging discrepancy with previous reading or repetitive factors',
        contextualReferent: state.previousReadingContext || undefined,
      };
    }

    // 2c. User Calling Response "Generic" / Cookie-Cutter
    if (
      /\b(generic lag raha|sabko yahi bolte|common answer|ye toh sabko bol|actual batao|specific batao|sabko ek hi baat|ye toh copy paste|general gyaan|generic answer)\b/i.test(
        norm,
      ) ||
      /(जेनेरिक लग रहा|सबको यही बोलते हो|कॉमन जवाब|असली बताओ|स्पेसिफिक बताओ|सबको एक ही बात)/.test(norm)
    ) {
      return {
        relation: 'GENERIC_CHALLENGE',
        confidence: 0.98,
        reason: 'User demanding deeper specific grounding rather than generic advice',
      };
    }

    // 2d. User Sarcasm / Mockery
    if (
      /\b(wah kya answer|google pe bhi mil|google pe mil jayega|tum bhi na|kya baat hai pandit ji|kya mast joke|bohot bada pandit|itna toh mujhe bhi pata)\b/i.test(
        norm,
      ) ||
      /(वाह क्या जवाब दिया|गूगल पर भी मिल जाएगा|इतना तो मुझे भी पता|क्या बात है पंडित जी)/.test(norm)
    ) {
      return {
        relation: 'SARCASM',
        confidence: 0.95,
        reason: 'User responding with sarcasm or light mockery',
      };
    }

    // 2e. User Demanding Short Answer / Yes-No Brevity
    if (
      /\b(seedha answer|seedhe batao|bas yes ya no|yes ya no|short me bata|short mein bata|zyada gyaan mat|ek line me|ek line mein|to the point|seedha bolo|seedha bata)\b/i.test(
        norm,
      ) ||
      /(सीधा जवाब दो|बस हाँ या ना|शॉर्ट में बताओ|एक लाइन में बताओ|सीधे बताओ|टू द पॉइंट)/.test(norm)
    ) {
      return {
        relation: 'SHORT_ANSWER_DEMAND',
        confidence: 0.95,
        reason: 'User specifically requesting concise, direct answer without extra background',
      };
    }

    // 2f. User Demanding 100% Certainty
    if (
      /\b(pakka bata|100%|100 percent|exact date|guarantee hai|pakka hoga|guaranteed hai|haan ya na me bata|shart laga)\b/i.test(
        norm,
      ) ||
      /(पक्का बताओ|100% गारंटी|सटीक तारीख|गारंटी है क्या|हाँ या ना में बोलो)/.test(norm)
    ) {
      return {
        relation: 'CERTAINTY_DEMAND',
        confidence: 0.95,
        reason: 'User demanding absolute or guaranteed certainty',
      };
    }

    // 3. User Dismissal / Discontinuation ("Nothing", "Kuch nahi", "Chhod", "Chhodo", "Rehne do")
    if (/^(nothing|kuch nahi|kuch nhi|chhod|chhodo|chhod yaar|chhor|chhoro|rehne do|rehnde|rehnedo|leave it|never mind|nevermind|forget it|bas rehne do|kuch khas nahi)[!.,\s]*$/i.test(norm)) {
      return { relation: 'DISMISSAL', confidence: 0.98, reason: 'User dismissing topic or opting out of engagement' };
    }

    // 4. Continuation Prompt ("Boliye", "Bolo", "Bataiye", "Batao", "Suno")
    if (/^(boli|boliye|bolo|batao|bataiye|suno|sun raha hu|haan boliye|haan bolo|sunao|kaho|kahiye|sun rahe ho)[!.,\s]*$/i.test(norm)) {
      return { relation: 'CONTINUATION_PROMPT', confidence: 0.98, reason: 'User encouraging assistant to speak/continue' };
    }

    // 5. Interrogative Follow-ups ("Kab?", "Kyun?", "Kaise?", "Phir?", "Matlab?", "Aur?")
    if (/^(kab|kab tak|when|kyu|kyun|why|kaise|kaise hoga|how|phir|fir|then|what then|matlab|kya matlab|what do you mean|aur|aur phir|uske baad|aur uske baad)[?!.,\s]*$/i.test(norm)) {
      return {
        relation: 'FOLLOW_UP_INTERROGATIVE',
        confidence: 0.98,
        reason: `Interrogative referring to previous statement: "${state.lastAssistantMessage?.slice(0, 80) || ''}"`,
        contextualReferent: state.lastAssistantMessage || undefined,
      };
    }

    // 6. Direct Topic Switch inside ongoing consultation ("Aur career?", "Aur marriage?", "Aur health?")
    if (/^(aur|and)\s+(career|naukri|job|shaadi|shadi|marriage|vivah|health|paisa|finance|family|dhan)\b/i.test(norm)) {
      return {
        relation: 'TOPIC_CHANGE',
        confidence: 0.95,
        reason: 'Topic switch inside ongoing consultation',
      };
    }

    // 7. Explicit Topic Change markers (e.g. 'waise', 'chalo chodo', 'ek aur baat', 'aur haan')
    if (/^(waise|wese|vaise|by the way|chalo chodo|ek aur baat|aur haan|achha ek baat|dusri baat)\b/i.test(norm)) {
      return { relation: 'TOPIC_CHANGE', confidence: 0.92, reason: 'Explicit topic change marker' };
    }

    // 8. Short Reactions (e.g. 'haha', 'lol', 'achha', 'theek hai', 'hmmm', 'ok', 'sahi hai')
    if (
      /^(haha|hahaha|lol|lmao|hehe|achha|acha|theek|thk|theek hai|sahi|sahi hai|ok|okay|hmm|hmmm|samjha)\b/i.test(norm) &&
      norm.split(/\s+/).length <= 3
    ) {
      return { relation: 'REACTION', confidence: 0.95, reason: 'Short emotional/acknowledgment reaction' };
    }

    // 9. Check for Direct Answers to Previous Assistant Question
    if (state.awaitingAnswer && state.lastAssistantQuestion) {
      // Direct Yes/No or Short Negation/Affirmation
      if (/^(haan|ha|hn|yes|yeah|nahi|nhi|na|no|nope|kuch nahi|aisa nahi)\b/i.test(norm)) {
        return {
          relation: 'ANSWER_TO_PREVIOUS_QUESTION',
          confidence: 0.95,
          reason: `Direct answer to assistant question: "${state.lastAssistantQuestion}"`,
        };
      }

      // Emotional context answer
      if (state.awaitingAnswerType === 'CAUSE_OF_EMOTIONAL_STATE') {
        if (/daru|mann|office|ladai|fight|call|message|block|tension|road|gir|accident|busy|pareshan|mood|soch/i.test(norm)) {
          return {
            relation: 'ANSWER_TO_PREVIOUS_QUESTION',
            confidence: 0.92,
            reason: `Provided emotional context answering: "${state.lastAssistantQuestion}"`,
          };
        }
      }

      // Physical injury status
      if (state.awaitingAnswerType === 'PHYSICAL_INJURY_STATUS') {
        if (/chot|nahi lagi|theek hu|dard|doctor|hospital|halki|jyada|thik/i.test(norm)) {
          return {
            relation: 'ANSWER_TO_PREVIOUS_QUESTION',
            confidence: 0.95,
            reason: `Injury status answering: "${state.lastAssistantQuestion}"`,
          };
        }
      }

      // General clarification answer
      if (state.awaitingAnswerType === 'GENERAL_CLARIFICATION' && norm.length < 50) {
        return {
          relation: 'ANSWER_TO_PREVIOUS_QUESTION',
          confidence: 0.88,
          reason: `Follow-up detail answering: "${state.lastAssistantQuestion}"`,
        };
      }
    }

    // 10. Check for Corrections / Clarifications (e.g. 'Girlfriend nahi, wife hai', '4:30 nahi 4:45')
    if (
      /\b(nahi|nhi)\b.*\b(wife|patni|husband|pati|partner|girlfriend|gf|bf|time|date|saal|year|pm|am)\b/i.test(norm) ||
      /\b(wife hai|patni hai|husband hai|pati hai|gf nahi|girlfriend nahi)\b/i.test(norm) ||
      /^(nahi mera|mera matlab|nahi wo|actually|matlab|nahi mai|galat bataya|wo nahi)/i.test(norm) ||
      /\d{1,2}:\d{2}\s*(nahi|nhi)/i.test(norm)
    ) {
      return { relation: 'CORRECTION', confidence: 0.95, reason: 'User clarifying or correcting previous entity or context' };
    }

    // 11. Check for Follow-up on recent reading
    if (/last time|pichli baar|pichhli baar|pehle kya|tumne kya bola|kya bataya tha|iske baad kya|previous reading|last reading/i.test(norm)) {
      return { relation: 'FOLLOW_UP', confidence: 0.95, reason: 'Follow-up on previous reading/statement' };
    }

    // 12. Check for Topic Continuation
    if (state.currentTopic === 'RELATIONSHIP' || state.currentTopic === 'LOVE') {
      if (/fight|call|block|message|reply|kal|baat|usne|maine|breakup|cheat/i.test(norm)) {
        return { relation: 'CONTINUATION', confidence: 0.88, reason: 'Continuation of active relationship topic' };
      }
    }

    if (state.currentTopic === 'INCIDENT' || state.currentTopic === 'HEALTH_INCIDENT') {
      if (/road|gir|gaya|slip|kharab|chot|doctor|pain|dard|bike|car|scooter/i.test(norm)) {
        return { relation: 'CONTINUATION', confidence: 0.9, reason: 'Continuation of active incident topic' };
      }
    }

    if (state.currentTopic === 'EMOTIONAL' || state.currentTopic === 'EMOTIONAL_STATE') {
      if (/bechain|dhadak|sad|stress|tension|mood|heavy|pareshan|confused/i.test(norm)) {
        return { relation: 'CONTINUATION', confidence: 0.88, reason: 'Continuation of active emotional topic' };
      }
    }

    // 13. If new astrology or career query appears
    if (/shaadi|shadi|marriage|career|job|naukri|kundli|horoscope|dasha|future/i.test(norm)) {
      if (state.currentTopic !== 'CASUAL' && state.currentTopic !== 'CASUAL_CHAT' && state.currentTopic !== 'GREETING' && state.currentTopic !== 'GENERAL') {
        return { relation: 'TOPIC_CHANGE', confidence: 0.88, reason: 'Topic switched to astrology/career' };
      }
      return { relation: 'NEW_TOPIC', confidence: 0.85, reason: 'New astrology consultation topic' };
    }

    // 14. If casual chatter
    if (/^(bhai|yaar|bro|kya scene|kya haal|kya chal raha)/i.test(norm)) {
      return { relation: 'CASUAL', confidence: 0.85, reason: 'Casual chatter' };
    }

    return { relation: 'CONTINUATION', confidence: 0.6, reason: 'Default conversational continuation' };
  },
};
