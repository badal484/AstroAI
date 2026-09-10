import { describe, expect, it } from 'vitest';
import { palmistryService } from '../../../src/modules/astrology/palmistry.service';
import { prashnaService } from '../../../src/modules/astrology/prashna.service';
import { dailyDispatchService } from '../../../src/modules/horoscope/dailyDispatch.service';

describe('Palmistry, Prashna, and Daily Dispatch Services', () => {
  describe('palmistryService.analyzePalm', () => {
    it('analyzes a palm without birth profile and returns full Samudrika report', async () => {
      const result = await palmistryService.analyzePalm('user-1', { hand: 'right' });

      expect(result.dominantHand).toBe('right');
      expect(result.elementalHandType).toBe('Earth (Prithvi)');
      expect(result.lines.lifeLine.name).toBe('Life Line');
      expect(result.lines.lifeLine.sanskritName).toContain('Jeevan Rekha');
      expect(result.lines.heartLine.name).toBe('Heart Line');
      expect(result.lines.headLine.name).toBe('Head Line');
      expect(result.lines.fateLine.name).toBe('Fate Line');
      expect(result.mounts.length).toBe(4);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.recommendedRemedies.length).toBeGreaterThan(0);
    });

    it('analyzes a left hand palm correctly', async () => {
      const result = await palmistryService.analyzePalm('user-2', { hand: 'left' });

      expect(result.dominantHand).toBe('left');
      expect(result.samudrikaSynthesis).toContain('Left');
    });
  });

  describe('prashnaService.castPrashna', () => {
    it('casts a real-time Horary Prashna Kundli for a career question', () => {
      const result = prashnaService.castPrashna({
        question: 'Will I be promoted to Senior Engineer this quarter?',
        category: 'career',
      });

      expect(result.question).toBe('Will I be promoted to Senior Engineer this quarter?');
      expect(result.prashnaLagna).toBeDefined();
      expect(result.karyeshPlanet).toBeDefined();
      expect(result.lagneshPlanet).toBeDefined();
      expect(result.moonSign).toBeDefined();
      expect(result.moonNakshatra).toBeDefined();
      expect(['favorable', 'delayed', 'challenging_requires_upay']).toContain(result.verdict);
      expect(result.yogas.length).toBeGreaterThan(0);
      expect(result.remedy).toContain('ॐ');
    });

    it('casts a Prashna chart for a relationship question', () => {
      const result = prashnaService.castPrashna({
        question: 'When will our relationship resolve amicably?',
        category: 'relationship',
      });

      expect(result.timingEstimate).toBeDefined();
      expect(result.explanation).toContain('Prashna');
    });
  });

  describe('dailyDispatchService.getDailyDispatch', () => {
    it('returns a personalized Brahma Muhurat morning brief', () => {
      const dispatch = dailyDispatchService.getDailyDispatch('user-1');

      expect(dispatch.cosmicScore).toBe(88);
      expect(dispatch.tithi).toBeDefined();
      expect(dispatch.nakshatra).toContain('Rohini');
      expect(dispatch.activeHora).toContain('Hora');
      expect(dispatch.favorableActivities.length).toBeGreaterThan(0);
      expect(dispatch.abhijitMuhurat).toContain('AM');
      expect(dispatch.rahuKaal).toContain('PM');
      expect(dispatch.dailySadhanaMantra.sanskrit).toContain('ॐ');
      expect(dispatch.audioBrief.durationSeconds).toBe(90);
    });
  });
});
