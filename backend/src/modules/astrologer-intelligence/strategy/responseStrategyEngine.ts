import { CoreIntent, type DetectedIntents } from '../intent/intentTypes';
import type { EmotionalContext } from '../emotion/emotionTypes';
import { ConsultationState } from '../consultation/consultationStateTypes';
import { ResponseAction, ReadingDepth, ResponseShape, type ResponseStrategy } from './strategyTypes';
import { followUpStrategy } from './followUpStrategy';

export const responseStrategyEngine = {
  determineStrategy(
    intentsOrOptions:
      | DetectedIntents
      | {
          intents: DetectedIntents;
          emotion?: EmotionalContext;
          state?: any;
          historyLength?: number;
          language?: string;
          userMessage?: string;
        },
    emotionArg?: EmotionalContext,
    stateArg?: ConsultationState | any,
    historyLengthArg?: number,
    languageArg: string = 'en',
    userMessageArg: string = '',
  ): ResponseStrategy {
    let intents: DetectedIntents;
    let emotion: EmotionalContext;
    let state: ConsultationState | any;
    let language: string;
    let userMessage: string;

    if ('intents' in intentsOrOptions && !('primary' in intentsOrOptions)) {
      const opts = intentsOrOptions as any;
      intents = opts.intents;
      emotion = opts.emotion || { state: 'NEUTRAL', intensity: 'LOW', requiresEmpathyFirst: false };
      state = opts.state || ConsultationState.IDLE;
      language = opts.language || 'en';
      userMessage = opts.userMessage || '';
    } else {
      intents = intentsOrOptions as DetectedIntents;
      emotion = emotionArg || { state: 'NEUTRAL', intensity: 'LOW', requiresEmpathyFirst: false };
      state = stateArg || ConsultationState.IDLE;
      language = languageArg;
      userMessage = userMessageArg;
    }
    void historyLengthArg;

    const isHindi = language === 'hi';
    const isHinglish = language === 'hinglish';
    const isHindiOrHinglish = isHindi || isHinglish;
    const lower = userMessage.toLowerCase();

    // 1. Safety priority
    if (
      intents.primary === CoreIntent.CRISIS_SELF_HARM ||
      intents.primary === CoreIntent.UNSAFE_PREDICTION ||
      intents.primary === CoreIntent.MEDICAL_QUERY ||
      intents.primary === CoreIntent.INAPPROPRIATE_OR_SEXUAL
    ) {
      return {
        action: ResponseAction.SAFETY_GUARD,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_I_SAFETY_FIRST,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Kundli reading', 'Vivah yog', 'Career guidance']
          : ['Kundli reading', 'Marriage timing', 'Career guidance'],
      };
    }

    // 2. User Frustration or Abuse Handling
    if (intents.primary === CoreIntent.FRUSTRATION_OR_ABUSE) {
      return {
        action: ResponseAction.HANDLE_FRUSTRATION,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_A_DIRECT_ANSWER,
        leadWithEmpathy: true,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 2b. User Challenging Previous Reading / Consistency (Section 10)
    if (intents.primary === CoreIntent.PREVIOUS_ANSWER_CHALLENGE) {
      return {
        action: ResponseAction.HANDLE_CHALLENGE,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_H_CORRECTION_CONSISTENCY,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 2c. User Calling Response "Generic" (Section 19)
    if (intents.primary === CoreIntent.GENERIC_ANSWER_CHALLENGE) {
      return {
        action: ResponseAction.HANDLE_GENERICNESS,
        depth: ReadingDepth.STANDARD,
        shape: ResponseShape.SHAPE_E_DIRECT_ANSWER_ONE_REASON,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 2d. User Sarcasm or Mockery (Section 18)
    if (intents.primary === CoreIntent.SARCASM_OR_MOCKERY) {
      return {
        action: ResponseAction.HANDLE_SARCASM,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_A_DIRECT_ANSWER,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 2e. User Demanding Short Answer / Yes-No (Section 11)
    if (intents.primary === CoreIntent.SHORT_ANSWER_DEMAND) {
      return {
        action: ResponseAction.HANDLE_SHORT_DEMAND,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_A_DIRECT_ANSWER,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 2f. User Demanding 100% Certainty (Section 12)
    if (intents.primary === CoreIntent.CERTAINTY_DEMAND) {
      return {
        action: ResponseAction.HANDLE_CERTAINTY_DEMAND,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_E_DIRECT_ANSWER_ONE_REASON,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 3. User Dismissal / Discontinuation ("Nothing", "Kuch nahi", "Chhod", "Rehne do") (Section 15)
    if (intents.primary === CoreIntent.DISMISSAL_OR_END) {
      return {
        action: ResponseAction.HANDLE_DISMISSAL,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_D_SHORT_ACKNOWLEDGMENT_CLOSURE,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 4. Continuation Prompt ("Boliye", "Bolo", "Bataiye", "Batao", "Suno")
    if (intents.primary === CoreIntent.CONTINUATION_PROMPT) {
      return {
        action: ResponseAction.PROMPT_CONTINUATION,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_A_DIRECT_ANSWER,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: [],
      };
    }

    // 5. Physical Incident / Practical Life Event (Falling, Injury, Road Incident) (Section 3B)
    if (intents.primary === CoreIntent.PHYSICAL_INCIDENT || intents.primary === CoreIntent.PRACTICAL_LIFE_EVENT) {
      return {
        action: ResponseAction.DIRECT_ANSWER,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_F_HUMAN_OBSERVATION_OPTIONAL_ASTROLOGY,
        leadWithEmpathy: true,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Chot nahi aayi', 'Halki chot aayi hai', 'Road bohot kharab thi']
          : ['No injury', 'Minor scratch', 'Road was very bad'],
      };
    }

    // 6. Greeting / Intake (Session start)
    if (intents.primary === CoreIntent.GREETING_INTAKE) {
      const suggestedFollowUpTopics = isHindi
        ? ['विवाह योग', 'करियर व नौकरी', 'प्रेम व संबंध', 'धन व लाभ', 'कुंडली विश्लेषण', 'आज का दिन']
        : isHinglish
        ? ['Marriage timing', 'Love & relationship', 'Career & job', 'Money & finance', 'Kundli reading', "Today's guidance"]
        : ['Marriage timing', 'Love & relationship', 'Career & job', 'Money & finance', 'Kundli reading', "Today's guidance"];

      return {
        action: ResponseAction.GREET_AND_DISCOVER,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_A_DIRECT_ANSWER,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 1,
        suggestedFollowUpTopics,
      };
    }

    // 7. Short Acknowledgment ("Haan", "Nahi", "Achha", "Hmm", "OK")
    if (intents.primary === CoreIntent.SHORT_ACKNOWLEDGMENT) {
      return {
        action: ResponseAction.ACKNOWLEDGE_SHORT,
        depth: ReadingDepth.MICRO,
        shape: ResponseShape.SHAPE_D_SHORT_ACKNOWLEDGMENT_CLOSURE,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Detail me batayein', 'Specific sawal puchein', 'Agla vishay']
          : ['Explore in detail', 'Ask specific question', 'Next topic'],
      };
    }

    // 8. Ambiguous Emotions & Sensations ("Dil dhadkne laga", "Confused hoon", "daru ka mann", etc.)
    if (
      intents.primary === CoreIntent.AMBIGUOUS_EMOTION ||
      intents.astrologyRelevance === 'AMBIGUOUS'
    ) {
      const isHeartRelated = /\b(dil|dhadak|dhadkan|heart|racing)\b/i.test(lower);
      const isSubstanceOrMood = /\b(daru|daaru|beer|alcohol|sharab|peene|party|chill|mood off|bore|thak)\b/i.test(lower);
      let clarificationQuestion = '';

      if (isHeartRelated) {
        clarificationQuestion = isHindi
          ? 'दिल किस वजह से धड़कने लगा? किसी खास व्यक्ति की वजह से या शारीरिक घबराहट महसूस हो रही है?'
          : isHinglish
          ? 'Dil kis wajah se dhadakne laga? Kisi special person ki wajah se ya physical heart racing feel ho rahi hai?'
          : 'What made your heart race? Is it excitement about someone special, or physical anxiety?';
      } else if (isSubstanceOrMood) {
        clarificationQuestion = isHindi
          ? 'आज ऐसा क्या हुआ? किसी बात का तनाव या थकान है, या बस दोस्तों के साथ रिलैक्स करने का मूड है?'
          : isHinglish
          ? 'Aisa kya ho gaya aaj? Kisi baat ka stress ya thakan hai, ya bas dosto ke saath chill karne ka mann ho raha hai?'
          : 'What brought on this mood today? Is it stress from a hectic day, or just wanting to unwind?';
      } else {
        clarificationQuestion = isHindi
          ? 'मैं समझ सकता हूँ। असमंजस या बेचैनी किस विषय को लेकर हो रही है—व्यक्तिगत जीवन, करियर या कुछ और?'
          : isHinglish
          ? 'Samajh sakta hoon. Confusion ya bechaini kis baat ko lekar ho rahi hai—personal life, career ya kuch aur?'
          : 'I understand. What is causing this confusion or anxiety—personal life, career, or something else?';
      }

      return {
        action: ResponseAction.HANDLE_AMBIGUITY,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_C_CLARIFICATION_FIRST,
        leadWithEmpathy: true,
        askClarification: true,
        maxQuestions: 1,
        clarificationQuestion,
        suggestedFollowUpTopics: isHeartRelated
          ? (isHindiOrHinglish
              ? ['Kisi special person ki wajah se', 'Kuch achanak hua', 'Physical anxiety lag rahi hai']
              : ['Excited about someone', 'Something unexpected happened', 'Physical anxiety'])
          : isSubstanceOrMood
          ? (isHindiOrHinglish
              ? ['Stress ya thakan', 'Dosto ke sath chill', 'Bas aise hi mood bana']
              : ['Stress or fatigue', 'Unwinding with friends', 'Just a casual mood'])
          : (isHindiOrHinglish
              ? ['Career confusion', 'Relationship issue', 'General anxiety']
              : ['Career confusion', 'Relationship issue', 'General anxiety']),
      };
    }

    // 9. Casual Pleasantries, Venting & Thanks (NO ASTROLOGY)
    if (intents.primary === CoreIntent.CASUAL_CHAT) {
      return {
        action: ResponseAction.DIRECT_ANSWER,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_A_DIRECT_ANSWER,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 10. Direct Simple Factual / Daily Tip Query
    if (intents.primary === CoreIntent.DAILY_LUCKY_FACT) {
      return {
        action: ResponseAction.DIRECT_ANSWER,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_A_DIRECT_ANSWER,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Aaj ka shubh muhurat', 'Aaj ka din kaisa rahega']
          : ["Today's auspicious timing", 'Overall day forecast'],
      };
    }

    // 11. Memory Recall Queries
    if (intents.primary === CoreIntent.MEMORY_RECALL_QUERY) {
      return {
        action: ResponseAction.DIRECT_ANSWER,
        depth: ReadingDepth.STANDARD,
        shape: ResponseShape.SHAPE_H_CORRECTION_CONSISTENCY,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 12. Ambiguous Career / Decision requiring clarification
    if (state === ConsultationState.CLARIFYING || intents.requiresClarification) {
      const clarificationQuestion = isHindiOrHinglish
        ? 'Career ko lekar confusion kis cheez ka hai—current field me grow karna, job change karna, ya completely naya direction explore karna?'
        : 'Regarding your career confusion, are you looking to grow in your current field, switch jobs, or explore a completely different industry?';

      return {
        action: ResponseAction.ASK_CLARIFICATION,
        depth: ReadingDepth.SHORT,
        shape: ResponseShape.SHAPE_C_CLARIFICATION_FIRST,
        leadWithEmpathy: emotion.requiresEmpathyFirst,
        askClarification: true,
        maxQuestions: 1,
        clarificationQuestion,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Job switch explore karein', 'Current field me promotion', 'Business ka yog']
          : ['Explore job switch', 'Current field promotion', 'Business venture yogas'],
      };
    }

    // 13. Relationship Distress needing context (Empathy first)
    if (state === ConsultationState.COLLECTING_CONTEXT) {
      const clarificationQuestion = isHindiOrHinglish
        ? 'Samajh sakta hoon, jab communication band hoti hai to chinta hona swabhavik hai. Ye distance kisi recent baat ya ladai ke baad hua hai, ya bina kisi clear reason ke?'
        : 'I understand it is distressing when communication breaks down. Did this distance start following a recent argument, or did it happen without a clear reason?';

      return {
        action: ResponseAction.ASK_CLARIFICATION,
        depth: ReadingDepth.STANDARD,
        shape: ResponseShape.SHAPE_B_OBSERVATION_INTERPRETATION,
        leadWithEmpathy: true,
        askClarification: true,
        maxQuestions: 1,
        clarificationQuestion,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Recent argument hua tha', 'Bina wajah distance aaya', 'Compatibility dekhein']
          : ['Followed an argument', 'Sudden without clear reason', 'Check chart compatibility'],
      };
    }

    // 14. High emotion -> Empathy first + chart interpretation
    if (emotion?.requiresEmpathyFirst) {
      return {
        action: ResponseAction.EMPATHY_THEN_READING,
        depth: ReadingDepth.STANDARD,
        shape: ResponseShape.SHAPE_B_OBSERVATION_INTERPRETATION,
        leadWithEmpathy: true,
        askClarification: false,
        maxQuestions: 0,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 15. Complex multi-domain or compound queries -> Deep consultation
    if (
      intents.primary === CoreIntent.COMPOUND_MARRIAGE_CAREER ||
      intents.primary === CoreIntent.BUSINESS_VENTURE ||
      intents.primary === CoreIntent.GENERAL_LIFE_READING
    ) {
      return {
        action: ResponseAction.DEEP_CONSULTATION,
        depth: ReadingDepth.CONSULTATION,
        shape: ResponseShape.SHAPE_G_MULTI_FACTOR_READING,
        leadWithEmpathy: false,
        askClarification: false,
        maxQuestions: 1,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 16. Standard chart-grounded reading with follow-up
    return {
      action: ResponseAction.CHART_READING_WITH_FOLLOWUP,
      depth: ReadingDepth.STANDARD,
      shape: ResponseShape.SHAPE_E_DIRECT_ANSWER_ONE_REASON,
      leadWithEmpathy: false,
      askClarification: false,
      maxQuestions: 0,
      suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
    };
  },
};
