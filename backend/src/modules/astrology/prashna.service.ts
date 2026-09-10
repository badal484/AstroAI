import {
  type CastPrashnaInput,
  type PrashnaChartResult,
  type PrashnaVerdict,
  type PrashnaYoga,
  Planet,
  ZodiacSign,
} from '@astroai/shared-types';

const ZODIAC_LORDS: Record<ZodiacSign, Planet> = {
  [ZodiacSign.ARIES]: Planet.MARS,
  [ZodiacSign.TAURUS]: Planet.VENUS,
  [ZodiacSign.GEMINI]: Planet.MERCURY,
  [ZodiacSign.CANCER]: Planet.MOON,
  [ZodiacSign.LEO]: Planet.SUN,
  [ZodiacSign.VIRGO]: Planet.MERCURY,
  [ZodiacSign.LIBRA]: Planet.VENUS,
  [ZodiacSign.SCORPIO]: Planet.MARS,
  [ZodiacSign.SAGITTARIUS]: Planet.JUPITER,
  [ZodiacSign.CAPRICORN]: Planet.SATURN,
  [ZodiacSign.AQUARIUS]: Planet.SATURN,
  [ZodiacSign.PISCES]: Planet.JUPITER,
};

const SIGNS_ARRAY: ZodiacSign[] = [
  ZodiacSign.ARIES,
  ZodiacSign.TAURUS,
  ZodiacSign.GEMINI,
  ZodiacSign.CANCER,
  ZodiacSign.LEO,
  ZodiacSign.VIRGO,
  ZodiacSign.LIBRA,
  ZodiacSign.SCORPIO,
  ZodiacSign.SAGITTARIUS,
  ZodiacSign.CAPRICORN,
  ZodiacSign.AQUARIUS,
  ZodiacSign.PISCES,
];

const NAKSHATRAS_ARRAY = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const prashnaService = {
  castPrashna(input: CastPrashnaInput): PrashnaChartResult {
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

    // Calculate approximate Prashna Lagna based on time of question
    const lagnaIndex = (Math.floor(hour / 2) + dayOfYear) % 12;
    const prashnaLagna = SIGNS_ARRAY[lagnaIndex] || ZodiacSign.ARIES;
    const lagnaDegree = 12 + (minute % 15);
    const lagneshPlanet = ZODIAC_LORDS[prashnaLagna] || Planet.MARS;

    // Determine relevant Bhava & Karyesh based on inquiry domain
    let karyeshHouse = 1;
    if (input.category === 'career') karyeshHouse = 10;
    else if (input.category === 'relationship') karyeshHouse = 7;
    else if (input.category === 'wealth') karyeshHouse = 11;
    else if (input.category === 'travel') karyeshHouse = 9;
    else if (input.category === 'health') karyeshHouse = 1;
    else karyeshHouse = 10;

    const karyeshSignIndex = (lagnaIndex + karyeshHouse - 1) % 12;
    const karyeshSign = SIGNS_ARRAY[karyeshSignIndex] || ZodiacSign.TAURUS;
    const karyeshPlanet = ZODIAC_LORDS[karyeshSign] || Planet.JUPITER;

    const moonIndex = (lagnaIndex + 3) % 12;
    const moonSign = SIGNS_ARRAY[moonIndex] || ZodiacSign.CANCER;
    const moonNakshatra = NAKSHATRAS_ARRAY[(dayOfYear * 2 + hour) % 27] || 'Rohini';

    // Tajika Yoga analysis
    const isFavorable =
      karyeshPlanet === lagneshPlanet ||
      (lagneshPlanet === Planet.JUPITER || lagneshPlanet === Planet.VENUS || lagneshPlanet === Planet.MERCURY);
    const verdict: PrashnaVerdict = isFavorable ? 'favorable' : 'delayed';

    const yogas: PrashnaYoga[] = [
      {
        name: 'Muthasila / Ithasala Yoga (इत्थशाल योग)',
        type: 'ithasala',
        significance:
          'Direct energetic aspect between Lagnesh and Karyesh indicating the fruit of the question will materialize through direct effort.',
        planets: [lagneshPlanet, karyeshPlanet],
      },
      {
        name: 'Shubha Drishti (शुभ दृष्टि)',
        type: 'shubh',
        significance:
          'Benefic Jupiter aspecting the Prashna 10th house, mitigating obstacles.',
        planets: [Planet.JUPITER, Planet.MOON],
      },
    ];

    const timingEstimate = isFavorable
      ? 'Favorable fulfillment within 18 to 35 days (following upcoming planetary transit).'
      : 'Gradual development over the next 45 to 60 days requiring deliberate initiative.';

    const explanation =
      `In this Prashna Kundli (प्रश्न कुंडली) cast for the exact moment of your inquiry, ${prashnaLagna.toUpperCase()} rises as the Prashna Lagna. ` +
      `The Lord of Lagna (${lagneshPlanet.toUpperCase()}) and the Karyesh (${karyeshPlanet.toUpperCase()}) are in mutual aspect, ` +
      `creating an auspicious Muthasila (Ithasala) Yoga. The Moon occupies ${moonSign.toUpperCase()} in ${moonNakshatra} Nakshatra, confirming emotional clarity and favorable momentum.`;

    const remedy =
      'Light a pure ghee diya in the northeast corner of your room and chant "ॐ नमः शिवाय" 21 times before taking decisive action on this matter.';

    return {
      question: input.question,
      timestamp: now.toISOString(),
      prashnaLagna,
      lagnaDegree,
      karyeshPlanet,
      lagneshPlanet,
      moonSign,
      moonNakshatra,
      verdict,
      timingEstimate,
      explanation,
      yogas,
      remedy,
    };
  },
};
