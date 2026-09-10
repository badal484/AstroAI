/**
 * Cosmic Radar & Live Transit Dashboard Engine
 * Computes real-time planetary Hora, Cosmic Alignment Index (0-100%),
 * Rahu Kaal / Abhijit Muhurat status, and daily astrological fortune factors.
 */

export interface CosmicRadarData {
  timestamp: string;
  alignmentScore: number; // 0 to 100
  alignmentRating: 'Param Shubh (Exceptional)' | 'Shubh (Auspicious)' | 'Madhyam (Moderate)' | 'Savdhan (Caution)';
  currentHora: {
    planet: string;
    sanskritName: string;
    lord: string;
    nature: 'Auspicious' | 'Neutral' | 'Dynamic';
    favorableActivities: string;
  };
  todayPanchang: {
    tithi: string;
    nakshatra: string;
    choghadiya: string;
    rahuKaal: string;
    rahuKaalStatus: string; // e.g. "Starts in 45m" or "Currently Active (Varjya)" or "Completed for today"
    abhijitMuhurat: string;
  };
  luckyElements: {
    color: string;
    colorHex: string;
    number: number;
    direction: string;
    gemstoneEnergy: string;
    mantra: string;
  };
}

const HORA_SEQUENCE = [
  { planet: 'Sun', sanskritName: 'Surya Hora', lord: 'Surya', nature: 'Auspicious' as const, favorableActivities: 'Government work, leadership, spiritual worship, health & vital energy' },
  { planet: 'Venus', sanskritName: 'Shukra Hora', lord: 'Shukra', nature: 'Auspicious' as const, favorableActivities: 'Arts, romance, buying vehicles, fashion, creative projects' },
  { planet: 'Mercury', sanskritName: 'Budha Hora', lord: 'Budha', nature: 'Auspicious' as const, favorableActivities: 'Trade, accounts, communication, contracts, learning & writing' },
  { planet: 'Moon', sanskritName: 'Chandra Hora', lord: 'Chandra', nature: 'Auspicious' as const, favorableActivities: 'Travel, emotional healing, family gatherings, public relations' },
  { planet: 'Saturn', sanskritName: 'Shani Hora', lord: 'Shani', nature: 'Neutral' as const, favorableActivities: 'Property matters, agriculture, discipline, charity & meditation' },
  { planet: 'Jupiter', sanskritName: 'Guru Hora', lord: 'Guru', nature: 'Auspicious' as const, favorableActivities: 'Financial investments, big decisions, higher education, guru blessings' },
  { planet: 'Mars', sanskritName: 'Mangal Hora', lord: 'Mangal', nature: 'Dynamic' as const, favorableActivities: 'Sports, physical tasks, litigation, technical & land endeavors' },
];

const RAHU_KAAL_WINDOWS: Record<number, { startHour: number; startMin: number; endHour: number; endMin: number; display: string }> = {
  0: { startHour: 16, startMin: 30, endHour: 18, endMin: 0, display: '04:30 PM - 06:00 PM' }, // Sunday
  1: { startHour: 7, startMin: 30, endHour: 9, endMin: 0, display: '07:30 AM - 09:00 AM' }, // Monday
  2: { startHour: 15, startMin: 0, endHour: 16, endMin: 30, display: '03:00 PM - 04:30 PM' }, // Tuesday
  3: { startHour: 12, startMin: 0, endHour: 13, endMin: 30, display: '12:00 PM - 01:30 PM' }, // Wednesday
  4: { startHour: 13, startMin: 30, endHour: 15, endMin: 0, display: '01:30 PM - 03:00 PM' }, // Thursday
  5: { startHour: 10, startMin: 30, endHour: 12, endMin: 0, display: '10:30 AM - 12:00 PM' }, // Friday
  6: { startHour: 9, startMin: 0, endHour: 10, endMin: 30, display: '09:00 AM - 10:30 AM' }, // Saturday
};

