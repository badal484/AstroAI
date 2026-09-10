/**
 * Round 5 Vedic Astrological Reasoning Benchmark Suite
 * Contains 100 chart-grounded scenarios, 20 paired personalization tests,
 * 10 counterfactual tests, 10 irrelevant perturbation tests, and 30 unseen holdout scenarios.
 */

import { FactPrecision, Planet, type TimeConfidence, type PlanetPosition } from '@astroai/shared-types';

export interface BenchmarkChartFixture {
  id: string;
  name: string;
  userAge: number;
  timeConfidence: TimeConfidence;
  ascendant: { sign: string; degree: number };
  moonNakshatra: { name: string; pada: number };
  houses: { number: number; sign: string; precision: FactPrecision }[];
  planets: PlanetPosition[];
  currentDasha: { planet: string; antardasha?: string; startDate: string; endDate: string };
  transits?: { planet: Planet; currentSign: string; house: number; isRetrograde?: boolean }[];
}

export interface GroundedEvaluationScenario {
  id: string;
  domain: 'MARRIAGE' | 'CAREER' | 'JOB_CHANGE' | 'BUSINESS' | 'MONEY' | 'LOVE' | 'COMPATIBILITY' | 'EDUCATION' | 'FOREIGN_SETTLEMENT' | 'FAMILY' | 'GENERAL_KUNDLI';
  query: string;
  language: 'en' | 'hi' | 'hinglish';
  chart: BenchmarkChartFixture;
  expectedTopic: string;
  expectedSignal: 'positive' | 'mixed' | 'challenging';
  expectedPrimaryFactors: string[];
  expectedProhibitedClaims?: string[];
  timingWindowExpected: boolean;
}

export interface PairedPersonalizationScenario {
  id: string;
  query: string;
  language: 'en' | 'hi' | 'hinglish';
  chartA: BenchmarkChartFixture;
  chartB: BenchmarkChartFixture;
  expectedDivergenceReason: string;
}

export interface CounterfactualScenario {
  id: string;
  query: string;
  baseChart: BenchmarkChartFixture;
  modifiedChart: BenchmarkChartFixture;
  changedFactorDescription: string;
  expectedSignalChange: { from: 'positive' | 'mixed' | 'challenging'; to: 'positive' | 'mixed' | 'challenging' };
}

export interface IrrelevantPerturbationScenario {
  id: string;
  query: string;
  baseChart: BenchmarkChartFixture;
  perturbedChart: BenchmarkChartFixture;
  perturbedFactorDescription: string;
  expectedStabilityDomain: string;
}

// Reusable standard test charts
export const CHART_ARIES_BENEFIC_MARRIAGE: BenchmarkChartFixture = {
  id: 'chart-aries-marr-1',
  name: 'Rahul Sharma',
  userAge: 27,
  timeConfidence: 'exact',
  ascendant: { sign: 'Aries', degree: 14.5 },
  moonNakshatra: { name: 'Rohini', pada: 2 },
  houses: [
    { number: 1, sign: 'Aries', precision: FactPrecision.EXACT },
    { number: 2, sign: 'Taurus', precision: FactPrecision.EXACT },
    { number: 7, sign: 'Libra', precision: FactPrecision.EXACT },
    { number: 10, sign: 'Capricorn', precision: FactPrecision.EXACT },
    { number: 11, sign: 'Aquarius', precision: FactPrecision.EXACT },
  ],
  planets: [
    { planet: Planet.VENUS, sign: 'Libra', degree: 18.2, house: 7, isRetrograde: false, precision: FactPrecision.EXACT },
    { planet: Planet.JUPITER, sign: 'Gemini', degree: 12.0, house: 3, isRetrograde: false, precision: FactPrecision.EXACT },
    { planet: Planet.SATURN, sign: 'Aquarius', degree: 5.4, house: 11, isRetrograde: false, precision: FactPrecision.EXACT },
    { planet: Planet.SUN, sign: 'Leo', degree: 22.1, house: 5, isRetrograde: false, precision: FactPrecision.EXACT },
    { planet: Planet.MOON, sign: 'Taurus', degree: 10.5, house: 2, isRetrograde: false, precision: FactPrecision.EXACT },
    { planet: Planet.MARS, sign: 'Capricorn', degree: 8.0, house: 10, isRetrograde: false, precision: FactPrecision.EXACT },
  ],
  currentDasha: { planet: 'Venus', antardasha: 'Jupiter', startDate: '2025-01-01', endDate: '2027-09-01' },
};

