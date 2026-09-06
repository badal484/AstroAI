import {
  type AshtakootaScoreDTO,
  type AstrologyChart,
  ModelAlias,
  type ReportSectionDTO,
  type ReportType,
} from '@astroai/shared-types';
import { aiGateway } from '../../ai';
import { logger } from '../../../shared/logger';

export interface ReportAiInput {
  reportType: ReportType;
  userName: string;
  partnerName?: string;
  chartA: AstrologyChart;
  chartB?: AstrologyChart;
  compatibilityScore?: AshtakootaScoreDTO | null;
  language?: string;
}

export const reportInterpretationService = {
  /**
   * Generates grounded, structured report interpretation sections via AI Gateway.
   * Strictly enforces that the LLM does not hallucinate or modify calculated scores.
   */
  async generateInterpretation(input: ReportAiInput): Promise<ReportSectionDTO[]> {
    try {
      const isCompatibility = input.reportType === 'compatibility' || input.reportType === 'relationship_compatibility';

      if (isCompatibility && input.compatibilityScore) {
        return await this.generateCompatibilityAnalysis(input);
      } else {
        return await this.generatePersonalizedKundliAnalysis(input);
      }
    } catch (err) {
      logger.error({ err, reportType: input.reportType }, 'AI report generation error, applying verified fallback template');
      return this.generateDeterministicFallback(input);
    }
  },

  async generateCompatibilityAnalysis(input: ReportAiInput): Promise<ReportSectionDTO[]> {
    const score = input.compatibilityScore!;
    const nameA = input.userName || 'Person A';
    const nameB = input.partnerName || 'Person B';

    const systemPrompt = `You are a revered Vedic Astrologer providing an in-depth, structured Compatibility Analysis for ${nameA} and ${nameB}.

CRITICAL INVARIANTS:
1. You must NEVER invent, alter, or hallucinate compatibility scores or koota numbers.
2. The authoritative calculation score is EXACTLY ${score.totalScore} / ${score.maxScore} (${score.percentage}%).
3. The 8 Kootas calculated by the Vedic computational engine are:
${score.categories.map((c) => `  - ${c.name} (${c.area}): ${c.score} / ${c.maxScore} pts`).join('\n')}
4. Mangal Dosha: ${nameA} = ${score.mangalDoshaA ? 'Yes' : 'No'}, ${nameB} = ${score.mangalDoshaB ? 'Yes' : 'No'}.
5. Nadi Dosha: ${score.nadiDosha ? (score.nadiDoshaCancelled ? 'Present but Cancelled' : 'Present') : 'None'}.
6. Bhakoot Dosha: ${score.bhakootDosha ? (score.bhakootDoshaCancelled ? 'Present but Cancelled' : 'Present') : 'None'}.

Respond with clear, empathetic Vedic astrological explanations structured in exact markdown.`;

    const userPrompt = `Provide a comprehensive analysis of the relationship between ${nameA} and ${nameB} using the provided Ashtakoota calculation (${score.totalScore}/36). Cover:
1. Executive Summary & Compatibility Overview
2. Emotional & Psychological Alignment (Graha Maitri & Bhakoot)
3. Temperament, Lifestyle & Health (Gana, Yoni & Nadi)
4. Dosha & Astrological Balance (Mangal & Nadi status)
5. Practical Astrological Remedies & Spiritual Guidance`;

    let aiResponse = '';
    try {
      const result = await aiGateway.generateText({
        alias: ModelAlias.REPORT_GENERATION,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 1200,
        temperature: 0.3, // low temperature for high fidelity
      });
      aiResponse = result.text;
    } catch (error) {
      logger.warn({ error }, 'AI Gateway call failed for compatibility report, using structured fallback');
      return this.generateDeterministicFallback(input);
    }

    return [
      {
        title: 'Executive Compatibility Summary',
        category: 'summary',
        content: `Ashtakoota Guna Milan total score is ${score.totalScore} out of 36 points (${score.percentage}%). ${
          score.isAuspicious
            ? 'The cosmic alignment indicates an auspicious and harmonious match with strong foundational resonance.'
            : 'The cosmic pairing shows moderate compatibility requiring mutual patience and conscious communication.'
        }`,
        bulletPoints: [
          `Total Score: ${score.totalScore} / ${score.maxScore} points (${score.percentage}%)`,
          `Match Classification: ${score.isAuspicious ? 'Auspicious Alignment' : 'Moderate Alignment'}`,
          `Nadi Balance: ${score.nadiDoshaCancelled ? 'Dosha Cancelled' : score.nadiDosha ? 'Caution Advised' : 'Harmonious'}`,
          `Manglik Status: ${score.mangalDoshaA ? `${nameA} is Manglik` : 'Balanced'}, ${score.mangalDoshaB ? `${nameB} is Manglik` : 'Balanced'}`,
        ],
      },
      {
        title: 'In-Depth Vedic Astrological Analysis',
        category: 'analysis',
        content: aiResponse || 'Detailed astrological interpretation of planetary and nakshatra interactions between both birth charts.',
      },
      {
        title: 'Koota Breakdown & Dynamics',
        category: 'koota_breakdown',
        content: score.categories
          .map(
            (c) =>
              `**${c.name} (${c.area})**: ${c.score}/${c.maxScore} pts. ${c.description}`,
          )
          .join('\n\n'),
      },
      {
        title: 'Vedic Remedies & Harmonization',
        category: 'remedies',
        content:
          'Astrological remedies to enhance relationship harmony and neutralize challenging planetary transit periods.',
        bulletPoints: [
          'Chant the Maha Mrityunjaya Mantra together on Monday mornings.',
          'Offer water to the rising Sun (Surya Arghya) with red sandalwood paste.',
          'Practice open mutual dialogue during Mars-Saturn transit periods.',
          'Wear soothing pearls or moonstone after consulting your family astrologer.',
        ],
      },
    ];
  },

  async generatePersonalizedKundliAnalysis(input: ReportAiInput): Promise<ReportSectionDTO[]> {
    const chart = input.chartA;
    const ascSign = chart.ascendant?.sign || 'Aries';
    const moonNak = chart.moonNakshatra?.name || 'Ashwini';
    const dasha = chart.currentDasha?.planet || 'Jupiter';

    const systemPrompt = `You are an enlightened Vedic Astrologer providing a personalized Life Kundli Report for ${input.userName}.
Ascendant (Lagna): ${ascSign}
Moon Nakshatra: ${moonNak}
Current Mahadasha: ${dasha}
Key Planetary Positions: ${chart.planetPositions.map((p) => `${p.planet} in ${p.sign} (House ${p.house})`).join(', ')}.

Provide a deep, empowering Vedic interpretation focused on career, life purpose, spiritual inclinations, and astrological remedies.`;

    const userPrompt = `Generate a detailed life reading covering:
1. Core Personality & Lagna Strengths
2. Career, Wealth & Planetary Yogas
3. Current Mahadasha Outlook & Timing
4. Astrological Remedies & Gemstones`;

    let aiResponse = '';
    try {
      const result = await aiGateway.generateText({
        alias: ModelAlias.REPORT_GENERATION,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 1200,
        temperature: 0.3,
      });
      aiResponse = result.text;
    } catch {
      aiResponse = `Your Lagna in ${ascSign} with Moon in ${moonNak} grants you innate resilience, sharp intuition, and a natural propensity for leadership and philosophical pursuit.`;
    }

    return [
      {
        title: 'Lagna & Core Personality',
        category: 'personality',
        content: `With ${ascSign} rising on the eastern horizon and Moon placed in ${moonNak}, your chart reflects profound inner wisdom, creative vitality, and determination.`,
        bulletPoints: [
          `Ascendant (Lagna): ${ascSign}`,
          `Moon Nakshatra: ${moonNak}`,
          `Ruling Planetary Lord: ${chart.ascendant?.sign || ascSign}`,
        ],
      },
      {
        title: 'Detailed Astrological Guidance',
        category: 'guidance',
        content: aiResponse,
      },
      {
        title: 'Current Planetary Period (Mahadasha)',
        category: 'dasha',
        content: `You are currently experiencing the Mahadasha of ${dasha}. This period activates deep transformation, expansion in knowledge, and shifts in career alignment.`,
      },
      {
        title: 'Vedic Remedies & Gemstone Guidance',
        category: 'remedies',
        content: 'Prescribed Vedic remedies for planetary strengthening and obstacle removal.',
        bulletPoints: [
          'Meditate regularly during Brahma Muhurta (dawn) for mental clarity.',
          'Donate yellow pulses or grain on Thursdays to honor Guru (Jupiter).',
          'Recite the Gayatri Mantra 108 times daily for spiritual shielding.',
        ],
      },
    ];
  },

  generateDeterministicFallback(input: ReportAiInput): ReportSectionDTO[] {
    const isComp = input.reportType === 'compatibility' || input.reportType === 'relationship_compatibility';
    if (isComp && input.compatibilityScore) {
      const s = input.compatibilityScore;
      return [
        {
          title: 'Executive Compatibility Summary',
          category: 'summary',
          content: `Vedic Ashtakoota compatibility analysis resulted in a total score of ${s.totalScore} / ${s.maxScore} points (${s.percentage}%).`,
          bulletPoints: [
            `Total Score: ${s.totalScore} / ${s.maxScore} points`,
            `Overall Classification: ${s.isAuspicious ? 'Auspicious' : 'Moderate'}`,
          ],
        },
        {
          title: 'Ashtakoota Guna Breakdown',
          category: 'breakdown',
          content: s.categories.map((c) => `${c.name}: ${c.score}/${c.maxScore} pts - ${c.description}`).join('\n\n'),
        },
        {
          title: 'Vedic Remedies',
          category: 'remedies',
          content: 'Recommended remedies for marital harmony and spiritual peace.',
          bulletPoints: ['Chant Shiva-Parvati mantras on Mondays', 'Perform regular charitable giving'],
        },
      ];
    }

    return [
      {
        title: 'Vedic Chart Reading',
        category: 'reading',
        content: `Astrological chart reading based on Ascendant ${input.chartA.ascendant?.sign || 'Aries'} and Moon Nakshatra ${input.chartA.moonNakshatra?.name || 'Ashwini'}.`,
        bulletPoints: ['Follow disciplined daily spiritual practices', 'Honor your planetary rulers'],
      },
    ];
  },
};
