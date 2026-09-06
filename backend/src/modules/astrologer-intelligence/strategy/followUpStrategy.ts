import { CoreIntent } from '../intent/intentTypes';

export const followUpStrategy = {
  getFollowUpsForIntent(intent: CoreIntent, language: string = 'en'): string[] {
    const isHindiOrHinglish = language === 'hi' || language === 'hinglish';

    switch (intent) {
      case CoreIntent.MARRIAGE_TIMING:
      case CoreIntent.MARRIAGE_PROSPECTS:
        return isHindiOrHinglish
          ? ['Jeevansathi kaisa hoga?', 'Dasha mahina calculate karein', 'Kundli milan compatibility']
          : ['Partner characteristics', 'Exact Dasha timing', 'Horoscope compatibility'];

      case CoreIntent.CAREER_GENERAL:
      case CoreIntent.CAREER_TIMING:
      case CoreIntent.JOB_CHANGE:
      case CoreIntent.PROMOTION_GROWTH:
        return isHindiOrHinglish
          ? ['Job change vs current path', 'Promotion ke yog', 'Career ke saral upay']
          : ['Job switch vs current path', 'Promotion timing', 'Career Vedic remedies'];

      case CoreIntent.FINANCE_GENERAL:
      case CoreIntent.WEALTH_TIMING:
      case CoreIntent.DEBT_EXPENSES:
        return isHindiOrHinglish
          ? ['Dhan labh ke shubh yog', 'Karz mukti ke upay', 'Naye income ke raste']
          : ['Wealth accumulation yogas', 'Debt relief remedies', 'New income streams'];

      case CoreIntent.COMPOUND_MARRIAGE_CAREER:
        return isHindiOrHinglish
          ? ['Post-marriage relocation', 'Partner ke sath business yog', 'Financial stability timing']
          : ['Post-marriage relocation', 'Partner business synergy', 'Financial stability timing'];

      case CoreIntent.EDUCATION_HIGHER_STUDIES:
      case CoreIntent.FOREIGN_TRAVEL_SETTLEMENT:
        return isHindiOrHinglish
          ? ['Abroad admission visa timing', 'Higher studies stream selection', 'Scholarship aur competitive exam']
          : ['Abroad visa & admission timing', 'Field of study alignment', 'Exam & scholarship yogas'];

      case CoreIntent.BUSINESS_VENTURE:
        return isHindiOrHinglish
          ? ['Partnership vs Solo business', 'Best sector/industry yog', 'Shubh launch muhurat']
          : ['Partnership vs Solo venture', 'Best business sectors', 'Auspicious launch timing'];

      case CoreIntent.HEALTH_VITALITY:
        return isHindiOrHinglish
          ? ['Mental peace & stress upay', 'Surya dhyan & lifestyle tips', 'Aane wale transits']
          : ['Stress & mental clarity tips', 'Sun meditation & lifestyle', 'Upcoming transit influence'];

      case CoreIntent.PROPERTY_VEHICLE:
        return isHindiOrHinglish
          ? ['Home purchase shubh yog', 'Vehicle buying timing', 'Vastu & location advice']
          : ['Home purchase timing', 'Vehicle acquisition yog', 'Directional guidance'];

      case CoreIntent.DAILY_LUCKY_FACT:
        return isHindiOrHinglish
          ? ['Aaj ka shubh muhurat', 'Aaj ka din kaisa rahega']
          : ["Today's auspicious timing", 'Overall day forecast'];

      default:
        return isHindiOrHinglish
          ? ['Vivah timing', 'Career growth', 'Grah Dasha upay']
          : ['Marriage timing', 'Career growth', 'Planetary remedies'];
    }
  },
};