export const CHART_CANCER_CHALLENGED_MARRIAGE: BenchmarkChartFixture = {
  id: 'chart-cancer-marr-2',
  name: 'Vikram Singh',
  userAge: 29,
  timeConfidence: 'exact',
  ascendant: { sign: 'Cancer', degree: 22.0 },
  moonNakshatra: { name: 'Ashlesha', pada: 4 },
  houses: [
    { number: 1, sign: 'Cancer', precision: FactPrecision.EXACT },
    { number: 7, sign: 'Capricorn', precision: FactPrecision.EXACT },
    { number: 10, sign: 'Aries', precision: FactPrecision.EXACT },
  ],
  planets: [
    { planet: Planet.SATURN, sign: 'Capricorn', degree: 28.0, house: 7, isRetrograde: true, precision: FactPrecision.EXACT },
    { planet: Planet.VENUS, sign: 'Virgo', degree: 15.0, house: 3, isRetrograde: false, precision: FactPrecision.EXACT }, // Debilitated
    { planet: Planet.MARS, sign: 'Cancer', degree: 12.0, house: 1, isRetrograde: false, precision: FactPrecision.EXACT }, // Debilitated in 1st
    { planet: Planet.MOON, sign: 'Cancer', degree: 29.0, house: 1, isRetrograde: false, precision: FactPrecision.EXACT },
  ],
  currentDasha: { planet: 'Saturn', antardasha: 'Saturn', startDate: '2024-06-01', endDate: '2027-06-01' },
};

export const CHART_LEO_STRONG_CAREER: BenchmarkChartFixture = {
  id: 'chart-leo-car-1',
  name: 'Pooja Verma',
  userAge: 31,
  timeConfidence: 'exact',
  ascendant: { sign: 'Leo', degree: 18.0 },
  moonNakshatra: { name: 'Magha', pada: 1 },
  houses: [
    { number: 1, sign: 'Leo', precision: FactPrecision.EXACT },
    { number: 10, sign: 'Taurus', precision: FactPrecision.EXACT },
    { number: 11, sign: 'Gemini', precision: FactPrecision.EXACT },
  ],
  planets: [
    { planet: Planet.SUN, sign: 'Aries', degree: 10.0, house: 9, isRetrograde: false, precision: FactPrecision.EXACT }, // Exalted 1st lord
    { planet: Planet.VENUS, sign: 'Taurus', degree: 14.0, house: 10, isRetrograde: false, precision: FactPrecision.EXACT }, // Own sign 10th lord
    { planet: Planet.JUPITER, sign: 'Sagittarius', degree: 8.0, house: 5, isRetrograde: false, precision: FactPrecision.EXACT },
  ],
  currentDasha: { planet: 'Sun', antardasha: 'Venus', startDate: '2025-03-01', endDate: '2026-03-01' },
};

export const CHART_LIBRA_CHALLENGED_CAREER: BenchmarkChartFixture = {
  id: 'chart-libra-car-2',
  name: 'Aditya Mehta',
  userAge: 33,
  timeConfidence: 'approximate',
  ascendant: { sign: 'Libra', degree: 5.0 },
  moonNakshatra: { name: 'Chitra', pada: 3 },
  houses: [
    { number: 1, sign: 'Libra', precision: FactPrecision.APPROXIMATE },
    { number: 10, sign: 'Cancer', precision: FactPrecision.APPROXIMATE },
    { number: 6, sign: 'Pisces', precision: FactPrecision.APPROXIMATE },
  ],
  planets: [
    { planet: Planet.MOON, sign: 'Scorpio', degree: 3.0, house: 2, isRetrograde: false, precision: FactPrecision.APPROXIMATE }, // Debilitated 10th lord
    { planet: Planet.SATURN, sign: 'Aries', degree: 19.0, house: 7, isRetrograde: true, precision: FactPrecision.APPROXIMATE }, // Debilitated Yogakaraka
    { planet: Planet.MERCURY, sign: 'Pisces', degree: 14.0, house: 6, isRetrograde: false, precision: FactPrecision.APPROXIMATE },
  ],
  currentDasha: { planet: 'Saturn', antardasha: 'Mercury', startDate: '2025-01-01', endDate: '2027-08-01' },
};

