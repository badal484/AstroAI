import { FactPrecision, Planet, type TimeConfidence, type Transit, type PlanetPosition } from '@astroai/shared-types';
import type { CoreIntent } from '../intent/intentTypes';

export type ContradictionType =
  | 'supportive_vs_delay'
  | 'opportunity_vs_pressure'
  | 'relationship_support_vs_conflict'
  | 'wealth_potential_vs_cashflow_pressure'
  | 'career_growth_vs_instability'
  | 'timing_support_vs_birth_time_uncertainty';

export interface ContradictionRecord {
  type: ContradictionType;
  title: string;
  supportingFactor: string;
  challengingFactor: string;
  resolutionGuidance: string;
  severity: 'MILD' | 'MODERATE' | 'NOTABLE';
}

export type TimingCalibratedConfidence =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'INSUFFICIENT';

export interface EvidenceFactor {
  id: string;
  domain: string;
  source: 'D1_RASI' | 'D9_NAVAMSHA' | 'D10_DASHAMSHA' | 'DASHA_MD' | 'DASHA_AD' | 'TRANSIT' | 'NAKSHATRA' | 'YOGA';
  factorName: string;
  technicalPlacement: string;
  influence: 'SUPPORTIVE' | 'CHALLENGING' | 'NEUTRAL';
  weight: number; // 1 to 5
  significance: string; // Plain-language meaning of why this matters for the question
}

export interface TimingAssessment {
  domain: string;
  primaryWindow: string;
  windowStartISO?: string;
  windowEndISO?: string;
  activationLevel: TimingCalibratedConfidence;
  dashaSupport: 'FAVORABLE' | 'MODERATE' | 'OBSTACLE_PRONE' | 'INSUFFICIENT';
  transitSupport: 'FAVORABLE' | 'MODERATE' | 'NEUTRAL' | 'RESTRICTIVE';
  divisionalConfirmation: boolean;
  explanation: string;
}

export interface AstrologyEvidencePacket {
  domain: string;
  questionIntent: CoreIntent;
  birthProfileName: string | null;
  userAge: number | null;
  timeConfidence: TimeConfidence;
  dataSufficient: boolean;

  // Key chart pillars
  ascendant: { sign: string; degree: number } | null;
  moonNakshatra: { name: string; pada: number; lord?: string } | null;

  // Curated domain evidence (Strictly bounded, top 3-6 factors)
  rankedEvidence: EvidenceFactor[];
  supportingFactors: EvidenceFactor[];
  challengingFactors: EvidenceFactor[];
  neutralFactors: EvidenceFactor[];

  // Sub-systems
  activeDasha: {
    mahadasha: string;
    antardasha?: string;
    pratyantardasha?: string;
    startDate?: string;
    endDate?: string;
    theme: string;
  } | null;

  activeTransits: {
    planet: string;
    currentSign: string;
    targetHouse: number | null;
    aspect: string;
    impact: string;
  }[];

  divisionalFindings: {
    chart: 'D9' | 'D10' | 'D7' | 'D4';
    relevantPlacement: string;
    confirmationStatus: 'CONFIRMS' | 'MODIFIES' | 'CONTRADICTS' | 'NOT_AVAILABLE';
    insight: string;
  }[];

  contradictions: ContradictionRecord[];
  timing: TimingAssessment;

  overallEvidenceSignal: 'POSITIVE' | 'MIXED' | 'CHALLENGING' | 'INSUFFICIENT';
  confidenceScore: number; // 0.0 to 1.0
  remedyRecommendation?: {
    suggested: boolean;
    planetaryFocus: string;
    shastriyaRationale: string;
    gentlePractice: string;
  };
}

export interface DomainContractInput {
  intent: CoreIntent;
  userQuery?: string;
  chartAvailable: boolean;
  timeConfidence: TimeConfidence;
  ascendant: { sign: string; degree: number } | null;
  moonNakshatra: { name: string; pada: number } | null;
  houses: { number: number; sign?: string; precision: FactPrecision }[];
  planets: PlanetPosition[];
  dasha: { planet: string; antardasha?: string; startDate?: string; endDate?: string } | null;
  transits?: Transit[];
  userAge?: number | null;
  userName?: string | null;
}

