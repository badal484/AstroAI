/**
 * Vedic Astrology Knowledge Layer: 27 Nakshatras (Lunar Mansions)
 * Classical Parashari lunar mansions, ruling grahas, deities, ganas, yonis, and psychological significations.
 */

export type GanaType = 'Deva' | 'Manushya' | 'Rakshasa';

export interface NakshatraInfo {
  index: number; // 1 to 27
  sanskritName: string;
  rulingPlanet: string;
  deity: string;
  symbol: string;
  gana: GanaType;
  yoni: string;
  rashiSpan: string; // e.g. "Mesha 0°00' - 13°20'"
  startDegree: number; // 0 to 360
  endDegree: number;
  qualities: string[];
  auspiciousActivities: string[];
  careerTendencies: string[];
  psychologicalThemes: string[];
}

export const NAKSHATRAS: Record<number, NakshatraInfo> = {
  1: {
    index: 1,
    sanskritName: 'Ashwini',
    rulingPlanet: 'Ketu',
    deity: 'Ashwini Kumaras (Celestial Physicians)',
    symbol: "Horse's Head",
    gana: 'Deva',
    yoni: 'Male Horse',
    rashiSpan: 'Mesha 0°00\' - 13°20\'',
    startDegree: 0,
    endDegree: 13.3333,
    qualities: ['Swiftness', 'Healing', 'Pioneering energy', 'Initiative', 'Spontaneity'],
    auspiciousActivities: ['Starting medical treatments', 'Travel', 'Vehicle purchase', 'Initiating new projects'],
    careerTendencies: ['Medicine & Healing', 'Transportation', 'Athletics', 'Emergency Response', 'Equestrian'],
    psychologicalThemes: ['Desire for swift action', 'Impatient eagerness', 'Inherent healing touch', 'Youthful spirit']
  },
  2: {
    index: 2,
    sanskritName: 'Bharani',
    rulingPlanet: 'Venus',
    deity: 'Yama (Lord of Dharma & Transformation)',
    symbol: 'Yoni / Triangle',
    gana: 'Manushya',
    yoni: 'Elephant',
    rashiSpan: 'Mesha 13°20\' - 26°40\'',
    startDegree: 13.3333,
    endDegree: 26.6667,
    qualities: ['Transformation', 'Restraint', 'Bearing burdens', 'Creativity under pressure'],
    auspiciousActivities: ['Discipline', 'Detoxification', 'Concluding old cycles', 'Creative arts with emotional depth'],
    careerTendencies: ['Obstetrics & Gynecology', 'Mortuary sciences', 'Fine Arts', 'Crisis Management', 'Film Direction'],
    psychologicalThemes: ['Endurance through cycles of birth and death', 'Emotional intensity', 'Sense of moral duty']
  },
  3: {
    index: 3,
    sanskritName: 'Krittika',
    rulingPlanet: 'Sun',
    deity: 'Agni (God of Fire)',
    symbol: 'Razor / Flame',
    gana: 'Rakshasa',
    yoni: 'Female Sheep',
    rashiSpan: 'Mesha 26°40\' - Vrishabha 10°00\'',
    startDegree: 26.6667,
    endDegree: 40.0,
    qualities: ['Purification', 'Sharp discernment', 'Courage', 'Direct honesty', 'Transformative digestion'],
    auspiciousActivities: ['Cutting out negative habits', 'Culinary arts', 'Debate', 'Undergoing surgery', 'Metalwork'],
    careerTendencies: ['Culinary/Chefs', 'Military & Defense', 'Surgeons', 'Critics', 'Metallurgy'],
    psychologicalThemes: ['Burning away impurities', 'Fierce protectiveness', 'Direct, uncompromising truth']
  },
  4: {
    index: 4,
    sanskritName: 'Rohini',
    rulingPlanet: 'Moon',
    deity: 'Brahma / Prajapati (Creator of the Cosmos)',
    symbol: 'Chariot / Ox Cart / Banyan Tree',
    gana: 'Manushya',
    yoni: 'Serpent',
    rashiSpan: 'Vrishabha 10°00\' - 23°20\'',
    startDegree: 40.0,
    endDegree: 53.3333,
    qualities: ['Fertility', 'Sensory beauty', 'Artistic refinement', 'Growth', 'Material abundance'],
    auspiciousActivities: ['Agriculture', 'Marriage', 'Creative design', 'Financial investments', 'Romantic beginnings'],
    careerTendencies: ['Fashion & Design', 'Agriculture', 'Cosmetics', 'Hospitality', 'Real Estate', 'Visual Arts'],
    psychologicalThemes: ['Longing for beauty and emotional nourishment', 'Charming allure', 'Desire for luxury and comfort']
  },
  5: {
    index: 5,
    sanskritName: 'Mrigashira',
    rulingPlanet: 'Mars',
    deity: 'Soma (Chandra / Divine Nectar)',
    symbol: "Deer's Head",
    gana: 'Deva',
    yoni: 'Female Serpent',
    rashiSpan: 'Vrishabha 23°20\' - Mithuna 6°40\'',
    startDegree: 53.3333,
    endDegree: 66.6667,
    qualities: ['Searching', 'Curiosity', 'Gentleness', 'Exploration', 'Sensory inquiry'],
    auspiciousActivities: ['Research', 'Travel', 'Poetry', 'Exploratory discussions', 'Acquiring knowledge'],
    careerTendencies: ['Research & Investigation', 'Travel journalism', 'Poetry & Music', 'Gemology', 'Software Architecture'],
    psychologicalThemes: ['Constant quest for higher fulfillment', 'Gentle yet restless mind', 'Love for exploration']
  },
  6: {
    index: 6,
    sanskritName: 'Ardra',
    rulingPlanet: 'Rahu',
    deity: 'Rudra (Storm God / Destructive Aspect of Shiva)',
    symbol: 'Teardrop / Diamond',
    gana: 'Manushya',
    yoni: 'Female Dog',
    rashiSpan: 'Mithuna 6°40\' - 20°00\'',
    startDegree: 66.6667,
    endDegree: 80.0,
    qualities: ['Stormy transformation', 'Intellectual breakthrough', 'Emotional catharsis', 'Overcoming turbulence'],
    auspiciousActivities: ['Overcoming barriers', 'Demolition and rebuilding', 'Deep tech research', 'Psychotherapy'],
    careerTendencies: ['Cutting-edge Software / AI', 'Nuclear science', 'Weather forecasting', 'Psychotherapy', 'Investigation'],
    psychologicalThemes: ['Transformation through emotional tempest', 'Sharp analytical intellect', 'Rebirth after tears']
  },
  7: {
    index: 7,
    sanskritName: 'Punarvasu',
    rulingPlanet: 'Jupiter',
    deity: 'Aditi (Cosmic Mother of Gods / Infinite Space)',
    symbol: 'Bow and Quiver of Arrows',
    gana: 'Deva',
    yoni: 'Female Cat',
    rashiSpan: 'Mithuna 20°00\' - Karka 3°20\'',
    startDegree: 80.0,
    endDegree: 93.3333,
    qualities: ['Return of the light', 'Restoration', 'Nurturing renewal', 'Benevolence', 'Spiritual purity'],
    auspiciousActivities: ['Relocation', 'Repairs', 'Spiritual initiation', 'Starting educational ventures', 'Reconciliation'],
    careerTendencies: ['Teaching & Academia', 'Counseling & Social Work', 'Architecture & Renovation', 'Civil Aviation'],
    psychologicalThemes: ['Optimism and renewal after adversity', 'Forgiving nature', 'Innate ethical compass']
  },
  8: {
    index: 8,
    sanskritName: 'Pushya',
    rulingPlanet: 'Saturn',
    deity: 'Brihaspati (Guru of the Devas / Wisdom)',
    symbol: "Cow's Udder / Lotus / Circle",
    gana: 'Deva',
    yoni: 'Male Sheep',
    rashiSpan: 'Karka 3°20\' - 16°40\'',
    startDegree: 93.3333,
    endDegree: 106.6667,
    qualities: ['Supreme nourishment', 'Spiritual wisdom', 'Dharmic benevolence', 'Steadfast support'],
    auspiciousActivities: ['All auspicious beginnings (except marriage)', 'Spiritual sadhana', 'Purchasing gold', 'Healing rituals'],
    careerTendencies: ['Spiritual Leadership', 'Philanthropy', 'High Governance', 'Education Management', 'Dairy & Food production'],
    psychologicalThemes: ['Deep urge to nourish and protect others', 'Paternal/maternal warmth', 'Devotion to dharma']
  },
  9: {
    index: 9,
    sanskritName: 'Ashlesha',
    rulingPlanet: 'Mercury',
    deity: 'Nagas (Serpent Deities of Wisdom & Mystery)',
    symbol: 'Coiled Serpent',
    gana: 'Rakshasa',
    yoni: 'Male Cat',
    rashiSpan: 'Karka 16°40\' - 30°00\'',
    startDegree: 106.6667,
    endDegree: 120.0,
    qualities: ['Kundalini power', 'Psychological penetration', 'Hypnotic influence', 'Strategic secrecy'],
    auspiciousActivities: ['Meditation on inner energy', 'Occult studies', 'Strategic business moves', 'Toxicology/Pharmaceuticals'],
    careerTendencies: ['Psychology & Psychiatry', 'Pharmaceuticals', 'Diplomacy / Intelligence', 'Astrology / Esotericism'],
    psychologicalThemes: ['Intense psychological depth', 'Self-protective boundaries', 'High perceptive intuition']
  },
  10: {
    index: 10,
    sanskritName: 'Magha',
    rulingPlanet: 'Ketu',
    deity: 'Pitris (Ancestral Spirits)',
    symbol: 'Throne / Palanquin',
    gana: 'Rakshasa',
    yoni: 'Male Rat',
    rashiSpan: 'Simha 0°00\' - 13°20\'',
    startDegree: 120.0,
    endDegree: 133.3333,
    qualities: ['Ancestral lineage', 'Royal dignity', 'Authoritative leadership', 'Traditional pride'],
    auspiciousActivities: ['Ancestral ceremonies (Shraddha)', 'Honoring mentors', 'Assumption of office', 'Public celebrations'],
    careerTendencies: ['Government Service', 'Historians & Archaeologists', 'Corporate Executives', 'Genealogists'],
    psychologicalThemes: ['Deep connection to lineage and legacy', 'Desire for respect and recognition', 'Noble conduct']
  },
  11: {
    index: 11,
    sanskritName: 'Purva Phalguni',
    rulingPlanet: 'Venus',
    deity: 'Bhaga (God of Prosperity & Conjugal Bliss)',
    symbol: 'Front Legs of Bed / Hammock',
    gana: 'Manushya',
    yoni: 'Female Rat',
    rashiSpan: 'Simha 13°20\' - 26°40\'',
    startDegree: 133.3333,
    endDegree: 146.6667,
    qualities: ['Conjugal happiness', 'Creative delight', 'Relaxation', 'Affection', 'Social charm'],
    auspiciousActivities: ['Romance & Courtship', 'Artistic performances', 'Recreation & Rest', 'Marriage ceremonies'],
    careerTendencies: ['Performing Arts', 'Event Planning', 'Luxury Tourism', 'Matchmaking', 'Music Production'],
    psychologicalThemes: ['Celebration of romantic joy', 'Generous social charm', 'Desire for comfort and leisure']
  },
  12: {
    index: 12,
    sanskritName: 'Uttara Phalguni',
    rulingPlanet: 'Sun',
    deity: 'Aryaman (God of Friendship & Honorable Contracts)',
    symbol: 'Back Legs of Bed',
    gana: 'Manushya',
    yoni: 'Male Cow / Bull',
    rashiSpan: 'Simha 26°40\' - Kanya 10°00\'',
    startDegree: 146.6667,
    endDegree: 160.0,
    qualities: ['Loyalty', 'Honorable commitments', 'Generous patronage', 'Dharmic alliances'],
    auspiciousActivities: ['Entering formal partnerships', 'Signing treaties/contracts', 'Marriage', 'Charitable donations'],
    careerTendencies: ['Philanthropy', 'Diplomatic Missions', 'Legal Contracts', 'Public Advocacy', 'Social Leadership'],
    psychologicalThemes: ['Commitment to honor and friendship', 'Steadfast loyalty in contracts', 'Generous beneficence']
  },
  13: {
    index: 13,
    sanskritName: 'Hasta',
    rulingPlanet: 'Moon',
    deity: 'Savitr (The Golden Solar Impeller)',
    symbol: 'Open Hand / Fist',
    gana: 'Deva',
    yoni: 'Female Buffalo',
    rashiSpan: 'Kanya 10°00\' - 23°20\'',
    startDegree: 160.0,
    endDegree: 173.3333,
    qualities: ['Dexterity of hand', 'Craftsmanship', 'Humor and wit', 'Skillful manifestation'],
    auspiciousActivities: ['Handicrafts & Sculpture', 'Surgery', 'Astrological calculation', 'Magical/technical skills'],
    careerTendencies: ['Surgeons', 'Artisans & Craftsmen', 'Comedians', 'Data Scientists', 'Acupuncturists / Chiropractors'],
    psychologicalThemes: ['Resourcefulness and manual intellect', 'Lighthearted wit', 'Ability to mold reality by skill']
  },
  14: {
    index: 14,
    sanskritName: 'Chitra',
    rulingPlanet: 'Mars',
    deity: 'Twashtar / Vishwakarma (Cosmic Architect)',
    symbol: 'Bright Gem / Pearl',
    gana: 'Rakshasa',
    yoni: 'Female Tiger',
    rashiSpan: 'Kanya 23°20\' - Tula 6°40\'',
    startDegree: 173.3333,
    endDegree: 186.6667,
    qualities: ['Visual brilliance', 'Structural design', 'Aesthetic mastery', 'Architectural vision'],
    auspiciousActivities: ['Jewelry making', 'Architectural planning', 'Graphic design', 'Fashion styling', 'Visual storytelling'],
    careerTendencies: ['Architects', 'Jewelers & Designers', 'Interior Decorators', 'Visual Effects (VFX)', 'Mechanical Engineering'],
    psychologicalThemes: ['Craving for aesthetic perfection and elegance', 'Charismatic outward sparkle', 'Creative self-expression']
  },
  15: {
    index: 15,
    sanskritName: 'Swati',
    rulingPlanet: 'Rahu',
    deity: 'Vayu (Wind God of Movement & Prana)',
    symbol: 'Young Plant Sprout swaying in the wind / Coral',
    gana: 'Deva',
    yoni: 'Male Buffalo',
    rashiSpan: 'Tula 6°40\' - 20°00\'',
    startDegree: 186.6667,
    endDegree: 200.0,
    qualities: ['Flexibility', 'Independence', 'Adaptability', 'Commercial flair', 'Breath of life'],
    auspiciousActivities: ['Business negotiation', 'Aviation travel', 'Pranayama & Yoga', 'Learning foreign languages'],
    careerTendencies: ['International Trade', 'Aviation / Pilot', 'Diplomats', 'Linguists', 'Stock Traders', 'Pranic Healers'],
    psychologicalThemes: ['Adaptability to any environment', 'Deep desire for personal freedom', 'Diplomatic independence']
  },
  16: {
    index: 16,
    sanskritName: 'Vishakha',
    rulingPlanet: 'Jupiter',
    deity: 'Indragni (Indra + Agni: Combined Power and Fire)',
    symbol: 'Triumphal Arch / Potter\'s Wheel',
    gana: 'Rakshasa',
    yoni: 'Male Tiger',
    rashiSpan: 'Tula 20°00\' - Vrischika 3°20\'',
    startDegree: 200.0,
    endDegree: 213.3333,
    qualities: ['Singular focus', 'Goal-directed ambition', 'Triumph over competition', 'Dual energy'],
    auspiciousActivities: ['Launching competitive bids', 'Intense focused study', 'Celebration of major milestones'],
    careerTendencies: ['Litigation Lawyers', 'Political Campaigners', 'Elite Athletes', 'Motivational Leaders', 'Broadcasters'],
    psychologicalThemes: ['Intense, unyielding drive toward triumph', 'Fixity of purpose', 'Transforming envy into excellence']
  },
  17: {
    index: 17,
    sanskritName: 'Anuradha',
    rulingPlanet: 'Saturn',
    deity: 'Mitra (God of Friendship, Devotion & Cooperation)',
    symbol: 'Lotus Flower / Staff',
    gana: 'Deva',
    yoni: 'Female Deer',
    rashiSpan: 'Vrischika 3°20\' - 16°40\'',
    startDegree: 213.3333,
    endDegree: 226.6667,
    qualities: ['Devotional loyalty', 'Bridging differences', 'Flourishing in murky waters (Lotus)', 'Heartfelt friendship'],
    auspiciousActivities: ['Group collaboration', 'Devotional singing (Kirtan)', 'Travel abroad', 'Cultivating sacred bonds'],
    careerTendencies: ['Community Organizing', 'Music & Devotional Arts', 'International NGO Leadership', 'Corporate Alliances'],
    psychologicalThemes: ['Bhakti and pure devotion', 'Ability to retain purity amidst chaos', 'Loyalty to chosen souls']
  },
  18: {
    index: 18,
    sanskritName: 'Jyeshtha',
    rulingPlanet: 'Mercury',
    deity: 'Indra (King of the Gods / Guardian of the Realm)',
    symbol: 'Round Amulet / Talisman / Umbrella',
    gana: 'Rakshasa',
    yoni: 'Male Deer',
    rashiSpan: 'Vrischika 16°40\' - 30°00\'',
    startDegree: 226.6667,
    endDegree: 240.0,
    qualities: ['Seniority', 'Protective strength', 'Occult sovereignty', 'Resourceful defense'],
    auspiciousActivities: ['Defensive strategies', 'Assuming seniority/authority', 'Tantric disciplines', 'Administration'],
    careerTendencies: ['Intelligence Chiefs', 'Elected Representatives', 'Senior Executives', 'Occultists', 'Crisis Directors'],
    psychologicalThemes: ['Protective courage for dependents', 'Pride in sovereignty', 'Mastery over subtle realms']
  },
  19: {
    index: 19,
    sanskritName: 'Mula',
    rulingPlanet: 'Ketu',
    deity: 'Nirriti (Goddess of Dissolution and Root Truth)',
    symbol: 'Tied Bundle of Roots / Lion\'s Tail',
    gana: 'Rakshasa',
    yoni: 'Male Dog',
    rashiSpan: 'Dhanu 0°00\' - 13°20\'',
    startDegree: 240.0,
    endDegree: 253.3333,
    qualities: ['Root investigation', 'Dissolution of illusions', 'Radical transformation', 'Uncovering core origins'],
    auspiciousActivities: ['Deep research', 'Herbology & Root medicine', 'Renunciation of falsehoods', 'Underground exploration'],
    careerTendencies: ['Root-cause Investigators', 'Botanists & Herbalists', 'Deep-sea/Geological Researchers', 'Philosophers'],
    psychologicalThemes: ['Relentless search for fundamental reality', 'Uprooting obsolete structures', 'Spiritual depth']
  },
  20: {
    index: 20,
    sanskritName: 'Purva Ashadha',
    rulingPlanet: 'Venus',
    deity: 'Apas (Cosmic Waters of Life)',
    symbol: 'Winnowing Basket / Elephant Tusk',
    gana: 'Manushya',
    yoni: 'Male Monkey',
    rashiSpan: 'Dhanu 13°20\' - 26°40\'',
    startDegree: 253.3333,
    endDegree: 266.6667,
    qualities: ['Invincible confidence', 'Cleansing purity', 'Inspirational eloquence', 'Filtering truth from noise'],
    auspiciousActivities: ['Inspirational oratory', 'Water-related journeys', 'Artistic exhibitions', 'Dharmic debates'],
    careerTendencies: ['Public Speakers & Orators', 'Maritime Industry', 'Philosophical Writers', 'Legal Advocates', 'Filmmakers'],
    psychologicalThemes: ['Undefeatable inner optimism', 'Charismatic influence on crowds', 'Purifying discernment']
  },
  21: {
    index: 21,
    sanskritName: 'Uttara Ashadha',
    rulingPlanet: 'Sun',
    deity: 'Vishwadevas (Universal Gods of Truth & Virtues)',
    symbol: 'Small Cot / Elephant Tusk',
    gana: 'Manushya',
    yoni: 'Male Mongoose',
    rashiSpan: 'Dhanu 26°40\' - Makara 10°00\'',
    startDegree: 266.6667,
    endDegree: 280.0,
    qualities: ['Permanent victory through virtue', 'Universal integrity', 'Humility in power', 'Steadfast dharma'],
    auspiciousActivities: ['Laying foundation stones', 'Coronations/Inaugurations', 'Long-term contracts', 'Dharmic alliances'],
    careerTendencies: ['Statesmanship', 'Judiciary', 'Pioneering Institution Building', 'Global Leadership', 'Ethics Officers'],
    psychologicalThemes: ['Enduring integrity that outlasts fleeting trends', 'Commitment to universal righteousness']
  },
  22: {
    index: 22,
    sanskritName: 'Shravana',
    rulingPlanet: 'Moon',
    deity: 'Vishnu (The Preserver of the Cosmos)',
    symbol: 'Ear / Three Footprints',
    gana: 'Deva',
    yoni: 'Female Monkey',
    rashiSpan: 'Makara 10°00\' - 23°20\'',
    startDegree: 280.0,
    endDegree: 293.3333,
    qualities: ['Sacred listening (Shruti)', 'Oral tradition', 'Wisdom retention', 'Connecting through empathy'],
    auspiciousActivities: ['Listening to sacred discourses', 'Audio production/podcasting', 'Learning languages', 'Pilgrimage'],
    careerTendencies: ['Audio Engineers & Podcasters', 'Counselors & Therapists', 'Scholars of Classical Texts', 'Linguists'],
    psychologicalThemes: ['Capacity to listen deeply to unspoken truths', 'Respect for tradition and learning', 'Gentle wisdom']
  },
  23: {
    index: 23,
    sanskritName: 'Dhanishta',
    rulingPlanet: 'Mars',
    deity: 'Ashta Vasus (Eight Elemental Deities of Abundance)',
    symbol: 'Mridangam Drum / Flute',
    gana: 'Rakshasa',
    yoni: 'Female Lion',
    rashiSpan: 'Makara 23°20\' - Kumbha 6°40\'',
    startDegree: 293.3333,
    endDegree: 306.6667,
    qualities: ['Rhythm and harmony', 'Material abundance', 'Music and dance', 'Generous social status'],
    auspiciousActivities: ['Musical performances', 'Purchasing real estate/assets', 'Charity', 'Public entertainment'],
    careerTendencies: ['Musicians & Performers', 'Real Estate Moguls', 'Financial Asset Managers', 'Choreographers', 'Martial Artists'],
    psychologicalThemes: ['Resonance with cosmic rhythm', 'Generous enjoyment of wealth', 'Pride in rhythmic mastery']
  },
  24: {
    index: 24,
    sanskritName: 'Shatabhisha',
    rulingPlanet: 'Rahu',
    deity: 'Varuna (God of Cosmic Waters & Truth)',
    symbol: 'Empty Circle / 100 Physicians',
    gana: 'Rakshasa',
    yoni: 'Female Horse',
    rashiSpan: 'Kumbha 6°40\' - 20°00\'',
    startDegree: 306.6667,
    endDegree: 320.0,
    qualities: ['Veiling & Unveiling', '100 cures / Esoteric medicine', 'Cosmic solitude', 'Penetrating hidden truth'],
    auspiciousActivities: ['Medical treatments & Pharmacology', 'Astronomy & Space tech', 'Secluded meditation', 'Occult research'],
    careerTendencies: ['Astronomers & Astrophysicists', 'Advanced Pharmacologists', 'Cybersecurity Engineers', 'Mystics'],
    psychologicalThemes: ['Appreciation of solitude', 'Deep understanding of hidden patterns', 'Healing through esoteric means']
  },
  25: {
    index: 25,
    sanskritName: 'Purva Bhadrapada',
    rulingPlanet: 'Jupiter',
    deity: 'Aja Ekapada (The One-Footed Cosmic Serpent / Fire God)',
    symbol: 'Front of Funeral Cot / Two-Faced Man',
    gana: 'Manushya',
    yoni: 'Male Lion',
    rashiSpan: 'Kumbha 20°00\' - Meena 3°20\'',
    startDegree: 320.0,
    endDegree: 333.3333,
    qualities: ['Fierce spiritual penance (Tapas)', 'Ascetic fire', 'Dual perspective', 'Radical devotion'],
    auspiciousActivities: ['Intense meditation', 'Renouncing material attachments', 'Occult studies', 'Dharmic reform'],
    careerTendencies: ['Ascetics & Spiritual Teachers', 'Radical Reformers', 'Morticians', 'Occult Philosophers'],
    psychologicalThemes: ['Capacity for extreme spiritual sacrifice', 'Intensity of conviction', 'Vision that transcends convention']
  },
  26: {
    index: 26,
    sanskritName: 'Uttara Bhadrapada',
    rulingPlanet: 'Saturn',
    deity: 'Ahir Budhnya (Serpent of the Deep Cosmic Abyss)',
    symbol: 'Back of Funeral Cot / Serpent in the Deep',
    gana: 'Manushya',
    yoni: 'Female Cow',
    rashiSpan: 'Meena 3°20\' - 16°40\'',
    startDegree: 333.3333,
    endDegree: 346.6667,
    qualities: ['Deep serenity', 'Wisdom of the depths', 'Benevolent patience', 'Enduring spiritual shelter'],
    auspiciousActivities: ['Spiritual retreats', 'Meditation on transcendence', 'Charitable foundations', 'Vows of stability'],
    careerTendencies: ['Spiritual Guides & Monastics', 'Deep Oceanography / Exploration', 'Philanthropic Trustees', 'Philosophers'],
    psychologicalThemes: ['Profound calm and emotional patience', 'Depth of spiritual refuge', 'Quiet, unshakeable benevolence']
  },
  27: {
    index: 27,
    sanskritName: 'Revati',
    rulingPlanet: 'Mercury',
    deity: 'Pushan (The Nourishing Guide of Souls on the Path)',
    symbol: 'Fish Pair Swimming in a Circle / Drum',
    gana: 'Deva',
    yoni: 'Female Elephant',
    rashiSpan: 'Meena 16°40\' - 30°00\'',
    startDegree: 346.6667,
    endDegree: 360.0,
    qualities: ['Final completion', 'Safe passage and guidance', 'Compassionate abundance', 'Transcendent harmony'],
    auspiciousActivities: ['Beginning long journeys', 'Adopting animals', 'Concluding major life chapters', 'Music & Poetry'],
    careerTendencies: ['Animal Welfare / Veterinarians', 'Pilgrimage Guides', 'Poets & Dreamers', 'Counselors for Transition'],
    psychologicalThemes: ['Gentle compassion for all beings', 'Faith in divine protection on the journey', 'Transcendent artistic sensitivity']
  }
};