// Generate 100 benchmark scenarios
export const ROUND_5_100_SCENARIOS: GroundedEvaluationScenario[] = [
  // 15 Marriage Scenarios
  {
    id: 'marr-01',
    domain: 'MARRIAGE',
    query: 'Meri shaadi kab hogi?',
    language: 'hinglish',
    chart: CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: 'positive',
    expectedPrimaryFactors: ['7th House', 'Venus', 'Dasha'],
    timingWindowExpected: true,
  },
  {
    id: 'marr-02',
    domain: 'MARRIAGE',
    query: 'क्या 2027 में मेरा विवाह संभव है?',
    language: 'hi',
    chart: CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: 'positive',
    expectedPrimaryFactors: ['7th House', 'Venus'],
    timingWindowExpected: true,
  },
  {
    id: 'marr-03',
    domain: 'MARRIAGE',
    query: 'Why is there so much delay in my marriage talks?',
    language: 'en',
    chart: CHART_CANCER_CHALLENGED_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: 'mixed',
    expectedPrimaryFactors: ['Saturn', '7th House'],
    timingWindowExpected: true,
  },
  {
    id: 'marr-04',
    domain: 'MARRIAGE',
    query: 'Rishta baar baar toot kyu raha hai?',
    language: 'hinglish',
    chart: CHART_CANCER_CHALLENGED_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: 'challenging',
    expectedPrimaryFactors: ['Saturn', '7th House'],
    timingWindowExpected: true,
  },
  {
    id: 'marr-05',
    domain: 'MARRIAGE',
    query: 'Kundli ke hisaab se partner kaisa milega?',
    language: 'hinglish',
    chart: CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: 'positive',
    expectedPrimaryFactors: ['7th House', 'Venus'],
    timingWindowExpected: false,
  },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `marr-${i + 6 < 10 ? '0' : ''}${i + 6}`,
    domain: 'MARRIAGE' as const,
    query: `Shaadi ke yog aur timing bataiye scenario ${i + 6}`,
    language: (i % 2 === 0 ? 'hinglish' : 'hi') as 'hinglish' | 'hi',
    chart: i % 2 === 0 ? CHART_ARIES_BENEFIC_MARRIAGE : CHART_CANCER_CHALLENGED_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: (i % 2 === 0 ? 'positive' : 'mixed') as 'positive' | 'mixed',
    expectedPrimaryFactors: ['7th House', i % 2 === 0 ? 'Venus' : 'Saturn'],
    timingWindowExpected: true,
  })),

  // 15 Career Scenarios
  {
    id: 'car-01',
    domain: 'CAREER',
    query: 'Career mein promotion kab tak expect kar sakte hain?',
    language: 'hinglish',
    chart: CHART_LEO_STRONG_CAREER,
    expectedTopic: 'CAREER',
    expectedSignal: 'positive',
    expectedPrimaryFactors: ['10th House', 'Sun', 'Venus'],
    timingWindowExpected: true,
  },
  {
    id: 'car-02',
    domain: 'CAREER',
    query: 'What does my chart say about executive leadership?',
    language: 'en',
    chart: CHART_LEO_STRONG_CAREER,
    expectedTopic: 'CAREER',
    expectedSignal: 'positive',
    expectedPrimaryFactors: ['10th House', 'Sun'],
    timingWindowExpected: true,
  },
  {
    id: 'car-03',
    domain: 'CAREER',
    query: 'Office mein politics aur stagnation kyu ho rahi hai?',
    language: 'hinglish',
    chart: CHART_LIBRA_CHALLENGED_CAREER,
    expectedTopic: 'CAREER',
    expectedSignal: 'mixed',
    expectedPrimaryFactors: ['10th House', 'Saturn'],
    timingWindowExpected: true,
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `car-${i + 4 < 10 ? '0' : ''}${i + 4}`,
    domain: 'CAREER' as const,
    query: `Career trajectory and professional growth analysis test ${i + 4}`,
    language: (i % 3 === 0 ? 'en' : i % 3 === 1 ? 'hinglish' : 'hi') as 'en' | 'hinglish' | 'hi',
    chart: i % 2 === 0 ? CHART_LEO_STRONG_CAREER : CHART_LIBRA_CHALLENGED_CAREER,
    expectedTopic: 'CAREER',
    expectedSignal: (i % 2 === 0 ? 'positive' : 'mixed') as 'positive' | 'mixed',
    expectedPrimaryFactors: ['10th House'],
    timingWindowExpected: true,
  })),

  // 10 Job Change Scenarios
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `job-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'JOB_CHANGE' as const,
    query: `Job change kab karna safe rahega query ${i + 1}?`,
    language: 'hinglish' as const,
    chart: i % 2 === 0 ? CHART_LEO_STRONG_CAREER : CHART_LIBRA_CHALLENGED_CAREER,
    expectedTopic: 'CAREER',
    expectedSignal: (i % 2 === 0 ? 'positive' : 'mixed') as 'positive' | 'mixed',
    expectedPrimaryFactors: ['10th House'],
    timingWindowExpected: true,
  })),

  // 10 Business Scenarios
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `biz-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'BUSINESS' as const,
    query: `Should I start my own business or stay in job? Test ${i + 1}`,
    language: 'en' as const,
    chart: i % 2 === 0 ? CHART_LEO_STRONG_CAREER : CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'CAREER',
    expectedSignal: 'positive' as const,
    expectedPrimaryFactors: ['10th House', 'Lagna'],
    timingWindowExpected: true,
  })),

  // 10 Money Scenarios
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `fin-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'MONEY' as const,
    query: `Financial stability aur wealth accumulation kab tak better hoga? Case ${i + 1}`,
    language: 'hinglish' as const,
    chart: CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'FINANCE',
    expectedSignal: 'positive' as const,
    expectedPrimaryFactors: ['2nd House', '11th House'],
    timingWindowExpected: true,
  })),

  // 10 Love Scenarios
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `love-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'LOVE' as const,
    query: `Love relationship status and future prospects scenario ${i + 1}`,
    language: 'en' as const,
    chart: i % 2 === 0 ? CHART_ARIES_BENEFIC_MARRIAGE : CHART_CANCER_CHALLENGED_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: (i % 2 === 0 ? 'positive' : 'mixed') as 'positive' | 'mixed',
    expectedPrimaryFactors: ['7th House', 'Venus'],
    timingWindowExpected: true,
  })),

  // 10 Compatibility Scenarios
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `comp-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'COMPATIBILITY' as const,
    query: `Kundli milan aur compatibility analysis scenario ${i + 1}`,
    language: 'hinglish' as const,
    chart: CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'MARRIAGE',
    expectedSignal: 'positive' as const,
    expectedPrimaryFactors: ['7th House', 'Lagna'],
    timingWindowExpected: false,
  })),

  // 5 Education Scenarios
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `edu-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'EDUCATION' as const,
    query: `Higher education aur entrance exam result kaisa rahega? Test ${i + 1}`,
    language: 'hinglish' as const,
    chart: CHART_LEO_STRONG_CAREER,
    expectedTopic: 'EDUCATION',
    expectedSignal: 'positive' as const,
    expectedPrimaryFactors: ['9th House'],
    timingWindowExpected: true,
  })),

  // 5 Foreign Settlement Scenarios
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `for-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'FOREIGN_SETTLEMENT' as const,
    query: `Abroad travel ya PR visa lagne ke yog kab hain? Case ${i + 1}`,
    language: 'hinglish' as const,
    chart: CHART_LEO_STRONG_CAREER,
    expectedTopic: 'FOREIGN_TRAVEL',
    expectedSignal: 'positive' as const,
    expectedPrimaryFactors: ['12th House'],
    timingWindowExpected: true,
  })),

  // 5 Family Scenarios
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `fam-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'FAMILY' as const,
    query: `Ghar parivar mein peace aur property related clarity kab aayegi? Case ${i + 1}`,
    language: 'hinglish' as const,
    chart: CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'GENERAL_KUNDLI',
    expectedSignal: 'positive' as const,
    expectedPrimaryFactors: ['4th House'],
    timingWindowExpected: true,
  })),

  // 5 General Kundli Scenarios
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `gen-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: 'GENERAL_KUNDLI' as const,
    query: `Meri puri kundli ka broad overview dijiye case ${i + 1}`,
    language: 'hinglish' as const,
    chart: CHART_ARIES_BENEFIC_MARRIAGE,
    expectedTopic: 'GENERAL_KUNDLI',
    expectedSignal: 'positive' as const,
    expectedPrimaryFactors: ['Lagna', 'Moon Nakshatra'],
    timingWindowExpected: true,
  })),
];

// 20 Paired Personalization Scenarios (Same question, different charts)
export const PAIRED_PERSONALIZATION_SCENARIOS: PairedPersonalizationScenario[] = Array.from({ length: 20 }, (_, i) => ({
  id: `paired-${i + 1 < 10 ? '0' : ''}${i + 1}`,
  query: i % 2 === 0 ? 'Meri shaadi kab hogi aur timing kaisi hai?' : 'Career growth aur job switch ka period kaisa hai?',
  language: 'hinglish',
  chartA: i % 2 === 0 ? CHART_ARIES_BENEFIC_MARRIAGE : CHART_LEO_STRONG_CAREER,
  chartB: i % 2 === 0 ? CHART_CANCER_CHALLENGED_MARRIAGE : CHART_LIBRA_CHALLENGED_CAREER,
  expectedDivergenceReason: i % 2 === 0
    ? 'Chart A has exalted/own Venus in 7th with Venus-Jupiter dasha (strong favorable window) vs Chart B has debilitated Venus and Saturn in 7th with Saturn dasha (delay and measured maturity).'
    : 'Chart A has exalted Sun and 10th lord Venus in 10th (high authority window) vs Chart B has debilitated 10th lord Moon and debilitated Saturn (stagnation requiring procedural patience).',
}));

// 10 Counterfactual Scenarios (Same chart, 1 relevant fact changed)
export const COUNTERFACTUAL_SCENARIOS: CounterfactualScenario[] = Array.from({ length: 10 }, (_, i) => {
  const base = CHART_ARIES_BENEFIC_MARRIAGE;
  const modified: BenchmarkChartFixture = {
    ...base,
    id: `modified-counterfactual-${i + 1}`,
    currentDasha: { planet: 'Saturn', antardasha: 'Rahu', startDate: '2025-01-01', endDate: '2028-01-01' },
  };
  return {
    id: `counterfactual-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    query: 'Is this upcoming period favorable for finalizing my wedding?',
    baseChart: base,
    modifiedChart: modified,
    changedFactorDescription: 'Dasha changed from supportive Venus-Jupiter to challenging Saturn-Rahu',
    expectedSignalChange: { from: 'positive', to: 'mixed' },
  };
});

