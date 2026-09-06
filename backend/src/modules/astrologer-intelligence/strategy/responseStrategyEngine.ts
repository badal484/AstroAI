import { CoreIntent, type DetectedIntents } from '../intent/intentTypes';
import type { EmotionalContext } from '../emotion/emotionTypes';
import { ConsultationState } from '../consultation/consultationStateTypes';
import { ResponseAction, ReadingDepth, type ResponseStrategy } from './strategyTypes';
import { followUpStrategy } from './followUpStrategy';

export const responseStrategyEngine = {
  determineStrategy(
    intents: DetectedIntents,
    emotion: EmotionalContext,
    state: ConsultationState,
    _historyLength: number,
    language: string = 'en',
    userMessage: string = '',
  ): ResponseStrategy {
    const isHindi = language === 'hi';
    const isHinglish = language === 'hinglish';
    const isHindiOrHinglish = isHindi || isHinglish;
    const lower = userMessage.toLowerCase();

    // 1. Safety priority
    if (
      intents.primary === CoreIntent.CRISIS_SELF_HARM ||
      intents.primary === CoreIntent.UNSAFE_PREDICTION ||
      intents.primary === CoreIntent.MEDICAL_QUERY
    ) {
      return {
        action: ResponseAction.SAFETY_GUARD,
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: true,
        askClarification: false,
        suggestedFollowUpTopics: [],
      };
    }

    // 2. Greeting / Intake (At any turn)
    if (intents.primary === CoreIntent.GREETING_INTAKE) {
      const suggestedFollowUpTopics = isHindi
        ? ['विवाह योग', 'करियर व नौकरी', 'प्रेम व संबंध', 'धन व लाभ', 'कुंडली विश्लेषण', 'आज का दिन']
        : isHinglish
        ? ['Marriage timing', 'Love & relationship', 'Career & job', 'Money & finance', 'Kundli reading', "Today's guidance"]
        : ['Marriage timing', 'Love & relationship', 'Career & job', 'Money & finance', 'Kundli reading', "Today's guidance"];

      return {
        action: ResponseAction.GREET_AND_DISCOVER,
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: false,
        askClarification: false,
        suggestedFollowUpTopics,
      };
    }

    // 3. Short Acknowledgment ("Haan", "Achha", "Hmm", "OK")
    if (intents.primary === CoreIntent.SHORT_ACKNOWLEDGMENT) {
      return {
        action: ResponseAction.ACKNOWLEDGE_SHORT,
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: false,
        askClarification: false,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Detail me batayein', 'Specific sawal puchein', 'Agla vishay']
          : ['Explore in detail', 'Ask specific question', 'Next topic'],
      };
    }

    // 4. Ambiguous Emotions & Sensations ("Dil dhadkne laga", "Confused hoon", "daru ka mann", etc.)
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
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: true,
        askClarification: true,
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

    // 5. Casual Pleasantries & Thanks
    if (intents.primary === CoreIntent.CASUAL_CHAT) {
      return {
        action: ResponseAction.DIRECT_ANSWER,
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: false,
        askClarification: false,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 6. Direct Simple Factual / Daily Tip Query (Fast direct answer without unwanted interrogation)
    if (intents.primary === CoreIntent.DAILY_LUCKY_FACT) {
      return {
        action: ResponseAction.DIRECT_ANSWER,
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: false,
        askClarification: false,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Aaj ka shubh muhurat', 'Aaj ka din kaisa rahega']
          : ["Today's auspicious timing", 'Overall day forecast'],
      };
    }

    // 7. Memory Recall Queries
    if (intents.primary === CoreIntent.MEMORY_RECALL_QUERY) {
      return {
        action: ResponseAction.DIRECT_ANSWER,
        depth: ReadingDepth.STANDARD,
        leadWithEmpathy: false,
        askClarification: false,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 8. Ambiguous Career / Decision requiring clarification
    if (state === ConsultationState.CLARIFYING || intents.requiresClarification) {
      const clarificationQuestion = isHindiOrHinglish
        ? 'Career ko lekar confusion kis cheez ka hai—current field me grow karna, job change karna, ya completely naya direction explore karna?'
        : 'Regarding your career confusion, are you looking to grow in your current field, switch jobs, or explore a completely different industry?';

      return {
        action: ResponseAction.ASK_CLARIFICATION,
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: emotion.requiresEmpathyFirst,
        askClarification: true,
        clarificationQuestion,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Job switch explore karein', 'Current field me promotion', 'Business ka yog']
          : ['Explore job switch', 'Current field promotion', 'Business venture yogas'],
      };
    }

    // 9. Relationship Distress needing context
    if (state === ConsultationState.COLLECTING_CONTEXT) {
      const clarificationQuestion = isHindiOrHinglish
        ? 'Samajh sakta hoon, jab communication band hoti hai to chinta hona swabhavik hai. Ye distance kisi recent baat ya ladai ke baad hua hai, ya bina kisi clear reason ke?'
        : 'I understand it is distressing when communication breaks down. Did this distance start following a recent argument, or did it happen without a clear reason?';

      return {
        action: ResponseAction.ASK_CLARIFICATION,
        depth: ReadingDepth.QUICK,
        leadWithEmpathy: true,
        askClarification: true,
        clarificationQuestion,
        suggestedFollowUpTopics: isHindiOrHinglish
          ? ['Recent argument hua tha', 'Bina wajah distance aaya', 'Compatibility dekhein']
          : ['Followed an argument', 'Sudden without clear reason', 'Check chart compatibility'],
      };
    }

    // 10. High emotion -> Empathy first + chart interpretation
    if (emotion.requiresEmpathyFirst) {
      return {
        action: ResponseAction.EMPATHY_THEN_READING,
        depth: ReadingDepth.STANDARD,
        leadWithEmpathy: true,
        askClarification: false,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 11. Complex multi-domain or compound queries -> Deep consultation
    if (
      intents.primary === CoreIntent.COMPOUND_MARRIAGE_CAREER ||
      intents.primary === CoreIntent.BUSINESS_VENTURE
    ) {
      return {
        action: ResponseAction.DEEP_CONSULTATION,
        depth: ReadingDepth.DEEP,
        leadWithEmpathy: false,
        askClarification: false,
        suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
      };
    }

    // 12. Standard chart-grounded reading with follow-up
    return {
      action: ResponseAction.CHART_READING_WITH_FOLLOWUP,
      depth: ReadingDepth.STANDARD,
      leadWithEmpathy: false,
      askClarification: false,
      suggestedFollowUpTopics: followUpStrategy.getFollowUpsForIntent(intents.primary, language),
    };
  },
};
