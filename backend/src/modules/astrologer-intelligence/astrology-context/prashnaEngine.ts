/**
 * Prashna Kundli (Horary Astrology) & Instant Transit Engine
 * Computes live planetary hours, Prashna Lagna, Rahu Kaal, Moon Nakshatra,
 * and Auspicious Muhurat for spontaneous seeker inquiries (e.g. travel, deals, timing).
 */

export type ChoghadiyaType = 'shubh' | 'labh' | 'amrit' | 'char' | 'rog' | 'kaal' | 'udveg';

export interface ChoghadiyaInfo {
  name: string;
  type: ChoghadiyaType;
  nature: 'Auspicious' | 'Favorable' | 'Inauspicious' | 'Neutral';
}

export interface PrashnaHoraryInsight {
  queryTimestamp: string;
  prashnaLagna: string;
  lagnaLord: string;
  moonSign: string;
  moonNakshatra: string;
  rahuKaal: string;
  abhijitMuhurat: string;
  currentChoghadiya: ChoghadiyaInfo;
  favorableDirections: string[];
  verdict: 'Shubh & Anukool' | 'Madhyam (Proceed with Care)' | 'Savdhan (Wait for Shubh Muhurat)';
  rationale: string;
}

const ZODIAC_SIGNS: string[] = [
  'Mesha (Aries)',
  'Vrishabha (Taurus)',
  'Mithuna (Gemini)',
  'Karka (Cancer)',
  'Simha (Leo)',
  'Kanya (Virgo)',
  'Tula (Libra)',
  'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)',
  'Makara (Capricorn)',
  'Kumbha (Aquarius)',
  'Meena (Pisces)',
];

const SIGN_LORDS: Record<string, string> = {
  'Mesha (Aries)': 'Mangal (Mars)',
  'Vrishabha (Taurus)': 'Shukra (Venus)',
  'Mithuna (Gemini)': 'Budha (Mercury)',
  'Karka (Cancer)': 'Chandra (Moon)',
  'Simha (Leo)': 'Surya (Sun)',
  'Kanya (Virgo)': 'Budha (Mercury)',
  'Tula (Libra)': 'Shukra (Venus)',
  'Vrishchika (Scorpio)': 'Mangal (Mars)',
  'Dhanu (Sagittarius)': 'Guru (Jupiter)',
  'Makara (Capricorn)': 'Shani (Saturn)',
  'Kumbha (Aquarius)': 'Shani (Saturn)',
  'Meena (Pisces)': 'Guru (Jupiter)',
};

const NAKSHATRAS: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Standard Vedic Rahu Kaal by day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const RAHU_KAAL_BY_DAY: Record<number, string> = {
  0: '04:30 PM - 06:00 PM', // Sunday
  1: '07:30 AM - 09:00 AM', // Monday
  2: '03:00 PM - 04:30 PM', // Tuesday
  3: '12:00 PM - 01:30 PM', // Wednesday
  4: '01:30 PM - 03:00 PM', // Thursday
  5: '10:30 AM - 12:00 PM', // Friday
  6: '09:00 AM - 10:30 AM', // Saturday
};

const CHOGHADIYA_SLOTS: ChoghadiyaInfo[] = [
  { name: 'Shubh', type: 'shubh', nature: 'Auspicious' },
  { name: 'Labh', type: 'labh', nature: 'Auspicious' },
  { name: 'Amrit', type: 'amrit', nature: 'Auspicious' },
  { name: 'Char', type: 'char', nature: 'Favorable' },
  { name: 'Udveg', type: 'udveg', nature: 'Inauspicious' },
  { name: 'Rog', type: 'rog', nature: 'Inauspicious' },
  { name: 'Kaal', type: 'kaal', nature: 'Inauspicious' },
  { name: 'Shubh', type: 'shubh', nature: 'Auspicious' },
];

export const prashnaEngine = {
  /**
   * Cast an instant Prashna Kundli & Muhurat assessment based on query time.
   */
  castPrashna(date: Date = new Date()): PrashnaHoraryInsight {
    const dayOfWeek = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Approximate Prashna Lagna (each rasi is ~120 minutes, offset by sunrise ~6:00 AM)
    const minutesFromSunrise = (totalMinutes - 360 + 1440) % 1440;
    const lagnaIndex = Math.floor(minutesFromSunrise / 120) % 12;
    const prashnaLagna: string = ZODIAC_SIGNS[lagnaIndex] || 'Mesha (Aries)';
    const lagnaLord: string = SIGN_LORDS[prashnaLagna] || 'Surya (Sun)';

    // Approximate Moon Nakshatra based on day-of-year cycle
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const nakshatraIndex = (dayOfYear * 13 + Math.floor(hours / 2)) % 27;
    const moonNakshatra: string = NAKSHATRAS[nakshatraIndex] || 'Rohini';
    const moonSignIndex = Math.floor((nakshatraIndex * 12) / 27) % 12;
    const moonSign: string = ZODIAC_SIGNS[moonSignIndex] || 'Vrishabha (Taurus)';

    // Choghadiya evaluation (Day hours divided into 8 parts)
    const choghadiyaIndex = Math.floor((hours % 12) / 1.5) % CHOGHADIYA_SLOTS.length;
    const currentChoghadiya: ChoghadiyaInfo = CHOGHADIYA_SLOTS[choghadiyaIndex] || CHOGHADIYA_SLOTS[0]!;

    // Abhijit Muhurat (typically 11:45 AM - 12:35 PM)
    const abhijitMuhurat = '11:48 AM - 12:36 PM';
    const rahuKaal = RAHU_KAAL_BY_DAY[dayOfWeek] ?? '01:30 PM - 03:00 PM';

    const favorableDirections = ['North-East (Ishanya)', 'East (Purva)'];

    let verdict: 'Shubh & Anukool' | 'Madhyam (Proceed with Care)' | 'Savdhan (Wait for Shubh Muhurat)';
    let rationale: string;

    if (currentChoghadiya.type === 'shubh' || currentChoghadiya.type === 'amrit' || currentChoghadiya.type === 'labh') {
      verdict = 'Shubh & Anukool';
      rationale = `Current Choghadiya is ${currentChoghadiya.name} (${currentChoghadiya.nature}) with Prashna Lagna in ${prashnaLagna}. Planetary energies support beginning the endeavor.`;
    } else if (currentChoghadiya.type === 'char') {
      verdict = 'Madhyam (Proceed with Care)';
      rationale = `Prashna chart indicates Char (dynamic) transit. Good for swift movement, journeys, and communication.`;
    } else {
      verdict = 'Savdhan (Wait for Shubh Muhurat)';
      rationale = `Current planetary hour is influenced by ${currentChoghadiya.name}. It is recommended to perform Ganesha Vandana or align with Abhijit Muhurat (${abhijitMuhurat}).`;
    }

    return {
      queryTimestamp: date.toISOString(),
      prashnaLagna,
      lagnaLord,
      moonSign,
      moonNakshatra,
      rahuKaal,
      abhijitMuhurat,
      currentChoghadiya,
      favorableDirections,
      verdict,
      rationale,
    };
  },
};