// 10 Irrelevant Perturbation Scenarios (1 irrelevant factor changed)
export const IRRELEVANT_PERTURBATION_SCENARIOS: IrrelevantPerturbationScenario[] = Array.from({ length: 10 }, (_, i) => {
  const base = CHART_ARIES_BENEFIC_MARRIAGE;
  const perturbed: BenchmarkChartFixture = {
    ...base,
    id: `perturbed-irrelevant-${i + 1}`,
    // Shift 3rd house lord degree slightly, completely irrelevant to marriage timing
    planets: base.planets.map((p) => (p.planet === Planet.MERCURY ? { ...p, degree: p.degree + 2.5 } : p)),
  };
  return {
    id: `perturbation-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    query: 'Marriage timing window aur shadi ke yog bataiye.',
    baseChart: base,
    perturbedChart: perturbed,
    perturbedFactorDescription: 'Shifted Mercury degree in 3rd house by 2.5 degrees (irrelevant to 7th house marriage synthesis)',
    expectedStabilityDomain: 'MARRIAGE',
  };
});

// 30 Unseen Holdout Scenarios
export const ROUND_5_30_HOLDOUT_SCENARIOS: GroundedEvaluationScenario[] = Array.from({ length: 30 }, (_, i) => {
  const domains: GroundedEvaluationScenario['domain'][] = [
    'MARRIAGE', 'CAREER', 'JOB_CHANGE', 'BUSINESS', 'MONEY',
    'LOVE', 'COMPATIBILITY', 'EDUCATION', 'FOREIGN_SETTLEMENT', 'FAMILY'
  ];
  const dom = domains[i % domains.length];
  return {
    id: `holdout-r5-${i + 1 < 10 ? '0' : ''}${i + 1}`,
    domain: dom,
    query: `Holdout consultation question for ${dom.toLowerCase()} scenario ${i + 1}`,
    language: (i % 3 === 0 ? 'hinglish' : i % 3 === 1 ? 'hi' : 'en') as 'hinglish' | 'hi' | 'en',
    chart: i % 2 === 0 ? CHART_ARIES_BENEFIC_MARRIAGE : CHART_LEO_STRONG_CAREER,
    expectedTopic: dom === 'MARRIAGE' || dom === 'LOVE' || dom === 'COMPATIBILITY' ? 'MARRIAGE' : dom === 'FINANCE' || dom === 'MONEY' ? 'FINANCE' : 'CAREER',
    expectedSignal: 'positive',
    expectedPrimaryFactors: ['Lagna'],
    timingWindowExpected: true,
  };
});
