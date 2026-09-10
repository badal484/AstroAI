import type { FilteredAstrologyContext } from '../astrology-context/contextBuilder';
import type { TimingWindow } from './reasoningTypes';

export const timingEngine = {
  calculateTimingWindows(context: FilteredAstrologyContext): TimingWindow[] {
    const { topic, userAge, currentDasha, timeConfidence, available, evidencePacket } = context;
    const windows: TimingWindow[] = [];

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const baseConfidence = !available
      ? 'LOW'
      : timeConfidence === 'exact'
        ? 'HIGH'
        : timeConfidence === 'approximate'
          ? 'MODERATE'
          : 'LOW';

    // 0. High-precision Timing from Round 5 Evidence Packet if available
    if (evidencePacket?.timing) {
      const epTiming = evidencePacket.timing;
      const favorableLevel =
        epTiming.activationLevel === 'VERY_STRONG' || epTiming.activationLevel === 'STRONG'
          ? 'HIGH'
          : epTiming.activationLevel === 'MODERATE'
            ? 'MODERATE'
            : 'NEUTRAL';

      const timingConf =
        epTiming.activationLevel === 'INSUFFICIENT' || epTiming.activationLevel === 'WEAK'
          ? 'LOW'
          : baseConfidence;

      let indicator = `Dasha Support: ${epTiming.dashaSupport} | Transit Support: ${epTiming.transitSupport}`;
      if (topic === 'CAREER' || topic === 'JOB_CHANGE') {
        indicator = `10th house (Karma Bhava) and Dasha period alignment`;
      } else if (topic === 'MARRIAGE' || topic === 'RELATIONSHIP') {
        indicator = `7th house (Kalatra Bhava) and Venus/Jupiter dasha alignment`;
      } else if (topic === 'FINANCE') {
        indicator = `2nd & 11th houses (Dhana & Labha) stimulation`;
      }

      windows.push({
        window: epTiming.primaryWindow,
        windowStart: epTiming.windowStartISO,
        windowEnd: epTiming.windowEndISO,
        planetaryIndicator: indicator,
        favorableLevel,
        confidence: timingConf,
        reason: epTiming.explanation,
        relevantFactors: [epTiming.dashaSupport, epTiming.transitSupport],
      });

      return windows;
    }

    // 1. Dasha-anchored timing if dasha dates are available
    if (currentDasha && currentDasha.startDate && currentDasha.endDate) {
      const dashaLabel = currentDasha.antardasha
        ? `${currentDasha.planet}-${currentDasha.antardasha} Sub-period`
        : `${currentDasha.planet} Mahadasha`;

      if (topic === 'MARRIAGE') {
        const isBeneficForMarriage = ['Venus', 'Jupiter', 'Mercury', 'Moon'].includes(currentDasha.planet) ||
          (currentDasha.antardasha && ['Venus', 'Jupiter', 'Mercury', 'Moon'].includes(currentDasha.antardasha));

        const ageBracket = userAge ? ` (Around age ${userAge} to ${userAge + 2})` : '';
        windows.push({
          window: `Late ${currentYear} to Mid ${nextYear}${ageBracket}`,
          windowStart: `${currentYear}-10`,
          windowEnd: `${nextYear}-07`,
          planetaryIndicator: `Benefic ${dashaLabel} activating 7th house (Kalatra Bhava) with Jupiter transit support`,
          favorableLevel: isBeneficForMarriage ? 'HIGH' : 'MODERATE',
          confidence: baseConfidence,
          reason: 'Benefic planetary transit aspecting 7th house and active auspicious sub-period.',
        });
      } else if (topic === 'RELATIONSHIP_CONFLICT' || topic === 'RELATIONSHIP') {
        windows.push({
          window: `Immediate reflection phase (Next 3 to 7 days)`,
          planetaryIndicator: `Moon transit across relationship-sensitive axis under ${dashaLabel}`,
          favorableLevel: 'MODERATE',
          confidence: baseConfidence,
          reason: 'Subtle planetary transit creates temporary sensitivity; gentle dialogue and patience foster rapid reconciliation.',
        });
      } else if (topic === 'CAREER' || topic === 'JOB_CHANGE') {
        windows.push({
          window: `Next 4 to 6 months (Late ${currentYear} / Early ${nextYear})`,
          windowStart: `${currentYear}-10`,
          windowEnd: `${nextYear}-04`,
          planetaryIndicator: `Active ${dashaLabel} triggering 10th house (Karma Bhava) career avenues`,
          favorableLevel: 'HIGH',
          confidence: baseConfidence,
          reason: 'Transit Jupiter aspects professional house opening avenues for role expansion or lateral shift.',
        });
      } else if (topic === 'COMPOUND_MARRIAGE_CAREER') {
        windows.push({
          window: `Post-marriage phase (Next 12 to 18 months)`,
          planetaryIndicator: `7th house & 10th house lord synergy under ${dashaLabel}`,
          favorableLevel: 'HIGH',
          confidence: baseConfidence,
          reason: 'Spousal harmony and supportive mutual planetary aspects stabilize career focus.',
        });
      } else if (topic === 'EDUCATION' || topic === 'FOREIGN_TRAVEL') {
        windows.push({
          window: `Upcoming academic / travel cycle (${currentYear}-${nextYear})`,
          planetaryIndicator: `9th/12th house activation during ${dashaLabel}`,
          favorableLevel: 'HIGH',
          confidence: baseConfidence,
          reason: 'Auspicious planetary alignment for international university applications, visas, and academic progress.',
        });
      } else if (topic === 'FINANCE') {
        windows.push({
          window: `Upcoming 6 to 12 months (${currentYear}-${nextYear})`,
          planetaryIndicator: `2nd (Dhana) and 11th (Labha) house stimulation under ${dashaLabel}`,
          favorableLevel: 'MODERATE',
          confidence: baseConfidence,
          reason: 'Mercury and Jupiter transit stabilizes cash flow; disciplined savings yield steady wealth consolidation.',
        });
      }
    }

    // 2. Fallback realistic timing if no dasha dates loaded
    if (windows.length === 0) {
      if (topic === 'MARRIAGE') {
        const ageBracket = userAge ? `Age ${userAge} to ${userAge + 2} / ` : 'Age 25 to 28 / ';
        windows.push({
          window: `${ageBracket}Late ${currentYear} to Mid ${nextYear}`,
          windowStart: `${currentYear}-10`,
          windowEnd: `${nextYear}-07`,
          planetaryIndicator: 'Favorable Jupiter transit aspecting 7th house and Venus sub-period',
          favorableLevel: 'HIGH',
          confidence: baseConfidence,
          reason: 'Benefic planetary transit aspecting 7th house and Venus sub-period.',
        });
      } else if (topic === 'RELATIONSHIP_CONFLICT' || topic === 'RELATIONSHIP') {
        windows.push({
          window: `Next 2 to 5 days`,
          planetaryIndicator: 'Moon and Venus transit cycle',
          favorableLevel: 'MODERATE',
          confidence: baseConfidence,
          reason: 'Temporary emotional turbulence eases as Moon moves past difficult aspects.',
        });
      } else if (topic === 'CAREER') {
        windows.push({
          window: `Next 4 to 6 months`,
          windowStart: `${currentYear}-10`,
          windowEnd: `${nextYear}-04`,
          planetaryIndicator: 'Jupiter favorable transit opening avenues for role expansion or promotion',
          favorableLevel: 'HIGH',
          confidence: baseConfidence,
          reason: 'Skill-building phase demanding disciplined effort before major leadership breakthrough.',
        });
      } else if (topic === 'COMPOUND_MARRIAGE_CAREER') {
        windows.push({
          window: `Upcoming 12 to 18 months`,
          planetaryIndicator: '7th and 10th house lords alignment',
          favorableLevel: 'HIGH',
          confidence: baseConfidence,
          reason: 'Mutual benefic aspects bringing stability and shared purpose.',
        });
      } else if (topic === 'EDUCATION' || topic === 'FOREIGN_TRAVEL') {
        windows.push({
          window: `Upcoming academic cycle (${currentYear}-${nextYear})`,
          planetaryIndicator: '9th house (Higher Learning) and 12th house (Foreign Lands) alignment',
          favorableLevel: 'HIGH',
          confidence: baseConfidence,
          reason: 'Jupiter-Rahu transit opening opportunities for international admissions and journeys.',
        });
      } else if (topic === 'FINANCE') {
        windows.push({
          window: `Upcoming 6 to 12 months`,
          planetaryIndicator: 'Mercury & Jupiter alignment stabilizing cash flow and income streams',
          favorableLevel: 'MODERATE',
          confidence: baseConfidence,
          reason: 'Steady accumulation of wealth with advice against speculative short-cuts.',
        });
      } else {
        windows.push({
          window: `Current transition phase (Next 3 to 6 months)`,
          planetaryIndicator: 'Lagna Lord and Moon transit cycles',
          favorableLevel: 'MODERATE',
          confidence: baseConfidence,
          reason: 'Planetary transit shift fostering clarity, personal growth, and karmic alignment.',
        });
      }
    }

    return windows;
  },
};
