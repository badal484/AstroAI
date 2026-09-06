import type {
  DatasetValidationIssue,
  DatasetValidationResult,
  RawCoupleAspectRow,
} from '../domain/compatibility.types';
import { datasetNormalizer } from './dataset-normalizer';

export const datasetValidator = {
  /**
   * Validates dataset header list to ensure expected structure.
   */
  validateHeaders(headers: string[]): { isValid: boolean; issues: DatasetValidationIssue[] } {
    const issues: DatasetValidationIssue[] = [];

    if (!headers || headers.length === 0) {
      issues.push({
        severity: 'ERROR',
        message: 'CSV file contains no headers or is empty.',
      });
      return { isValid: false, issues };
    }

    const hasAspectColumns = headers.some((h) => datasetNormalizer.parseAspectColumn(h) !== null);
    if (!hasAspectColumns) {
      issues.push({
        severity: 'ERROR',
        message: 'No recognizable astrological aspect columns found in header (e.g. A-B-MerCnjVen).',
      });
    }

    return {
      isValid: !issues.some((i) => i.severity === 'ERROR'),
      issues,
    };
  },

  /**
   * Validates a collection of raw parsed CSV rows.
   */
  validateRows(rows: RawCoupleAspectRow[], headers: string[]): DatasetValidationResult {
    const headerValidation = datasetValidator.validateHeaders(headers);
    const issues: DatasetValidationIssue[] = [...headerValidation.issues];

    if (!headerValidation.isValid) {
      return {
        isValid: false,
        totalRows: rows.length,
        validRows: 0,
        issues,
        detectedColumns: headers,
      };
    }

    let validRowCount = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 1;
      let rowHasError = false;

      if (!row || typeof row !== 'object' || Object.keys(row).length === 0) {
        issues.push({
          rowNumber,
          severity: 'ERROR',
          message: 'Empty or malformed row record.',
        });
        continue;
      }

      // Validate aspect cell values (must be '0', '1', or empty/whitespace)
      for (const [col, val] of Object.entries(row)) {
        if (col.startsWith('Chart_')) continue;

        if (val !== undefined && val !== null && val !== '') {
          const trimmed = String(val).trim();
          if (trimmed !== '0' && trimmed !== '1') {
            issues.push({
              rowNumber,
              columnName: col,
              severity: 'ERROR',
              message: `Invalid aspect value '${trimmed}'. Expected binary '0' or '1'.`,
            });
            rowHasError = true;
            break;
          }
        }
      }

      if (!rowHasError) {
        validRowCount++;
      }
    }

    return {
      isValid: !issues.some((i) => i.severity === 'ERROR'),
      totalRows: rows.length,
      validRows: validRowCount,
      issues,
      detectedColumns: headers,
    };
  },
};
