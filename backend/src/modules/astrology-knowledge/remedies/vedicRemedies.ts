/**
 * Vedic Astrology Knowledge Layer: Authentic Vedic Upayas (Remedies)
 * Sattvic Parashari principles: Mantra (Sound), Daana (Charity), Seva (Service), and Behavioral Alignment (Sadhana).
 * strictly avoids fear-based rituals or commercial exploitation.
 */

export interface VedicRemedy {
  planet: string;
  deity: string;
  mantra: {
    beejMantra: string;
    vedicOrStotram: string;
    recommendedRounds: number; // e.g. 108 times
  };
  daana: {
    recommendedItems: string[];
    beneficiary: string;
    auspiciousDay: string;
  };
  seva: string[];
  lifestyleAdjustment: string[];
  philosophicalNote: string;
}

export const VEDIC_REMEDIES: Record<string, VedicRemedy> = {
  Sun: {
    planet: 'Sun',
    deity: 'Surya Narayana / Gayatri',
    mantra: {
      beejMantra: 'Om Hram Hreem Hroum Sah Suryaya Namah',
      vedicOrStotram: 'Aditya Hridaya Stotram or Gayatri Mantra',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Wheat grains', 'Jaggery (Gud)', 'Copper vessels', 'Red sandalwood'],
      beneficiary: 'Elders, spiritual teachers, or community kitchens',
      auspiciousDay: 'Sunday morning'
    },
    seva: [
      'Offer selfless service to elders and father figures',
      'Contribute to public leadership or community governance'
    ],
    lifestyleAdjustment: [
      'Wake up before sunrise and practice Surya Namaskar',
      'Offer clean water (Surya Arghya) facing East in the morning',
      'Cultivate transparent honesty and moral integrity in daily decisions'
    ],
    philosophicalNote: 'Strengthening the Sun is about awakening soul dignity, self-respect, and moral clarity rather than seeking external ego validation.'
  },

  Moon: {
    planet: 'Moon',
    deity: 'Lord Shiva / Parvati / Chandra Deva',
    mantra: {
      beejMantra: 'Om Shram Shreem Shroum Sah Chandraya Namah',
      vedicOrStotram: 'Om Namah Shivaya or Chandra Gayatri',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Rice', 'Milk', 'White sweets', 'Silver items', 'Clean drinking water'],
      beneficiary: 'Mothers, elderly women, or orphanages',
      auspiciousDay: 'Monday evening'
    },
    seva: [
      'Care for mothers, maternal figures, and emotional wellbeing of dependents',
      'Support water conservation initiatives'
    ],
    lifestyleAdjustment: [
      'Practice daily calming breathwork (Pranayama) and mindfulness',
      'Drink water stored in silver or earthen vessels',
      'Maintain regular sleep cycles and limit late-night screen exposure'
    ],
    philosophicalNote: 'Strengthening the Moon nurtures emotional stability, mental peace, and intuitive clarity.'
  },

  Mars: {
    planet: 'Mars',
    deity: 'Lord Hanuman / Kartikeya (Murugan)',
    mantra: {
      beejMantra: 'Om Kram Kreem Kroum Sah Bhaumaya Namah',
      vedicOrStotram: 'Hanuman Chalisa or Kartikeya Stotram',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Red lentils (Masoor dal)', 'Jaggery', 'Red flowers', 'Copper'],
      beneficiary: 'Emergency workers, athletes, or blood donation drives',
      auspiciousDay: 'Tuesday'
    },
    seva: [
      'Help siblings, colleagues, or physical labor communities',
      'Engage in volunteer disaster response or blood donation'
    ],
    lifestyleAdjustment: [
      'Channel excess energy into disciplined physical exercise or sports',
      'Practice mindful pause before reacting to verbal provocations',
      'Develop protective courage in defense of righteous causes'
    ],
    philosophicalNote: 'Remedying Mars is about converting raw aggression into disciplined courage and righteous protection.'
  },

  Mercury: {
    planet: 'Mercury',
    deity: 'Lord Vishnu / Saraswati',
    mantra: {
      beejMantra: 'Om Bram Breem Broum Sah Budhaya Namah',
      vedicOrStotram: 'Vishnu Sahasranama or Budha Pancharatna',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Green Moong dal', 'Green vegetables', 'Educational books', 'Stationery'],
      beneficiary: 'Needy students, schools, or environmental initiatives',
      auspiciousDay: 'Wednesday'
    },
    seva: [
      'Tutor underprivileged children or assist in educational programs',
      'Plant and nurture green trees and tulsi plants'
    ],
    lifestyleAdjustment: [
      'Maintain daily journaling to clarify thoughts and emotional balance',
      'Practice precise, honest, and non-manipulative communication',
      'Continuously acquire knowledge and read uplifting literature'
    ],
    philosophicalNote: 'Mercury remedies cultivate intellectual discernment (Viveka), balanced communication, and commercial ethics.'
  },

  Jupiter: {
    planet: 'Jupiter',
    deity: 'Lord Brihaspati / Dakshinamurthy / Lord Vishnu',
    mantra: {
      beejMantra: 'Om Gram Greem Groum Sah Gurave Namah',
      vedicOrStotram: 'Brihaspati Stotram or Guru Paduka Stotram',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Yellow split peas (Chana dal)', 'Turmeric', 'Yellow cloth', 'Sacred scriptures', 'Ghee'],
      beneficiary: 'Teachers, mentors, spiritual centers, or scholars',
      auspiciousDay: 'Thursday morning'
    },
    seva: [
      'Show deep respect and service to gurus, teachers, and elders',
      'Support spiritual educational institutions or libraries'
    ],
    lifestyleAdjustment: [
      'Engage in daily study of philosophical and ethical texts',
      'Act as an honest mentor and benevolent guide to those younger',
      'Cultivate gratitude and optimism in personal life'
    ],
    philosophicalNote: 'Jupiter remedies align the soul with divine wisdom (Dharma), broad benevolence, and enduring faith.'
  },

  Venus: {
    planet: 'Venus',
    deity: 'Goddess Mahalakshmi / Shukracharya',
    mantra: {
      beejMantra: 'Om Dram Dreem Droum Sah Shukraya Namah',
      vedicOrStotram: 'Mahalakshmi Ashtakam or Sri Suktam',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['White silk/cotton clothes', 'Rice', 'Curd', 'Pure cow ghee', 'White fragrant flowers'],
      beneficiary: 'Artisans, women in need, or cultural organizations',
      auspiciousDay: 'Friday'
    },
    seva: [
      'Treat spouse, women, and artists with utmost dignity and honor',
      'Support fine arts, cultural events, and community beautification'
    ],
    lifestyleAdjustment: [
      'Maintain high personal cleanliness, elegance, and aesthetic surroundings',
      'Practice mutual respect and transparency in marital relationships',
      'Avoid overindulgence and practice aesthetic moderation'
    ],
    philosophicalNote: 'Venus remedies harmonize relationships, refine artistic creativity, and bring genuine contentment.'
  },

  Saturn: {
    planet: 'Saturn',
    deity: 'Lord Shani / Lord Hanuman / Kurma Avatar',
    mantra: {
      beejMantra: 'Om Pram Preem Proum Sah Shanaischaraya Namah',
      vedicOrStotram: 'Dasharatha Shani Stotram or Hanuman Chalisa',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Black sesame seeds (Til)', 'Mustard oil', 'Iron cookware', 'Black blankets', 'Shoes'],
      beneficiary: 'Sanitation workers, disabled individuals, or daily wage laborers',
      auspiciousDay: 'Saturday evening'
    },
    seva: [
      'Regularly feed stray dogs, crows, or shelter animals',
      'Volunteer in support of elderly or underprivileged laborers'
    ],
    lifestyleAdjustment: [
      'Cultivate punctuality, strict discipline, and patience',
      'Accept necessary life delays without bitter resentment',
      'Live with simplicity, humility, and unwavering commitment to duty'
    ],
    philosophicalNote: 'Saturn remedies burn past karma through disciplined duty, humility, and selfless service.'
  },

  Rahu: {
    planet: 'Rahu',
    deity: 'Goddess Durga / Bhairava / Saraswati',
    mantra: {
      beejMantra: 'Om Bhram Bhreem Bhroum Sah Rahave Namah',
      vedicOrStotram: 'Durga Saptashati / Rahu Kavacham',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Coconut', 'Urad dal', 'Blue cloth', 'Old electronic items donation'],
      beneficiary: 'Lepers, sanitation staff, or distressed individuals',
      auspiciousDay: 'Wednesday or Saturday night'
    },
    seva: [
      'Help sanitation workers and keep living environment free of electronic clutter',
      'Feed birds and stray animals'
    ],
    lifestyleAdjustment: [
      'Avoid speculative illusions, gambling, and intoxicants',
      'Ground oneself in nature and practice daily silence / Vipassana',
      'Maintain clarity and transparency in all financial transactions'
    ],
    philosophicalNote: 'Rahu remedies purify desires, dissolve mental obsession, and guide material ambition toward dharmic purpose.'
  },

  Ketu: {
    planet: 'Ketu',
    deity: 'Lord Ganesha / Matsya Avatar',
    mantra: {
      beejMantra: 'Om Sram Sreem Sroum Sah Ketave Namah',
      vedicOrStotram: 'Ganesha Atharvashirsha or Ketu Pancharatna',
      recommendedRounds: 108
    },
    daana: {
      recommendedItems: ['Two-colored blanket', 'Sesame seeds', 'Mustard seeds', 'Cooked food to stray animals'],
      beneficiary: 'Monks, spiritual seekers, or stray dogs',
      auspiciousDay: 'Tuesday or Thursday'
    },
    seva: [
      'Feed and care for street dogs and vulnerable animals',
      'Support hermitages, temples, or spiritual ashrams'
    ],
    lifestyleAdjustment: [
      'Practice regular meditation on self-inquiry (Atma Vichara)',
      'Release excessive attachment to material outcomes',
      'Cultivate inner contentment and spiritual surrender'
    ],
    philosophicalNote: 'Ketu remedies open the path to spiritual awakening, intuitive mastery, and ultimate liberation (Moksha).'
  }
};

/**
 * Get Vedic Remedy by planet name
 */
export function getRemedyForPlanet(planet: string): VedicRemedy | null {
  return VEDIC_REMEDIES[planet] || null;
}
