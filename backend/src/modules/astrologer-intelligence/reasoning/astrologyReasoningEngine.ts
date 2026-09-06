import type { FilteredAstrologyContext } from '../astrology-context/contextBuilder';
import type {
  StructuredAstrologyReasoning,
  AstrologicalFactor,
  AstrologicalInterpretation
} from './reasoningTypes';
import { getTopicMapping, type TopicAstrologyMapping } from '../astrology-context/topicMappings';
import { timingEngine } from './timingEngine';

export const astrologyReasoningEngine = {
  reason(astrologyContext: FilteredAstrologyContext): StructuredAstrologyReasoning {
    const {
      topic,
      available,
      currentDasha,
      timeConfidence,
      ascendant,
      moonNakshatra,
      relevantHouses,
      relevantPlanets,
    } = astrologyContext;
    const mapping: TopicAstrologyMapping = getTopicMapping(topic);

    const primaryFactors: AstrologicalFactor[] = [];
    const supportingFactors: AstrologicalFactor[] = [];
    const challengingFactors: AstrologicalFactor[] = [];
    const timingFactors: AstrologicalFactor[] = [];
    const contradictions: AstrologicalFactor[] = [];
    const remedies: string[] = [...mapping.remedyFocus];
    const uncertaintyNotes: string[] = [];

    let confidence: 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
    if (!available) {
      confidence = 'LOW';
      uncertaintyNotes.push('Birth chart data is not fully verified; using general Vedic transit guidelines.');
    } else if (timeConfidence === 'approximate' || timeConfidence === 'unknown') {
      confidence = 'MODERATE';
      uncertaintyNotes.push('Birth time is approximate; ascendant degree and exact antardasha timing carry slight variation.');
    } else {
      confidence = 'HIGH';
    }

    // 1. Synthesize Lagna & Nakshatra
    if (ascendant) {
      const f: AstrologicalFactor = {
        factor: `Lagna (${ascendant})`,
        category: 'HOUSE_LORD',
        influence: 'SUPPORTIVE',
        weight: 4,
        description: `Ascendant in ${ascendant} shaping foundational temperament and vitality.`,
      };
      primaryFactors.push(f);
      supportingFactors.push(f);
    }

    if (moonNakshatra) {
      const f: AstrologicalFactor = {
        factor: `Janma Nakshatra (${moonNakshatra})`,
        category: 'NAKSHATRA',
        influence: 'SUPPORTIVE',
        weight: 3,
        description: `Moon in ${moonNakshatra} guiding emotional patterns and subconscious timing.`,
      };
      primaryFactors.push(f);
      supportingFactors.push(f);
    }

    // 2. Synthesize chart houses into structured factors
    if (relevantHouses.length > 0) {
      for (const house of relevantHouses) {
        let label = `House ${house.number}`;
        if (house.number === 7) label = '7th House (Kalatra Bhava / Partnership)';
        else if (house.number === 10) label = '10th House (Karma Bhava / Career)';
        else if (house.number === 2) label = '2nd House (Dhana Bhava / Wealth)';
        else if (house.number === 11) label = '11th House (Labha Bhava / Gains)';
        else if (house.number === 9) label = '9th House (Bhagya / Higher Learning)';
        else if (house.number === 12) label = '12th House (Vyaya / Foreign Lands)';
        else if (house.number === 5) label = '5th House (Purva Punya / Romance)';
        else if (house.number === 4) label = '4th House (Sukha / Education & Property)';
        else if (house.number === 1) label = '1st House (Tanu / Ascendant Vitality)';
        else if (house.number === 6) label = '6th House (Shatru-Roga / Service)';
        else if (house.number === 8) label = '8th House (Randhra / Transformation)';

        const isDusthana = [6, 8, 12].includes(house.number);
        const influence = isDusthana ? 'NEUTRAL' : 'SUPPORTIVE';

        const factorItem: AstrologicalFactor = {
          factor: label,
          category: 'HOUSE_LORD',
          influence,
          weight: 4,
          description: house.sign
            ? `Governed by ${house.sign} sign, shaping opportunities and personal development.`
            : 'Focal Vedic life sector activated by current planetary periods.',
        };
        primaryFactors.push(factorItem);
        if (influence === 'SUPPORTIVE') {
          supportingFactors.push(factorItem);
        }
      }
    } else {
      if (topic === 'MARRIAGE') {
        const f: AstrologicalFactor = {
          factor: '7th House (Kalatra Bhava)',
          category: 'HOUSE_LORD',
          influence: 'SUPPORTIVE',
          weight: 5,
          description: 'Governs long-term commitment, marriage yogas and spousal harmony.',
        };
        primaryFactors.push(f);
        supportingFactors.push(f);
      } else if (topic === 'CAREER') {
        const f: AstrologicalFactor = {
          factor: '10th House (Karma Bhava)',
          category: 'HOUSE_LORD',
          influence: 'SUPPORTIVE',
          weight: 5,
          description: 'Governs professional authority, career direction, and public reputation.',
        };
        primaryFactors.push(f);
        supportingFactors.push(f);
      } else if (topic === 'COMPOUND_MARRIAGE_CAREER') {
        const f: AstrologicalFactor = {
          factor: '7th & 10th Houses Cross-Alignment',
          category: 'HOUSE_LORD',
          influence: 'SUPPORTIVE',
          weight: 4,
          description: 'Post-marriage spousal support fostering professional stability and shared goals.',
        };
        primaryFactors.push(f);
        supportingFactors.push(f);
      } else if (topic === 'EDUCATION' || topic === 'FOREIGN_TRAVEL') {
        const f: AstrologicalFactor = {
          factor: '9th & 12th Houses (Higher Studies & Foreign Lands)',
          category: 'HOUSE_LORD',
          influence: 'SUPPORTIVE',
          weight: 4,
          description: 'Activates international applications, academic development, and travel.',
        };
        primaryFactors.push(f);
        supportingFactors.push(f);
      } else if (topic === 'FINANCE') {
        const f: AstrologicalFactor = {
          factor: '2nd & 11th Houses (Dhana & Labha)',
          category: 'HOUSE_LORD',
          influence: 'SUPPORTIVE',
          weight: 4,
          description: 'Governs steady accumulation of assets, earnings, and financial discipline.',
        };
        primaryFactors.push(f);
        supportingFactors.push(f);
      }
    }

    // 3. Synthesize key planet positions
    if (relevantPlanets.length > 0) {
      for (const p of relevantPlanets) {
        const isChallenged = p.isRetrograde;
        const influence = isChallenged ? 'NEUTRAL' : 'SUPPORTIVE';

        const factorItem: AstrologicalFactor = {
          factor: `${p.planet} in ${p.sign}${p.house ? ` (House ${p.house})` : ''}`,
          category: 'PLANET_DIGNITY',
          influence,
          weight: 3,
          description: p.isRetrograde
            ? `${p.planet} is retrograde (Vakri), encouraging inward reflection and deeper deliberation.`
            : `${p.planet} brings active planetary energy to ${p.sign}.`,
        };
        primaryFactors.push(factorItem);
        if (influence === 'SUPPORTIVE') {
          supportingFactors.push(factorItem);
        } else {
          challengingFactors.push({
            factor: `${p.planet} Retrograde Reflection`,
            category: 'PLANET_DIGNITY',
            influence: 'CHALLENGING',
            weight: 2,
            description: `${p.planet} in retrograde motion creates delay in outward manifestation, requiring patience and verification.`,
          });
        }
      }
    } else {
      if (topic === 'MARRIAGE' || topic === 'RELATIONSHIP') {
        const f: AstrologicalFactor = {
          factor: 'Guru (Jupiter) & Shukra (Venus) Alignment',
          category: 'PLANET_DIGNITY',
          influence: 'SUPPORTIVE',
          weight: 4,
          description: 'Benefic planetary aspects softening obstacles and fostering relationship maturity.',
        };
        primaryFactors.push(f);
        supportingFactors.push(f);
      } else if (topic === 'CAREER') {
        const f: AstrologicalFactor = {
          factor: 'Surya (Sun) & Shani Dev (Saturn) Balance',
          category: 'PLANET_DIGNITY',
          influence: 'NEUTRAL',
          weight: 3,
          description: 'Skill-building phase demanding disciplined effort before major leadership breakthrough.',
        };
        primaryFactors.push(f);
        challengingFactors.push({
          factor: 'Saturnian Discipline Demands',
          category: 'PLANET_DIGNITY',
          influence: 'CHALLENGING',
          weight: 2,
          description: 'Demands steady effort and procedural patience rather than quick shortcuts.',
        });
      }
    }

    // 4. Current Dasha synthesis
    if (currentDasha) {
      const dashaFactor: AstrologicalFactor = {
        factor: currentDasha.antardasha
          ? `Mahadasha of ${currentDasha.planet} / Antardasha of ${currentDasha.antardasha}`
          : `Mahadasha of ${currentDasha.planet}`,
        category: 'DASHA_PERIOD',
        influence: 'SUPPORTIVE',
        weight: 5,
        description: `Current planetary cycle activating karmic themes of ${currentDasha.planet}.`,
      };
      primaryFactors.push(dashaFactor);
      supportingFactors.push(dashaFactor);
      timingFactors.push(dashaFactor);
    }

    // 5. Calculate dynamic timing windows
    const timingWindows = timingEngine.calculateTimingWindows(astrologyContext);

    // 6. Detect multi-factor contradictions
    if (supportingFactors.length > 0 && challengingFactors.length > 0) {
      contradictions.push({
        factor: 'Simultaneous Favorable Window with Disciplined Timing',
        category: 'DRISHTI_ASPECT',
        influence: 'NEUTRAL',
        weight: 3,
        description: 'Underlying astrological potential is supportive, but sub-period timing requires groundwork and patience before full results manifest.',
      });
    }

    // 7. Calculate overall signal
    let overallSignal: AstrologicalInterpretation['overallSignal'] = 'positive';
    if (!available) {
      overallSignal = 'unclear';
    } else if (contradictions.length > 0 || (supportingFactors.length > 0 && challengingFactors.length > 0)) {
      overallSignal = 'mixed';
    } else if (challengingFactors.length > supportingFactors.length) {
      overallSignal = 'challenging';
    } else {
      overallSignal = 'positive';
    }

    // 8. Build structured AstrologicalInterpretation
    const interpretation: AstrologicalInterpretation = {
      topic,
      supportingFactors,
      challengingFactors,
      timingFactors,
      contradictions,
      overallSignal,
      confidence,
      timingWindow: timingWindows,
      methodologyVersion: 'Parashari_Classical_v2.0',
      ruleVersion: '2026.09',
      astrologyEngineVersion: 'VedicAstrologyEngine_v2',
    };

    const summary = `Astrological reasoning synthesized: ${topic} focus (${overallSignal} signal), ${supportingFactors.length} supporting factors, ${challengingFactors.length} challenging factors, ${timingWindows.length} timing windows identified.`;

    return {
      topic,
      confidence,
      primaryFactors,
      timingWindows,
      remedies,
      uncertaintyNotes,
      userFacingExplanationSummary: summary,
      interpretation,
    };
  },
};
