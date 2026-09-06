import { describe, it, expect } from 'vitest';
import {
  getPlanetSignification,
  getAllPlanetSignifications,
  getHouseSignification,
  getAllHouseSignifications,
  getZodiacSignByNumber,
  getZodiacSignByName,
  getNakshatraByIndex,
  calculateNakshatraFromDegree,
  getVedicYogaById,
  getYogasByDomain,
  analyzeDashaLordRelationship,
  isDashaChidra,
  calculateSadeSati,
  calculateKantakaShani,
  analyzeJupiterGochar,
  calculateAspectedHouses,
  isPlanetCombust,
  interpretRetrogradeStatus,
  getRemedyForPlanet,
  matchDomainFromQuery,
  AstrologyKnowledgeEngine
} from '../../../src/modules/astrology-knowledge';

describe('Astrology Knowledge Base Unit Tests', () => {
  describe('Planet Significations', () => {
    it('retrieves accurate significations for Sun (Surya)', () => {
      const sun = getPlanetSignification('Sun');
      expect(sun).toBeDefined();
      expect(sun?.sanskritName).toBe('Surya');
      expect(sun?.naturalNature).toBe('MALEFIC');
      expect(sun?.exaltationSign).toBe('Aries');
      expect(sun?.karakatwas).toContain('Soul (Atma)');
      expect(sun?.karakatwas).toContain('Father (Pitri)');
    });

    it('retrieves all 9 Vedic grahas', () => {
      const planets = getAllPlanetSignifications();
      expect(planets).toHaveLength(9);
      const names = planets.map((p) => p.name);
      expect(names).toEqual(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']);
    });
  });

  describe('House Significations (Bhavas)', () => {
    it('retrieves accurate significations for 7th House (Kalatra Bhava)', () => {
      const h7 = getHouseSignification(7);
      expect(h7).toBeDefined();
      expect(h7?.sanskritName).toContain('Kalatra');
      expect(h7?.category).toContain('KENDRA');
      expect(h7?.naturalKaraka).toBe('Venus');
      expect(h7?.primarySignifications).toContain('Marriage & Spouse');
    });

    it('retrieves accurate significations for 10th House (Karma Bhava)', () => {
      const h10 = getHouseSignification(10);
      expect(h10).toBeDefined();
      expect(h10?.sanskritName).toContain('Karma');
      expect(h10?.category).toContain('KENDRA');
      expect(h10?.naturalKaraka).toBe('Sun');
    });

    it('retrieves all 12 houses', () => {
      const houses = getAllHouseSignifications();
      expect(houses).toHaveLength(12);
    });
  });

  describe('Zodiac Signs (Rashis)', () => {
    it('retrieves sign by number and name', () => {
      const aries = getZodiacSignByNumber(1);
      expect(aries?.englishName).toBe('Aries');
      expect(aries?.sanskritName).toBe('Mesha');
      expect(aries?.element).toBe('Agni');
      expect(aries?.rulingPlanet).toBe('Mars');

      const cancer = getZodiacSignByName('Karka');
      expect(cancer?.englishName).toBe('Cancer');
      expect(cancer?.elementEnglish).toBe('Water');
      expect(cancer?.rulingPlanet).toBe('Moon');
    });
  });

  describe('Nakshatras & Longitude Calculations', () => {
    it('retrieves Ashwini as the 1st nakshatra', () => {
      const ashwini = getNakshatraByIndex(1);
      expect(ashwini?.sanskritName).toBe('Ashwini');
      expect(ashwini?.rulingPlanet).toBe('Ketu');
      expect(ashwini?.gana).toBe('Deva');
    });

    it('calculates exact Nakshatra and Pada from degree', () => {
      // 5 degrees into Aries -> Ashwini Pada 2 (0 - 3.33 is Pada 1, 3.33 - 6.66 is Pada 2)
      const res1 = calculateNakshatraFromDegree(5.0);
      expect(res1).toBeDefined();
      expect(res1?.nakshatra.sanskritName).toBe('Ashwini');
      expect(res1?.pada).toBe(2);

      // 45 degrees -> 15 degrees into Taurus -> Rohini (40° to 53.33°)
      const res2 = calculateNakshatraFromDegree(45.0);
      expect(res2).toBeDefined();
      expect(res2?.nakshatra.sanskritName).toBe('Rohini');
      expect(res2?.nakshatra.rulingPlanet).toBe('Moon');
    });
  });

  describe('Vedic Yogas', () => {
    it('retrieves Gajakesari Yoga and Pancha Mahapurusha Yogas', () => {
      const gajakesari = getVedicYogaById('gajakesari');
      expect(gajakesari).toBeDefined();
      expect(gajakesari?.category).toBe('Auspicious');
      expect(gajakesari?.lifeDomainsAffected).toContain('Status');

      const sasa = getVedicYogaById('sasa');
      expect(sasa?.category).toBe('Mahapurusha');
      expect(sasa?.lifeDomainsAffected).toContain('Career');

      const careerYogas = getYogasByDomain('Career');
      expect(careerYogas.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Vimshottari Dasha Principles', () => {
    it('analyzes harmonious Navapanchama (5-9) dasha relationship', () => {
      // Maha lord in house 1, Antar lord in house 5 -> relative distance 5
      const analysis = analyzeDashaLordRelationship(1, 5);
      expect(analysis.relationshipType).toBe('TRINE_SUPPORTIVE');
      expect(analysis.sanskritDescription).toContain('Navapanchama');
    });

    it('identifies challenging Shadashtaka (6-8) dasha relationship', () => {
      // Maha lord in house 1, Antar lord in house 6 -> 6th from 1st
      const analysis = analyzeDashaLordRelationship(1, 6);
      expect(analysis.relationshipType).toBe('SHADASHTAKA');
    });

    it('identifies Dasha Chidra (final sub-period of a cycle)', () => {
      const chidra1 = isDashaChidra('Venus', 'Ketu');
      expect(chidra1.isChidra).toBe(true);

      const chidra2 = isDashaChidra('Jupiter', 'Saturn');
      expect(chidra2.isChidra).toBe(false);
    });
  });

  describe('Gochar (Transit) Principles', () => {
    it('calculates Sade Sati phases accurately', () => {
      // Moon in Virgo (6), Saturn in Leo (5) -> 12th from Moon -> Rising phase 1
      const p1 = calculateSadeSati(6, 5);
      expect(p1.isUnderSadeSati).toBe(true);
      expect(p1.phase).toBe('Rising_Phase_1');

      // Moon in Pisces (12), Saturn in Pisces (12) -> Peak phase 2
      const p2 = calculateSadeSati(12, 12);
      expect(p2.isUnderSadeSati).toBe(true);
      expect(p2.phase).toBe('Peak_Phase_2');

      // Moon in Aries (1), Saturn in Cancer (4) -> No Sade Sati
      const pNone = calculateSadeSati(1, 4);
      expect(pNone.isUnderSadeSati).toBe(false);
    });

    it('analyzes Kantaka and Ashtama Shani', () => {
      // Moon in Taurus (2), Saturn in Sagittarius (9) -> 8th from Moon -> Ashtama Shani
      const res = calculateKantakaShani(2, 9);
      expect(res.isAshtamaShani).toBe(true);
      expect(res.isArdhaAshtamaShani).toBe(false);
    });

    it('analyzes Jupiter Gochar favorability from Janma Rashi', () => {
      // Moon in 1, Jupiter in 5 -> 5th house -> highly favorable
      const jup = analyzeJupiterGochar(1, 5);
      expect(jup.isFavorableFromMoon).toBe(true);
      expect(jup.relativeHouseFromMoon).toBe(5);
    });
  });

  describe('Vedic Aspects (Drishti)', () => {
    it('calculates Mars special 4th, 7th, 8th aspects', () => {
      // Mars in House 1 -> aspects 4, 7, 8
      const aspects = calculateAspectedHouses('Mars', 1);
      expect(aspects).toEqual([4, 7, 8]);
    });

    it('calculates Jupiter special 5th, 7th, 9th aspects', () => {
      // Jupiter in House 1 -> aspects 5, 7, 9
      const aspects = calculateAspectedHouses('Jupiter', 1);
      expect(aspects).toEqual([5, 7, 9]);
    });

    it('calculates Saturn special 3rd, 7th, 10th aspects', () => {
      // Saturn in House 4 -> aspects 6, 10, 1
      const aspects = calculateAspectedHouses('Saturn', 4);
      expect(aspects).toEqual([6, 10, 1]);
    });
  });

  describe('Dignities, Combustion & Retrograde', () => {
    it('detects combustion when planet is within threshold of Sun', () => {
      // Mercury at 50 deg, Sun at 52 deg (2 deg diff) -> Combust
      const combustRes = isPlanetCombust('Mercury', 50, 52);
      expect(combustRes.isCombust).toBe(true);
      expect(combustRes.degreeDiff).toBe(2);

      // Jupiter at 100 deg, Sun at 120 deg (20 deg diff) -> Not combust
      const safeRes = isPlanetCombust('Jupiter', 100, 120);
      expect(safeRes.isCombust).toBe(false);
    });

    it('provides nuanced retrograde interpretations', () => {
      const mercuryVakri = interpretRetrogradeStatus('Mercury');
      expect(mercuryVakri).toContain('Mercury Retrograde');
      expect(mercuryVakri).toContain('reflective');
    });
  });

  describe('Vedic Remedies (Upayas)', () => {
    it('provides Sattvic non-fear remedies for Saturn', () => {
      const shaniRemedy = getRemedyForPlanet('Saturn');
      expect(shaniRemedy).toBeDefined();
      expect(shaniRemedy?.deity).toContain('Shani');
      expect(shaniRemedy?.seva).toContain('Regularly feed stray dogs, crows, or shelter animals');
      expect(shaniRemedy?.mantra.beejMantra).toBeDefined();
    });
  });

  describe('Domain Factor Mapping & Knowledge Engine', () => {
    it('matches user query to correct domain rule', () => {
      const marriageRule = matchDomainFromQuery('Meri shaadi kab hogi?');
      expect(marriageRule.domainKey).toBe('marriage_timing');
      expect(marriageRule.primaryHouses).toContain(7);
      expect(marriageRule.primaryKarakas).toContain('Venus');

      const careerRule = matchDomainFromQuery('Job change karna chahiye kya?');
      expect(careerRule.domainKey).toBe('career_job_change');
      expect(careerRule.primaryHouses).toContain(10);
      expect(careerRule.primaryKarakas).toContain('Sun');
      expect(careerRule.primaryKarakas).toContain('Saturn');
    });

    it('assembles a complete knowledge bundle via AstrologyKnowledgeEngine', () => {
      const bundle = AstrologyKnowledgeEngine.getKnowledgeForQuery('Meri marriage timing kya hai?', {
        moonSign: 4, // Cancer
        currentMahaLord: 'Jupiter',
        currentAntarLord: 'Venus',
        mahaLordHouse: 1,
        antarLordHouse: 5,
        transitSaturnSign: 11, // Aquarius -> 8th from Cancer (Ashtama)
        transitJupiterSign: 2, // Taurus -> 11th from Cancer (Favorable)
      });

      expect(bundle.domainRule.domainKey).toBe('marriage_timing');
      expect(bundle.relevantHouses.length).toBeGreaterThanOrEqual(1);
      expect(bundle.relevantPlanets.length).toBeGreaterThanOrEqual(1);
      expect(bundle.dashaDynamics?.relationshipType).toBe('TRINE_SUPPORTIVE');
      expect(bundle.transitDynamics?.kantakaShani).toContain('Ashtama Shani');
      expect(bundle.transitDynamics?.jupiterGochar).toContain('11th from Moon');
      expect(bundle.methodologyVersion).toBe('Parashari_Classical_v2.0');
    });
  });
});
