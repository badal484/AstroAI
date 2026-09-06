import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../../shared/logger';

const STORAGE_BASE_DIR = path.resolve(process.cwd(), 'data', 'reports');

// Ensure directory exists
if (!fs.existsSync(STORAGE_BASE_DIR)) {
  fs.mkdirSync(STORAGE_BASE_DIR, { recursive: true });
}

export const reportStorage = {
  /**
   * Saves generated PDF buffer to storage.
   */
  async savePdf(reportId: string, pdfBuffer: Buffer): Promise<{ storageKey: string; publicUrl: string }> {
    try {
      const fileName = `${reportId}.pdf`;
      const filePath = path.join(STORAGE_BASE_DIR, fileName);

      await fs.promises.writeFile(filePath, pdfBuffer);
      const storageKey = `local:${fileName}`;
      const publicUrl = `/api/v1/reports/${reportId}/pdf`;

      return { storageKey, publicUrl };
    } catch (err) {
      logger.error({ err, reportId }, 'Failed to save PDF to report storage');
      throw err;
    }
  },

  /**
   * Retrieves PDF buffer from storage.
   */
  async getPdf(reportId: string): Promise<Buffer | null> {
    try {
      const fileName = `${reportId}.pdf`;
      const filePath = path.join(STORAGE_BASE_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      return await fs.promises.readFile(filePath);
    } catch (err) {
      logger.error({ err, reportId }, 'Failed to read PDF from report storage');
      return null;
    }
  },

  /**
   * Deletes a stored PDF file.
   */
  async deletePdf(reportId: string): Promise<void> {
    try {
      const fileName = `${reportId}.pdf`;
      const filePath = path.join(STORAGE_BASE_DIR, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      logger.warn({ err, reportId }, 'Failed to delete PDF from report storage');
    }
  },
};
