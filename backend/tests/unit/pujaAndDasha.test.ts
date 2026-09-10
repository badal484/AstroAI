import { describe, it, expect } from 'vitest';
import { pujaService } from '../../src/modules/puja/puja.service';
import { dashaService } from '../../src/modules/astrology/dasha.service';
import { SACRED_PUJA_CATALOG } from '../../src/modules/puja/pujaCatalog';
import { PujaCategory } from '@astroai/shared-types';

describe('Vedic Puja Service & Catalog', () => {
  it('should return all sacred pujas in the catalog', () => {
    const catalog = pujaService.getCatalog();
    expect(catalog.length).toBe(SACRED_PUJA_CATALOG.length);
    expect(catalog.length).toBeGreaterThanOrEqual(6);
  });

  it('should filter catalog by category correctly', () => {
    const healthPujas = pujaService.getCatalog(PujaCategory.HEALTH_MAHAMRITYUNJAYA);
    expect(healthPujas.length).toBe(1);
    expect(healthPujas[0]?.id).toBe('puja-mahamrityunjaya');
    expect(healthPujas[0]?.deity).toContain('Lord Shiva');
  });

  it('should find specific puja by id with full tier options', () => {
    const puja = pujaService.getPujaById('puja-navagraha-shanti');
    expect(puja).toBeDefined();
    expect(puja?.templeName).toContain('Kashi Vishwanath');
    expect(puja?.tiers.length).toBeGreaterThanOrEqual(2);
    expect(puja?.isLiveStreamAvailable).toBe(true);
    expect(puja?.isPrasadDeliveryAvailable).toBe(true);
  });
});

describe('Vimshottari Dasha Engine', () => {
  it('should calculate complete 120-year Mahadasha timeline with current Antardasha & Pratyantardasha', async () => {
    const timeline = await dashaService.getDashaTimeline('mock-user-123');

    expect(timeline).toBeDefined();
    expect(timeline.totalCycleYears).toBe(120);
    expect(timeline.allMahadashas.length).toBe(9);

    expect(timeline.currentMahadasha).toBeDefined();
    expect(timeline.currentMahadasha.planet).toBeDefined();
    expect(timeline.currentMahadasha.auspiciousScore).toBeGreaterThan(0);

    expect(timeline.currentAntardasha).toBeDefined();
    expect(timeline.currentAntardasha.planet).toBeDefined();

    expect(timeline.currentPratyantardasha).toBeDefined();
    expect(timeline.currentPratyantardasha.nature).toBeDefined();

    expect(timeline.planetaryBlessings).toContain('Mahadasha');
  });
});
