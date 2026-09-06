import type {
  AshtakootaScoreDTO,
  ReportSectionDTO,
  ReportType,
} from '@astroai/shared-types';

export interface ReportPdfData {
  reportId: string;
  reportType: ReportType;
  title: string;
  userName: string;
  generatedDate: string;
  astrologySummary: Record<string, any>;
  compatibilityScore?: AshtakootaScoreDTO | null;
  sections: ReportSectionDTO[];
}

/**
 * Pure TypeScript PDF-1.4 generator creating a valid, compliant PDF binary buffer.
 * Zero external binary dependencies, guaranteeing fast & reliable generation.
 */
export function generateReportPdf(data: ReportPdfData): Buffer {
  const lines: string[] = [];

  lines.push('================================================================================');
  lines.push(`                        ASTROAI VEDIC ASTROLOGY REPORT                          `);
  lines.push('================================================================================');
  lines.push('');
  lines.push(`Report Title: ${data.title}`);
  lines.push(`Client Name : ${data.userName}`);
  lines.push(`Report ID   : ${data.reportId}`);
  lines.push(`Generated On: ${data.generatedDate}`);
  lines.push('--------------------------------------------------------------------------------');
  lines.push('');

  // Compatibility Score Section if applicable
  if (data.compatibilityScore) {
    const c = data.compatibilityScore;
    lines.push('=== ASHTAKOOTA 36-POINT GUNA MILAN MATRIX ===');
    lines.push(`Total Compatibility Score: ${c.totalScore} / ${c.maxScore} (${c.percentage}%)`);
    lines.push(`Classification          : ${c.isAuspicious ? 'AUSPICIOUS / COMPATIBLE' : 'MODERATE / CAUTION'}`);
    lines.push(`Nadi Dosha Status       : ${c.nadiDoshaCancelled ? 'Cancelled' : c.nadiDosha ? 'Present' : 'None'}`);
    lines.push(`Bhakoot Dosha Status    : ${c.bhakootDoshaCancelled ? 'Cancelled' : c.bhakootDosha ? 'Present' : 'None'}`);
    lines.push(`Mangal Dosha (Person A) : ${c.mangalDoshaA ? 'Yes' : 'No'}`);
    lines.push(`Mangal Dosha (Person B) : ${c.mangalDoshaB ? 'Yes' : 'No'}`);
    lines.push('');
    lines.push('GUNA BREAKDOWN:');
    for (const cat of c.categories) {
      lines.push(`  * ${cat.name.padEnd(14)}: ${cat.score.toString().padStart(3)} / ${cat.maxScore} pts  - ${cat.area}`);
    }
    lines.push('');
    lines.push('--------------------------------------------------------------------------------');
    lines.push('');
  }

  // Planetary Summary
  if (data.astrologySummary && Object.keys(data.astrologySummary).length > 0) {
    lines.push('=== ASTROLOGICAL CHART SUMMARY ===');
    if (data.astrologySummary.ascendant) {
      lines.push(`Ascendant (Lagna) : ${data.astrologySummary.ascendant.sign || 'Aries'} (${data.astrologySummary.ascendant.nakshatra || ''})`);
    }
    if (data.astrologySummary.moonNakshatra) {
      lines.push(`Moon Nakshatra    : ${data.astrologySummary.moonNakshatra.name || ''} (Lord: ${data.astrologySummary.moonNakshatra.lord || ''})`);
    }
    if (data.astrologySummary.currentDasha) {
      lines.push(`Current Mahadasha : ${data.astrologySummary.currentDasha.planet || 'Jupiter'}`);
    }
    lines.push('');
    lines.push('--------------------------------------------------------------------------------');
    lines.push('');
  }

  // Detailed AI Interpretation Sections
  lines.push('=== DETAILED VEDIC INTERPRETATIONS & GUIDANCE ===');
  lines.push('');
  for (const sec of data.sections) {
    lines.push(`[ ${sec.title.toUpperCase()} ]`);
    lines.push(sec.content);
    if (sec.bulletPoints && sec.bulletPoints.length > 0) {
      for (const bp of sec.bulletPoints) {
        lines.push(`  - ${bp}`);
      }
    }
    lines.push('');
  }

  lines.push('================================================================================');
  lines.push('         End of Report • Powered by AstroAI Vedic Computational Engine          ');
  lines.push('================================================================================');

  // Wrap text into valid PDF 1.4 stream
  const fullText = lines.join('\n');
  return buildPdfFromText(fullText);
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Builds a valid binary PDF 1.4 file from plain text.
 */
function buildPdfFromText(text: string): Buffer {
  const textLines = text.split('\n');

  // Split into pages with ~45 lines per page
  const linesPerPage = 45;
  const pages: string[][] = [];
  for (let i = 0; i < textLines.length; i += linesPerPage) {
    pages.push(textLines.slice(i, i + linesPerPage));
  }

  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');

  // Object 2: Pages container
  const pageObjectIds = pages.map((_, idx) => `${4 + idx * 2} 0 R`).join(' ');
  objects.push(`<< /Type /Pages /Kids [ ${pageObjectIds} ] /Count ${pages.length} >>`);

  // Object 3: Font
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  // Pages & Content Streams
  pages.forEach((pageLines, pIdx) => {
    const pageObjId = 4 + pIdx * 2;
    const streamObjId = pageObjId + 1;

    // Page object
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamObjId} 0 R >>`,
    );

    // Stream content
    let streamText = 'BT /F1 9 Tf 36 750 Td 12 TL\n';
    pageLines.forEach((l) => {
      streamText += `(${escapePdfText(l)}) '\n`;
    });
    streamText += 'ET';

    const streamLength = Buffer.byteLength(streamText, 'utf-8');
    objects.push(`<< /Length ${streamLength} >>\nstream\n${streamText}\nendstream`);
  });

  // Construct final PDF binary with XRef table
  let pdfOutput = '%PDF-1.4\n';
  const offsets: number[] = [0]; // offset 0

  objects.forEach((obj, idx) => {
    offsets.push(Buffer.byteLength(pdfOutput, 'utf-8'));
    pdfOutput += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdfOutput, 'utf-8');
  pdfOutput += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = (offsets[i] ?? 0).toString().padStart(10, '0');
    pdfOutput += `${offsetStr} 00000 n \n`;
  }

  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdfOutput, 'utf-8');
}
