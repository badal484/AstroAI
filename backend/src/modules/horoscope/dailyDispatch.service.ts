import type { DailyDispatchResult } from '@astroai/shared-types';

export const dailyDispatchService = {
  getDailyDispatch(_userId: string, dateStr?: string): DailyDispatchResult {
    const today = dateStr || new Date().toISOString().slice(0, 10);

    return {
      date: today,
      cosmicScore: 88,
      tithi: 'Shukla Paksha Dashami (दशमी)',
      nakshatra: 'Rohini Nakshatra (रोहिणी नक्षत्र) - Ruled by Moon & Prajapati',
      activeHora: 'Guru Hora (बृहस्पति होरा) - Golden for Learning & Contracts',
      favorableActivities: [
        'Initiating new financial agreements & commercial discussions',
        'Spiritual study, meditation, and chanting sacred mantras',
        'Connecting with mentors, teachers, and elders',
      ],
      abhijitMuhurat: '11:48 AM - 12:36 PM (Peak Auspicious Window)',
      rahuKaal: '03:15 PM - 04:45 PM (Avoid starting new ventures)',
      transitSummary:
        'Transit Moon in exalted Rohini activates creative expansion and emotional equilibrium. Jupiter aspects key career angles, supporting bold, dharmic initiatives.',
      dailySadhanaMantra: {
        sanskrit: 'ॐ नमो भगवते वासुदेवाय',
        transliteration: 'Om Namo Bhagavate Vasudevaya',
        meaning: 'I surrender to the Supreme Divine Consciousness residing in all beings.',
        targetChants: 108,
      },
      audioBrief: {
        title: 'Brahma Muhurat Cosmic Dispatch',
        durationSeconds: 90,
        script:
          'Shubh Prabhat. Today is blessed under Rohini Nakshatra with Moon in supreme dignity. Between 11:48 AM and 12:36 PM during Abhijit Muhurat, cosmic prana is at its peak for your key decisions. Recite Om Namo Bhagavate Vasudevaya and proceed with confidence.',
      },
    };
  },
};
