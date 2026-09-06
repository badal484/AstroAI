import { describe, expect, it } from 'vitest';
import { generateReportPdf } from '../../../src/modules/reports/pdf/pdfGenerator';

describe('Astrology Report PDF Generator', () => {
  it('generates a valid, compliant PDF-1.4 binary buffer', () => {
    const pdfBuffer = generateReportPdf({
      reportId: 'rep_test_123',
      reportType: 'full_kundli',
      title: 'Vedic Life Kundli: Arjun Sharma',
      userName: 'Arjun Sharma',
      generatedDate: 'September 3, 2026',
      astrologySummary: {
        ascendant: { sign: 'Aries', nakshatra: 'Ashwini' },
        moonNakshatra: { name: 'Rohini', lord: 'Moon' },
        currentDasha: { planet: 'Jupiter' },
      },
      sections: [
        {
          title: 'Executive Summary',
          category: 'summary',
          content: 'You possess dynamic leadership potential and keen intuition.',
          bulletPoints: ['Ascendant in Aries', 'Moon in Taurus (Rohini)'],
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(100);

    const pdfString = pdfBuffer.toString('utf-8');
    expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfString.includes('%%EOF')).toBe(true);
    expect(pdfString.includes('xref')).toBe(true);
    expect(pdfString.includes('ASTROAI VEDIC ASTROLOGY REPORT')).toBe(true);
    expect(pdfString.includes('Arjun Sharma')).toBe(true);
  });

  it('includes Ashtakoota 36-point Guna Milan breakdown for compatibility reports', () => {
    const pdfBuffer = generateReportPdf({
      reportId: 'rep_comp_123',
      reportType: 'relationship_compatibility',
      title: 'Vedic Compatibility: Rahul & Priya',
      userName: 'Rahul & Priya',
      generatedDate: 'September 3, 2026',
      astrologySummary: {},
      compatibilityScore: {
        totalScore: 28,
        maxScore: 36,
        percentage: 78,
        isAuspicious: true,
        categories: [
          { name: 'Varna', score: 1, maxScore: 1, area: 'Spiritual', description: 'Compatible' },
          { name: 'Nadi', score: 8, maxScore: 8, area: 'Genetic', description: 'Different Nadis' },
        ],
        nadiDosha: false,
        nadiDoshaCancelled: false,
        bhakootDosha: false,
        bhakootDoshaCancelled: false,
        mangalDoshaA: false,
        mangalDoshaB: false,
      },
      sections: [
        {
          title: 'Summary',
          category: 'summary',
          content: 'Highly compatible match.',
        },
      ],
    });

    const pdfString = pdfBuffer.toString('utf-8');
    expect(pdfString.includes('ASHTAKOOTA 36-POINT GUNA MILAN MATRIX')).toBe(true);
    expect(pdfString.includes('28 / 36')).toBe(true);
  });
});