/**
 * Get Nakshatra information by index (1 to 27)
 */
export function getNakshatraByIndex(index: number): NakshatraInfo | null {
  return NAKSHATRAS[index] || null;
}

/**
 * Get Nakshatra by Sanskrit name (case-insensitive)
 */
export function getNakshatraByName(name: string): NakshatraInfo | null {
  const normalized = name.trim().toLowerCase();
  for (const nakshatra of Object.values(NAKSHATRAS)) {
    if (nakshatra.sanskritName.toLowerCase() === normalized) {
      return nakshatra;
    }
  }
  return null;
}

/**
 * Calculate Nakshatra index (1-27) and Pada (1-4) from a sidereal longitude (0 to 360 degrees)
 */
export function calculateNakshatraFromDegree(longitude: number): {
  nakshatra: NakshatraInfo;
  pada: number;
  exactLongitudeInNakshatra: number;
} | null {
  const normalizedDeg = ((longitude % 360) + 360) % 360;
  const nakshatraSpan = 360 / 27; // 13.3333333333 degrees
  const index = Math.floor(normalizedDeg / nakshatraSpan) + 1;
  const nakshatra = getNakshatraByIndex(index);
  if (!nakshatra) return null;

  const degInNakshatra = normalizedDeg - (index - 1) * nakshatraSpan;
  const padaSpan = nakshatraSpan / 4; // 3.3333333333 degrees
  const pada = Math.min(4, Math.floor(degInNakshatra / padaSpan) + 1);

  return {
    nakshatra,
    pada,
    exactLongitudeInNakshatra: degInNakshatra
  };
}
