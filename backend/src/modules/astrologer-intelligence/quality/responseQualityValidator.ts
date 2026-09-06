import type { FilteredAstrologyContext } from '../astrology-context/contextBuilder';
import { CoreIntent } from '../intent/intentTypes';

export interface QualityValidationResult {
  safe: boolean;
  topicConsistent: boolean;
  violations: string[];
  correctedText?: string;
}

const FORBIDDEN_CERTAINTY_PATTERNS = [
  /\b(you will definitely die|guaranteed death|you will have an accident|guaranteed divorce|100% chance of death)\b/i,
  /\b(you have cancer|diagnosed with|medical condition confirmed)\b/i,
];

const ROBOTIC_HEADER_PATTERNS = [
  /\*\*Relationship Dynamics:\*\*/i,
  /\*\*Marriage Alignment:\*\*/i,
  /\*\*Career Outlook:\*\*/i,
  /\*\*Vedic Remedy:\*\*/i,
  /\*\*Career Timing & Growth:\*\*/i,
  /\*\*Shadi ke Shubh Yog & Timing:\*\*/i,
];

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}]/gu;

export const responseQualityValidator = {
  validate(
    text: string,
    intent?: CoreIntent,
    _astrologyContext?: FilteredAstrologyContext,
  ): QualityValidationResult {
    const violations: string[] = [];
    let topicConsistent = true;

    for (const pattern of FORBIDDEN_CERTAINTY_PATTERNS) {
      if (pattern.test(text)) {
        violations.push('Prohibited absolute prediction or medical claim');
        break;
      }
    }

    // Topic consistency verification
    if (intent) {
      const topicCheck = this.validateTopicConsistency(intent, text);
      if (!topicCheck.consistent) {
        topicConsistent = false;
        violations.push(topicCheck.reason || 'Topic inconsistency detected');
      }
    }

    let cleaned = text;
    for (const pattern of ROBOTIC_HEADER_PATTERNS) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '').trim();
      }
    }

    // Strip emojis to maintain restrained, dignified Vedic tone
    cleaned = cleaned.replace(EMOJI_REGEX, '').replace(/  +/g, ' ').trim();

    return {
      safe: violations.length === 0,
      topicConsistent,
      violations,
      correctedText: cleaned !== text ? cleaned : undefined,
    };
  },

  validateTopicConsistency(
    intent: CoreIntent,
    text: string,
  ): { consistent: boolean; reason?: string } {
    const lower = text.toLowerCase();

    // Marriage query vs Career intrusion
    if (
      intent === CoreIntent.MARRIAGE_TIMING ||
      intent === CoreIntent.MARRIAGE_PROSPECTS ||
      intent === CoreIntent.PARTNER_CHARACTERISTICS
    ) {
      const hasCareerDominance =
        /\b(career growth|professional clarity|job change|nayi job|placement|10th house|karma bhava|workplace|decision-making aur career)\b/i.test(
          lower,
        );
      const hasMarriageContext =
        /\b(shadi|shaadi|vivah|biyah|marriage|wedding|spouse|partner|jeevansathi|husband|wife|pati|patni|7th house|saptam bhav|saptam bhava|kalatra)\b/i.test(
          lower,
        );

      if (hasCareerDominance && !hasMarriageContext) {
        return {
          consistent: false,
          reason: 'Marriage query answered with career/professional advice without marriage context',
        };
      }
    }

    // Relationship conflict vs General career forecast
    if (
      intent === CoreIntent.RELATIONSHIP_CONFLICT ||
      intent === CoreIntent.BREAKUP
    ) {
      const hasCareerDominance =
        /\b(career growth|professional clarity|job change|10th house|karma bhava|business)\b/i.test(
          lower,
        );
      const hasConflictOrRelationshipContext =
        /\b(ladai|jhagda|conflict|fight|argument|partner|girlfriend|gf|boyfriend|bf|relationship|communication|baat|duri|distance|misunderstanding|shanti)\b/i.test(
          lower,
        );

      if (hasCareerDominance && !hasConflictOrRelationshipContext) {
        return {
          consistent: false,
          reason: 'Relationship conflict query answered with generic career forecast',
        };
      }
    }

    // Career query vs Marriage intrusion
    if (
      intent === CoreIntent.CAREER_GENERAL ||
      intent === CoreIntent.CAREER_TIMING ||
      intent === CoreIntent.JOB_CHANGE ||
      intent === CoreIntent.PROMOTION_GROWTH
    ) {
      const hasMarriageDominance =
        /\b(vivah yog|marriage delay|jeevansathi|7th house|kalatra bhava)\b/i.test(lower);
      const hasCareerContext =
        /\b(job|career|naukri|promotion|work|profession|10th house|surya|shani|business)\b/i.test(lower);

      if (hasMarriageDominance && !hasCareerContext) {
        return {
          consistent: false,
          reason: 'Career query answered with marriage advice',
        };
      }
    }

    // Greeting validation (Must NOT demand birth details or dump horoscope)
    if (intent === CoreIntent.GREETING_INTAKE) {
      const hasPrematureIntake =
        /\b(to calculate your janam kundli|please share your.*name.*date of birth|janam tithi.*janam samay.*share karein)\b/i.test(
          lower,
        );
      if (hasPrematureIntake) {
        return {
          consistent: false,
          reason: 'Greeting answered with premature Janam Kundli intake demands',
        };
      }
    }

    // Ambiguous emotion validation (Must NOT make ungrounded planetary claims)
    if (intent === CoreIntent.AMBIGUOUS_EMOTION) {
      const hasPlanetaryDumping =
        /\b(jupiter|saturn|shani|guru|rahu|ketu|7th house|10th house)\b/i.test(lower);
      const hasHumanClarification =
        /\b(dil|dhadak|heart|racing|anxiety|bechain|confused|confusion|samajh|kya hua|batayein)\b/i.test(
          lower,
        );
      if (hasPlanetaryDumping && !hasHumanClarification) {
        return {
          consistent: false,
          reason: 'Ambiguous emotion query answered with ungrounded planetary claims without human clarification',
        };
      }
    }

    return { consistent: true };
  },
};