/**
 * Domain-specific factor selection & synthesizer
 */
export const astrologyEvidenceEngine = {
  synthesizeEvidence(input: DomainContractInput): AstrologyEvidencePacket {
    const {
      intent,
      chartAvailable,
      timeConfidence,
      ascendant,
      moonNakshatra,
      houses,
      planets,
      dasha,
      transits = [],
      userAge = 28,
      userName,
    } = input;

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    if (!chartAvailable) {
      return {
        domain: 'GENERAL',
        questionIntent: intent,
        birthProfileName: userName ?? null,
        userAge: userAge ?? null,
        timeConfidence: 'unknown',
        dataSufficient: false,
        ascendant: null,
        moonNakshatra: null,
        rankedEvidence: [],
        supportingFactors: [],
        challengingFactors: [],
        neutralFactors: [],
        activeDasha: null,
        activeTransits: [],
        divisionalFindings: [],
        contradictions: [],
        timing: {
          domain: 'GENERAL',
          primaryWindow: 'Birth chart details required for specific timing',
          activationLevel: 'INSUFFICIENT',
          dashaSupport: 'INSUFFICIENT',
          transitSupport: 'NEUTRAL',
          divisionalConfirmation: false,
          explanation: 'Accurate Date, Time, and Place of birth are required to calculate deterministic Vedic timing.',
        },
        overallEvidenceSignal: 'INSUFFICIENT',
        confidenceScore: 0.2,
      };
    }

    const domain = resolveDomain(intent);
    const rankedEvidence: EvidenceFactor[] = [];
    const supportingFactors: EvidenceFactor[] = [];
    const challengingFactors: EvidenceFactor[] = [];
    const neutralFactors: EvidenceFactor[] = [];
    const contradictions: ContradictionRecord[] = [];
    const divisionalFindings: AstrologyEvidencePacket['divisionalFindings'] = [];
    const activeTransitsList: AstrologyEvidencePacket['activeTransits'] = [];

    // 1. Ascendant / Lagna Foundation
    if (ascendant) {
      const lagnaFactor: EvidenceFactor = {
        id: 'f-lagna',
        domain,
        source: 'D1_RASI',
        factorName: `Lagna (${ascendant.sign})`,
        technicalPlacement: `Lagna at ${ascendant.degree.toFixed(1)}° in ${ascendant.sign}`,
        influence: 'SUPPORTIVE',
        weight: 4,
        significance: `Foundational temperament, personal vitality, and primary orientation towards ${ascendant.sign} characteristics.`,
      };
      rankedEvidence.push(lagnaFactor);
      supportingFactors.push(lagnaFactor);
    }

    // 2. Domain-Specific House & Lord Selection
    if (domain === 'MARRIAGE' || domain === 'RELATIONSHIP') {
      const h7 = houses.find((h) => h.number === 7);
      const h5 = houses.find((h) => h.number === 5);
      const venus = planets.find((p) => p.planet === Planet.VENUS);
      const saturn = planets.find((p) => p.planet === Planet.SATURN);

      if (h7) {
        const factor: EvidenceFactor = {
          id: 'f-h7',
          domain: 'MARRIAGE',
          source: 'D1_RASI',
          factorName: `7th House (${h7.sign ?? 'Kalatra Bhava'})`,
          technicalPlacement: `7th House in ${h7.sign ?? 'Kendra'}`,
          influence: 'SUPPORTIVE',
          weight: 5,
          significance: 'Governs long-term partnership, marriage timing window, and spousal dynamics.',
        };
        rankedEvidence.push(factor);
        supportingFactors.push(factor);
      }

      if (h5) {
        const factor: EvidenceFactor = {
          id: 'f-h5',
          domain: 'MARRIAGE',
          source: 'D1_RASI',
          factorName: `5th House (${h5.sign ?? 'Purva Punya / Romance'})`,
          technicalPlacement: `5th House in ${h5.sign ?? 'Trikona'}`,
          influence: 'SUPPORTIVE',
          weight: 4,
          significance: 'Governs emotional connection, romantic affinity, and love marriage alignment.',
        };
        rankedEvidence.push(factor);
        supportingFactors.push(factor);
      }

      if (venus) {
        const isRetro = venus.isRetrograde;
        const factor: EvidenceFactor = {
          id: 'f-venus',
          domain: 'MARRIAGE',
          source: 'D1_RASI',
          factorName: `Shukra (Venus) in ${venus.sign}`,
          technicalPlacement: `Venus in ${venus.sign}${venus.house ? ` (House ${venus.house})` : ''}${isRetro ? ' [Vakri]' : ''}`,
          influence: isRetro ? 'NEUTRAL' : 'SUPPORTIVE',
          weight: 4,
          significance: isRetro
            ? 'Venus retrograde prompts deeper emotional introspection and careful partner evaluation before commitment.'
            : 'Natural significator (Karaka) of love and spousal harmony, supporting relationship maturity.',
        };
        rankedEvidence.push(factor);
        if (isRetro) challengingFactors.push(factor);
        else supportingFactors.push(factor);
      }

      if (saturn && (saturn.house === 7 || saturn.house === 1 || saturn.sign === h7?.sign)) {
        const delayFactor: EvidenceFactor = {
          id: 'f-saturn-7',
          domain: 'MARRIAGE',
          source: 'D1_RASI',
          factorName: 'Shani Influence on 7th House',
          technicalPlacement: `Saturn in House ${saturn.house ?? 7} influencing relationship axis`,
          influence: 'CHALLENGING',
          weight: 4,
          significance: 'Brings natural maturity and delay so relationships build on stable foundations rather than impulsive haste.',
        };
        rankedEvidence.push(delayFactor);
        challengingFactors.push(delayFactor);

        contradictions.push({
          type: 'supportive_vs_delay',
          title: 'Auspicious Marriage Window with Mature Deliberation',
          supportingFactor: 'Active Dasha and benefic transit support partnership activation',
          challengingFactor: 'Saturn influence prioritizes emotional maturity and measured timing over hasty decisions',
          resolutionGuidance: 'The period supports meaningful commitment, provided expectations are grounded and clear.',
          severity: 'MODERATE',
        });
      }

      // D9 Navamsha confirmation if reliable
      if (timeConfidence === 'exact') {
        divisionalFindings.push({
          chart: 'D9',
          relevantPlacement: `D9 Navamsha indicates balanced 7th house alignment with Venus dignity`,
          confirmationStatus: 'CONFIRMS',
          insight: 'Navamsha confirmation strengthens post-marriage stability and shared dharmic growth.',
        });
      }
    } else if (domain === 'CAREER' || domain === 'JOB_CHANGE' || domain === 'BUSINESS') {
      const h10 = houses.find((h) => h.number === 10);
      const sun = planets.find((p) => p.planet === Planet.SUN);
      const saturn = planets.find((p) => p.planet === Planet.SATURN);

      if (h10) {
        const factor: EvidenceFactor = {
          id: 'f-h10',
          domain: 'CAREER',
          source: 'D1_RASI',
          factorName: `10th House (${h10.sign ?? 'Karma Bhava'})`,
          technicalPlacement: `10th House in ${h10.sign ?? 'Midheaven'}`,
          influence: 'SUPPORTIVE',
          weight: 5,
          significance: 'Focal sector for professional standing, leadership responsibilities, and career trajectory.',
        };
        rankedEvidence.push(factor);
        supportingFactors.push(factor);
      }

      if (sun) {
        const factor: EvidenceFactor = {
          id: 'f-sun',
          domain: 'CAREER',
          source: 'D1_RASI',
          factorName: `Surya (Sun) in ${sun.sign}`,
          technicalPlacement: `Sun in ${sun.sign}${sun.house ? ` (House ${sun.house})` : ''}`,
          influence: 'SUPPORTIVE',
          weight: 4,
          significance: 'Significator of executive authority, visibility, and organizational recognition.',
        };
        rankedEvidence.push(factor);
        supportingFactors.push(factor);
      }

      if (saturn) {
        const factor: EvidenceFactor = {
          id: 'f-saturn-career',
          domain: 'CAREER',
          source: 'D1_RASI',
          factorName: `Shani (Saturn) in ${saturn.sign}`,
          technicalPlacement: `Saturn in ${saturn.sign}${saturn.house ? ` (House ${saturn.house})` : ''}`,
          influence: 'NEUTRAL',
          weight: 4,
          significance: 'Karaka for perseverance and enterprise building, rewarding consistent procedural discipline.',
        };
        rankedEvidence.push(factor);
        neutralFactors.push(factor);
      }

      if (saturn && (saturn.house === 10 || saturn.house === 6)) {
        contradictions.push({
          type: 'opportunity_vs_pressure',
          title: 'Career Advancement Accompanied by High Responsibility',
          supportingFactor: 'Active Dasha activates career houses and role expansion opportunities',
          challengingFactor: 'Heavy workload and procedural expectations require sustained patience and stamina',
          resolutionGuidance: 'Focus on structured execution rather than hasty moves; planned switches yield durable outcomes.',
          severity: 'MODERATE',
        });
      }

      // D10 Dashamsha confirmation if reliable
      if (timeConfidence === 'exact') {
        divisionalFindings.push({
          chart: 'D10',
          relevantPlacement: 'D10 Dashamsha reinforces 10th lord strength with Mercury/Sun analytical support',
          confirmationStatus: 'CONFIRMS',
          insight: 'Dashamsha alignment confirms strong mid-career authority and professional adaptability.',
        });
      }
    } else if (domain === 'FINANCE') {
      const h2 = houses.find((h) => h.number === 2);
      const h11 = houses.find((h) => h.number === 11);

      if (h2) {
        const factor: EvidenceFactor = {
          id: 'f-h2',
          domain: 'FINANCE',
          source: 'D1_RASI',
          factorName: `2nd House (${h2.sign ?? 'Dhana Bhava'})`,
          technicalPlacement: `2nd House in ${h2.sign ?? 'Financial Axis'}`,
          influence: 'SUPPORTIVE',
          weight: 5,
          significance: 'Governs accumulated assets, savings stability, and wealth preservation.',
        };
        rankedEvidence.push(factor);
        supportingFactors.push(factor);
      }

      if (h11) {
        const factor: EvidenceFactor = {
          id: 'f-h11',
          domain: 'FINANCE',
          source: 'D1_RASI',
          factorName: `11th House (${h11.sign ?? 'Labha Bhava'})`,
          technicalPlacement: `11th House in ${h11.sign ?? 'Gains Sector'}`,
          influence: 'SUPPORTIVE',
          weight: 4,
          significance: 'Governs recurring revenue, expanded professional network, and financial gains.',
        };
        rankedEvidence.push(factor);
        supportingFactors.push(factor);
      }
    } else {
      // General Kundli overview
      const h1 = houses.find((h) => h.number === 1);
      const h9 = houses.find((h) => h.number === 9);

      if (h1) {
        const f: EvidenceFactor = {
          id: 'f-h1',
          domain: 'GENERAL',
          source: 'D1_RASI',
          factorName: `1st House (Lagna Bhava)`,
          technicalPlacement: `Ascendant in ${h1.sign ?? 'Lagna'}`,
          influence: 'SUPPORTIVE',
          weight: 4,
          significance: 'Primary anchor for physical vitality, personal drive, and life purpose.',
        };
        rankedEvidence.push(f);
        supportingFactors.push(f);
      }
      if (h9) {
        const f: EvidenceFactor = {
          id: 'f-h9',
          domain: 'GENERAL',
          source: 'D1_RASI',
          factorName: `9th House (Bhagya Bhava)`,
          technicalPlacement: `9th House in ${h9.sign ?? 'Fortune Sector'}`,
          influence: 'SUPPORTIVE',
          weight: 4,
          significance: 'Governs higher wisdom, ethical clarity, divine grace, and long-range fortune.',
        };
        rankedEvidence.push(f);
        supportingFactors.push(f);
      }
    }

    // 3. Dasha Period Analysis
    let activeDashaObj: AstrologyEvidencePacket['activeDasha'] = null;
    if (dasha) {
      const dashaTheme = resolveDashaTheme(dasha.planet, dasha.antardasha, domain);
      activeDashaObj = {
        mahadasha: dasha.planet,
        antardasha: dasha.antardasha,
        startDate: dasha.startDate,
        endDate: dasha.endDate,
        theme: dashaTheme,
      };

      const dashaFactor: EvidenceFactor = {
        id: 'f-dasha',
        domain,
        source: 'DASHA_MD',
        factorName: dasha.antardasha
          ? `Dasha: ${dasha.planet}-${dasha.antardasha}`
          : `Mahadasha of ${dasha.planet}`,
        technicalPlacement: `Active ${dasha.planet} period${dasha.antardasha ? ` with ${dasha.antardasha} sub-period` : ''}`,
        influence: 'SUPPORTIVE',
        weight: 5,
        significance: dashaTheme,
      };
      rankedEvidence.push(dashaFactor);
      supportingFactors.push(dashaFactor);
    }

    // 4. Live Transits Integration
    if (transits.length > 0) {
      for (const t of transits.slice(0, 3)) {
        activeTransitsList.push({
          planet: t.planet,
          currentSign: t.sign,
          targetHouse: t.house ?? null,
          aspect: `Transiting through ${t.sign}`,
          impact: `Activates energetic momentum in House ${t.house ?? 'relevant sector'}`,
        });
      }
    } else {
      // Synthesize standard classical transit indicators
      if (domain === 'MARRIAGE') {
        activeTransitsList.push({
          planet: 'Jupiter',
          currentSign: 'Favorable sign',
          targetHouse: 7,
          aspect: 'Drishti / Aspect on 7th House (Kalatra Bhava)',
          impact: 'Auspicious expansion supporting relationship formalization and spousal alignment.',
        });
      } else if (domain === 'CAREER' || domain === 'JOB_CHANGE') {
        activeTransitsList.push({
          planet: 'Jupiter',
          currentSign: 'Favorable sign',
          targetHouse: 10,
          aspect: 'Aspect on 10th House (Karma Bhava)',
          impact: 'Opens supportive avenues for career progression, mentorship, and lateral expansion.',
        });
      }
    }

    // 5. Dynamic Calibrated Timing Assessment
    const isBeneficDasha = dasha && ['Jupiter', 'Venus', 'Mercury', 'Sun', 'Moon'].includes(dasha.planet);
    const timingActivation: TimingCalibratedConfidence =
      timeConfidence === 'unknown'
        ? 'WEAK'
        : isBeneficDasha && timeConfidence === 'exact'
          ? 'VERY_STRONG'
          : isBeneficDasha
            ? 'STRONG'
            : 'MODERATE';

    let timingWindowStr = `Late ${currentYear} to Mid ${nextYear}`;
    let timingExplanation = `Current planetary period and transits create a supportive window for ${domain.toLowerCase()}.`;

    if (domain === 'MARRIAGE') {
      const ageStr = userAge != null ? ` (Age ${userAge}–${userAge + 2})` : '';
      timingWindowStr = `Late ${currentYear} to Mid ${nextYear}${ageStr}`;
      timingExplanation = `7th house activation under current Dasha cycle creates supportive probabilities for marriage and relationship consolidation.`;
    } else if (domain === 'CAREER' || domain === 'JOB_CHANGE') {
      timingWindowStr = `Next 4 to 6 months (Late ${currentYear} / Early ${nextYear})`;
      timingExplanation = `10th house planetary stimulation supports planned role transition and career appraisal.`;
    } else if (domain === 'FINANCE') {
      timingWindowStr = `Upcoming 6 to 12 months (${currentYear}–${nextYear})`;
      timingExplanation = `2nd and 11th house stimulation stabilizes cash flow; consistent budgeting fosters steady wealth accumulation.`;
    }

    const timingAssessment: TimingAssessment = {
      domain,
      primaryWindow: timingWindowStr,
      windowStartISO: `${currentYear}-10`,
      windowEndISO: `${nextYear}-07`,
      activationLevel: timingActivation,
      dashaSupport: isBeneficDasha ? 'FAVORABLE' : 'MODERATE',
      transitSupport: 'FAVORABLE',
      divisionalConfirmation: timeConfidence === 'exact',
      explanation: timingExplanation,
    };

    // 6. Signal & Confidence Calculation
    const overallSignal =
      contradictions.length > 0
        ? 'MIXED'
        : challengingFactors.length > supportingFactors.length
          ? 'CHALLENGING'
          : 'POSITIVE';

    const confidenceScore =
      timeConfidence === 'exact' ? 0.92 : timeConfidence === 'approximate' ? 0.75 : 0.45;

    return {
      domain,
      questionIntent: intent,
      birthProfileName: userName ?? null,
      userAge,
      timeConfidence,
      dataSufficient: true,
      ascendant,
      moonNakshatra,
      rankedEvidence: rankedEvidence.slice(0, 6), // Top 3–6 curated factors
      supportingFactors,
      challengingFactors,
      neutralFactors,
      activeDasha: activeDashaObj,
      activeTransits: activeTransitsList,
      divisionalFindings,
      contradictions,
      timing: timingAssessment,
      overallEvidenceSignal: overallSignal,
      confidenceScore,
      remedyRecommendation: {
        suggested: false, // strictly unforced by default
        planetaryFocus: dasha?.planet ?? 'Lagna Lord',
        shastriyaRationale: 'Traditional devotional practices for planetary harmony',
        gentlePractice: 'Daily morning Gayatri meditation and peaceful mindfulness',
      },
    };
  },
};

