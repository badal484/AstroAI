/**
 * Vedic Astrology Knowledge Engine (Layer 2 Core Knowledge Synthesis)
 * Unified interface querying authoritative Parashari knowledge bases for Grahas, Bhavas, Rashis, Nakshatras, Yogas, Dashas, Transits, Aspects, and Remedies.
 */

import { getPlanetSignification, type PlanetSignification } from './planets/planetSignifications';
import { getHouseSignification, type HouseSignification } from './houses/houseSignifications';
import { getYogasByDomain, type VedicYogaDefinition } from './yogas/vedicYogas';
import { analyzeDashaLordRelationship, isDashaChidra } from './dashas/dashaPrinciples';
import { calculateSadeSati, calculateKantakaShani, analyzeJupiterGochar } from './transits/gocharPrinciples';
import { getRemedyForPlanet, type VedicRemedy } from './remedies/vedicRemedies';
import { matchDomainFromQuery, type LifeDomainFactorRule } from './domains/domainFactorRules';

export interface VedicFactorKnowledgeBundle {
  domainRule: LifeDomainFactorRule;
  relevantHouses: HouseSignification[];
  relevantPlanets: PlanetSignification[];
  activeYogas: VedicYogaDefinition[];
  dashaDynamics?: {
    relationshipType: string;
    description: string;
    isChidra: boolean;
    chidraNote?: string;
  };
  transitDynamics?: {
    sadeSati?: string;
    kantakaShani?: string;
    jupiterGochar?: string;
  };
  remediesRecommended: VedicRemedy[];
  methodologyVersion: string;
}

export class AstrologyKnowledgeEngine {
  private static readonly METHODOLOGY_VERSION = 'Parashari_Classical_v2.0';

  /**
   * Get complete knowledge bundle for a specific query and chart context
   */
  public static getKnowledgeForQuery(
    query: string,
    chartContext?: {
      moonSign?: number; // 1 to 12
      currentMahaLord?: string;
      currentAntarLord?: string;
      mahaLordHouse?: number;
      antarLordHouse?: number;
      transitSaturnSign?: number;
      transitJupiterSign?: number;
    }
  ): VedicFactorKnowledgeBundle {
    const domainRule = matchDomainFromQuery(query);

    // Retrieve relevant houses
    const targetHouseNumbers = [...new Set([...domainRule.primaryHouses, ...domainRule.secondaryHouses])];
    const relevantHouses = targetHouseNumbers
      .map(h => getHouseSignification(h))
      .filter((h): h is HouseSignification => h !== null);

    // Retrieve relevant planets
    const targetPlanets = [...new Set([...domainRule.primaryKarakas, ...domainRule.secondaryKarakas])];
    const relevantPlanets = targetPlanets
      .map(p => getPlanetSignification(p))
      .filter((p): p is PlanetSignification => p !== null);

    // Retrieve active yogas for this domain
    const domainNameMapped = this.mapDomainToYogaDomain(domainRule.domainKey);
    const activeYogas = domainNameMapped ? getYogasByDomain(domainNameMapped) : [];

    // Analyze Dasha dynamics if parameters provided
    let dashaDynamics: VedicFactorKnowledgeBundle['dashaDynamics'] = undefined;
    if (chartContext?.currentMahaLord && chartContext?.currentAntarLord) {
      const chidra = isDashaChidra(chartContext.currentMahaLord, chartContext.currentAntarLord);
      let relType = 'Balanced';
      let desc = 'Regular period progression';

      if (chartContext.mahaLordHouse && chartContext.antarLordHouse) {
        const rel = analyzeDashaLordRelationship(chartContext.mahaLordHouse, chartContext.antarLordHouse);
        relType = rel.relationshipType;
        desc = `${rel.sanskritDescription}: ${rel.interpretiveGuidance}`;
      }

      dashaDynamics = {
        relationshipType: relType,
        description: desc,
        isChidra: chidra.isChidra,
        chidraNote: chidra.transitionalTheme
      };
    }

    // Analyze Transit dynamics if parameters provided
    let transitDynamics: VedicFactorKnowledgeBundle['transitDynamics'] = undefined;
    if (chartContext?.moonSign) {
      let sadeSatiText: string | undefined = undefined;
      let kantakaText: string | undefined = undefined;
      let jupiterText: string | undefined = undefined;

      if (chartContext.transitSaturnSign) {
        const sadeSati = calculateSadeSati(chartContext.moonSign, chartContext.transitSaturnSign);
        if (sadeSati.isUnderSadeSati) {
          sadeSatiText = `Sade Sati (${sadeSati.phase}): ${sadeSati.description}`;
        }

        const kantaka = calculateKantakaShani(chartContext.moonSign, chartContext.transitSaturnSign);
        if (kantaka.isAshtamaShani || kantaka.isArdhaAshtamaShani) {
          kantakaText = kantaka.description;
        }
      }

      if (chartContext.transitJupiterSign) {
        const jup = analyzeJupiterGochar(chartContext.moonSign, chartContext.transitJupiterSign);
        jupiterText = `Jupiter Transit (${jup.relativeHouseFromMoon}th from Moon): ${jup.dignityTheme}`;
      }

      if (sadeSatiText || kantakaText || jupiterText) {
        transitDynamics = {
          sadeSati: sadeSatiText,
          kantakaShani: kantakaText,
          jupiterGochar: jupiterText
        };
      }
    }

    // Retrieve Sattvic Remedies for primary karakas
    const remediesRecommended = domainRule.primaryKarakas
      .map(k => getRemedyForPlanet(k))
      .filter((r): r is VedicRemedy => r !== null)
      .slice(0, 2);

    return {
      domainRule,
      relevantHouses,
      relevantPlanets,
      activeYogas,
      dashaDynamics,
      transitDynamics,
      remediesRecommended,
      methodologyVersion: this.METHODOLOGY_VERSION
    };
  }

  private static mapDomainToYogaDomain(domainKey: string): 'Career' | 'Wealth' | 'Marriage' | 'Intellect' | 'Spirituality' | 'Status' | 'Health' | null {
    if (domainKey.includes('career') || domainKey.includes('business')) return 'Career';
    if (domainKey.includes('finance') || domainKey.includes('property')) return 'Wealth';
    if (domainKey.includes('marriage') || domainKey.includes('love')) return 'Marriage';
    if (domainKey.includes('education')) return 'Intellect';
    if (domainKey.includes('growth') || domainKey.includes('spirituality')) return 'Spirituality';
    if (domainKey.includes('health')) return 'Health';
    return null;
  }
}
