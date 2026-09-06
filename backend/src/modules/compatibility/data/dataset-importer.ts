import type {
  ChartRelationshipAspect,
  DatasetValidationResult,
  RawCoupleAspectRow,
} from '../domain/compatibility.types';
import { datasetValidator } from './dataset-validator';
import { datasetNormalizer } from './dataset-normalizer';

export interface DatasetImportOptions {
  sourceDataset?: string;
  sourceFileName?: string;
  defaultOrb?: number;
  maxRowsToProcess?: number;
}

export interface DatasetImportResult {
  success: boolean;
  validation: DatasetValidationResult;
  aspectCount: number;
  normalizedAspects: ChartRelationshipAspect[];
  processedCouplesCount: number;
  provenance: {
    sourceDataset: string;
    sourceFile: string;
    methodology: 'WESTERN_TROPICAL_PTOLEMAIC';
    importedAt: string;
    policyNote: string;
  };
}

export const datasetImporter = {
  /**
   * Helper to parse CSV string into headers and row objects.
   */
  parseCSVText(csvContent: string): { headers: string[]; rows: RawCoupleAspectRow[] } {
    const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const rawHeaderLine = lines[0];
    if (!rawHeaderLine) {
      return { headers: [], rows: [] };
    }
    const headers = rawHeaderLine.split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());

    const rows: RawCoupleAspectRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const values = line.split(',').map((v) => v.replace(/^["']|["']$/g, '').trim());
      const row: RawCoupleAspectRow = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (header) {
          row[header] = values[j] ?? '';
        }
      }

      rows.push(row);
    }

    return { headers, rows };
  },

  /**
   * Imports and normalizes a CSV content string.
   */
  importCSV(csvContent: string, options: DatasetImportOptions = {}): DatasetImportResult {
    const sourceDataset = options.sourceDataset ?? 'gokhanyu/open-astrology-datasets';
    const sourceFile = options.sourceFileName ?? 'gauq-couples-aspects-REAL-7deg-20000-noa2b-cdata4.csv';
    const defaultOrb = options.defaultOrb ?? 7.0;

    const { headers, rows } = datasetImporter.parseCSVText(csvContent);
    const rowsToProcess = options.maxRowsToProcess ? rows.slice(0, options.maxRowsToProcess) : rows;

    const validation = datasetValidator.validateRows(rowsToProcess, headers);

    if (!validation.isValid) {
      return {
        success: false,
        validation,
        aspectCount: 0,
        normalizedAspects: [],
        processedCouplesCount: 0,
        provenance: {
          sourceDataset,
          sourceFile,
          methodology: 'WESTERN_TROPICAL_PTOLEMAIC',
          importedAt: new Date().toISOString(),
          policyNote: 'Validation failed. Data rejected from ingestion.',
        },
      };
    }

    const normalizedAspects: ChartRelationshipAspect[] = [];

    for (const row of rowsToProcess) {
      const rowAspects = datasetNormalizer.normalizeRow(row, sourceDataset, sourceFile, defaultOrb);
      normalizedAspects.push(...rowAspects);
    }

    return {
      success: true,
      validation,
      aspectCount: normalizedAspects.length,
      normalizedAspects,
      processedCouplesCount: rowsToProcess.length,
      provenance: {
        sourceDataset,
        sourceFile,
        methodology: 'WESTERN_TROPICAL_PTOLEMAIC',
        importedAt: new Date().toISOString(),
        policyNote: 'Strictly isolated for research/evaluation benchmarking. NOT in critical Vedic path.',
      },
    };
  },
};