function resolveDomain(intent: CoreIntent): string {
  const str = intent.toString().toUpperCase();
  if (str.includes('MARRIAGE') || str.includes('SPOUSE') || str.includes('PARTNER')) return 'MARRIAGE';
  if (str.includes('RELATIONSHIP') || str.includes('LOVE') || str.includes('BREAKUP')) return 'RELATIONSHIP';
  if (str.includes('CAREER') || str.includes('JOB') || str.includes('PROMOTION')) return 'CAREER';
  if (str.includes('BUSINESS') || str.includes('STARTUP')) return 'BUSINESS';
  if (str.includes('FINANCE') || str.includes('WEALTH') || str.includes('DEBT') || str.includes('MONEY')) return 'FINANCE';
  if (str.includes('EDUCATION') || str.includes('STUDY')) return 'EDUCATION';
  if (str.includes('FOREIGN') || str.includes('TRAVEL')) return 'FOREIGN_TRAVEL';
  return 'GENERAL';
}

function resolveDashaTheme(mahadasha: string, antardasha: string | undefined, domain: string): string {
  const md = mahadasha.toLowerCase();
  const ad = antardasha ? antardasha.toLowerCase() : '';

  if (md === 'jupiter' || ad === 'jupiter') {
    return 'Guru period brings expansion of wisdom, auspicious opportunities, and dharmic fulfillment.';
  }
  if (md === 'venus' || ad === 'venus') {
    return 'Shukra period stimulates aesthetic refinement, relationship harmony, and material comfort.';
  }
  if (md === 'saturn' || ad === 'saturn') {
    return 'Shani period emphasizes discipline, endurance, procedural structure, and karmic consolidation.';
  }
  if (md === 'mercury' || ad === 'mercury') {
    return 'Budha period enhances commercial acumen, analytical intellect, and communication avenues.';
  }
  if (md === 'sun' || ad === 'sun') {
    return 'Surya period strengthens public reputation, executive clarity, and leadership initiatives.';
  }
  if (md === 'moon' || ad === 'moon') {
    return 'Chandra period brings emotional sensitivity, creative adaptability, and domestic balance.';
  }
  if (md === 'mars' || ad === 'mars') {
    return 'Mangal period provides dynamic courage, athletic stamina, and decisive initiative.';
  }
  if (md === 'rahu' || ad === 'rahu') {
    return 'Rahu period triggers unconventional breakthroughs, rapid changes, and foreign or tech connections.';
  }
  if (md === 'ketu' || ad === 'ketu') {
    return 'Ketu period fosters internal retrospection, spiritual detachment, and intuitive insight.';
  }
  return `Planetary cycle of ${mahadasha} activating karmic life themes for ${domain.toLowerCase()}.`;
}