const DAY_LUCKY_ELEMENTS: Record<number, { color: string; colorHex: string; number: number; direction: string; gemstoneEnergy: string; mantra: string }> = {
  0: { color: 'Royal Saffron / Gold', colorHex: '#F59E0B', number: 1, direction: 'East (Purva)', gemstoneEnergy: 'Ruby (Manikya)', mantra: 'ॐ सूर्याय नमः' },
  1: { color: 'Pearl White / Silver', colorHex: '#F3F4F6', number: 2, direction: 'North-West (Vayavya)', gemstoneEnergy: 'Pearl (Moti)', mantra: 'ॐ सोमाय नमः' },
  2: { color: 'Coral Red / Crimson', colorHex: '#EF4444', number: 9, direction: 'South (Dakshin)', gemstoneEnergy: 'Red Coral (Moonga)', mantra: 'ॐ भौमाय नमः' },
  3: { color: 'Emerald Green', colorHex: '#10B981', number: 5, direction: 'North (Uttara)', gemstoneEnergy: 'Emerald (Panna)', mantra: 'ॐ बुधाय नमः' },
  4: { color: 'Golden Yellow', colorHex: '#EAB308', number: 3, direction: 'North-East (Ishanya)', gemstoneEnergy: 'Yellow Sapphire (Pukhraj)', mantra: 'ॐ बृहस्पतये नमः' },
  5: { color: 'Silk White / Pastel Pink', colorHex: '#EC4899', number: 6, direction: 'South-East (Agneya)', gemstoneEnergy: 'Diamond / Opal', mantra: 'ॐ शुक्राय नमः' },
  6: { color: 'Deep Navy / Charcoal Blue', colorHex: '#3B82F6', number: 8, direction: 'West (Pashchim)', gemstoneEnergy: 'Blue Sapphire (Neelam)', mantra: 'ॐ शनैश्चराय नमः' },
};

export const cosmicRadarEngine = {
  calculate(date: Date = new Date()): CosmicRadarData {
    const dayOfWeek = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const currentTotalMin = hours * 60 + minutes;

    // 1. Calculate Active Planetary Hora (Hours from sunrise ~6 AM)
    const hoursFromSunrise = (hours - 6 + 24) % 24;
    // The first hora of the day is ruled by the lord of that day
    const dayRulerIndex = [0, 3, 6, 2, 5, 1, 4][dayOfWeek] ?? 0;
    const currentHoraIndex = (dayRulerIndex + hoursFromSunrise) % 7;
    const currentHora = HORA_SEQUENCE[currentHoraIndex] || HORA_SEQUENCE[0]!;

    // 2. Rahu Kaal Status
    const rahuWindow = RAHU_KAAL_WINDOWS[dayOfWeek]!;
    const rahuStartMin = rahuWindow.startHour * 60 + rahuWindow.startMin;
    const rahuEndMin = rahuWindow.endHour * 60 + rahuWindow.endMin;

    let rahuKaalStatus: string;
    let isRahuKaalActive = false;

    if (currentTotalMin >= rahuStartMin && currentTotalMin <= rahuEndMin) {
      isRahuKaalActive = true;
      const minsLeft = rahuEndMin - currentTotalMin;
      rahuKaalStatus = `Active Now (${minsLeft}m remaining - Varjya)`;
    } else if (currentTotalMin < rahuStartMin) {
      const minsUntil = rahuStartMin - currentTotalMin;
      const hoursUntil = Math.floor(minsUntil / 60);
      const remMins = minsUntil % 60;
      rahuKaalStatus = `Starts in ${hoursUntil > 0 ? `${hoursUntil}h ` : ''}${remMins}m`;
    } else {
      rahuKaalStatus = `Completed for today`;
    }

    // 3. Compute Alignment Score (0 - 100)
    let score = 75;
    if (currentHora.nature === 'Auspicious') score += 15;
    else if (currentHora.nature === 'Neutral') score += 5;
    else score -= 5;

    if (isRahuKaalActive) score -= 30;

    // Abhijit Muhurat bonus (11:48 AM - 12:36 PM)
    if (currentTotalMin >= 708 && currentTotalMin <= 756) {
      score += 15;
    }

    // Bound between 20 and 98
    score = Math.min(98, Math.max(25, score));

    let alignmentRating: 'Param Shubh (Exceptional)' | 'Shubh (Auspicious)' | 'Madhyam (Moderate)' | 'Savdhan (Caution)';
    if (score >= 85) alignmentRating = 'Param Shubh (Exceptional)';
    else if (score >= 70) alignmentRating = 'Shubh (Auspicious)';
    else if (score >= 50) alignmentRating = 'Madhyam (Moderate)';
    else alignmentRating = 'Savdhan (Caution)';

    const lucky = DAY_LUCKY_ELEMENTS[dayOfWeek] ?? DAY_LUCKY_ELEMENTS[0]!;

    return {
      timestamp: date.toISOString(),
      alignmentScore: score,
      alignmentRating,
      currentHora,
      todayPanchang: {
        tithi: 'Shukla Paksha Dashami',
        nakshatra: 'Rohini Nakshatra',
        choghadiya: currentHora.nature === 'Auspicious' ? 'Amrit / Shubh' : 'Char',
        rahuKaal: rahuWindow.display,
        rahuKaalStatus,
        abhijitMuhurat: '11:48 AM - 12:36 PM',
      },
      luckyElements: lucky,
    };
  },
};
