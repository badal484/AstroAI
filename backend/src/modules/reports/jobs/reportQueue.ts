import {
  ReportFailureStage,
  ReportStatus,
  WalletTransactionSource,
} from '@astroai/shared-types';
import { logger } from '../../../shared/logger';
import { astrologyService } from '../../astrology/astrology.service';
import { birthProfileService } from '../../birthProfiles';
import { walletService } from '../../wallet/wallet.service';
import { reportInterpretationService } from '../ai/reportInterpretation.service';
import { generateReportPdf } from '../pdf/pdfGenerator';
import { reportRepository } from '../report.repository';
import { reportStorage } from '../storage/reportStorage';
import { eventBus } from '../../../shared/eventBus';

const MAX_RETRIES = 3;
const runningPromises = new Map<string, Promise<void>>();

export const reportQueue = {
  /**
   * Enqueues a report for asynchronous background processing.
   */
  enqueue(reportId: string): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    setImmediate(() => {
      void this.processJob(reportId);
    });
  },

  /**
   * Main asynchronous pipeline worker for report generation.
   */
  async processJob(reportId: string): Promise<void> {
    const ongoing = runningPromises.get(reportId);
    if (ongoing) {
      return ongoing;
    }

    const jobPromise = this.executePipeline(reportId);
    runningPromises.set(reportId, jobPromise);

    try {
      await jobPromise;
    } finally {
      runningPromises.delete(reportId);
    }
  },

  async executePipeline(reportId: string): Promise<void> {
    const report = await reportRepository.findById(reportId);
    if (!report) {
      logger.error({ reportId }, 'Report not found for queued job');
      return;
    }

    if (report.status === ReportStatus.COMPLETED) {
      logger.info({ reportId }, 'Report already completed, nothing to process');
      return;
    }

    let currentStage: ReportFailureStage = ReportFailureStage.ASTROLOGY_ENGINE;

      try {
        // Step 1: Astrology Engine Calculation
        await reportRepository.updateStatus(reportId, ReportStatus.CALCULATING);

        const isCompatibility =
          report.reportType === 'compatibility' ||
          report.reportType === 'relationship_compatibility';

        let chartA: any = null;
        let chartB: any = null;
        let compatibilityScore: any = null;
        let astrologySnapshot: Record<string, any> = {};

        const profileA = await birthProfileService.getById(
          report.userId,
          report.primaryBirthProfileId,
        );

        if (isCompatibility) {
          if (!report.partnerBirthProfileId) {
            throw new Error('Partner birth profile ID is required for compatibility reports');
          }

          const profileB = await birthProfileService.getById(
            report.userId,
            report.partnerBirthProfileId,
          );

          const result = await astrologyService.getAshtakootaCompatibility(
            report.userId,
            profileA.id,
            profileB.id,
          );

          chartA = result.chartA;
          chartB = result.chartB;
          compatibilityScore = result.compatibility;
          astrologySnapshot = {
            chartA: {
              ascendant: chartA.ascendant,
              moonNakshatra: chartA.moonNakshatra,
              planetPositions: chartA.planetPositions,
            },
            chartB: {
              ascendant: chartB.ascendant,
              moonNakshatra: chartB.moonNakshatra,
              planetPositions: chartB.planetPositions,
            },
            compatibility: compatibilityScore,
          };
        } else {
          chartA = await astrologyService.getChart(report.userId, profileA.id);
          astrologySnapshot = {
            ascendant: chartA.ascendant,
            moonNakshatra: chartA.moonNakshatra,
            planetPositions: chartA.planetPositions,
            currentDasha: chartA.currentDasha,
            yogas: chartA.yogas,
          };
        }

        // Step 2: AI Interpretation & Section Generation
        currentStage = ReportFailureStage.AI_INTERPRETATION;
        await reportRepository.updateStatus(reportId, ReportStatus.INTERPRETING, {
          astrologyData: astrologySnapshot,
          compatibilityScore,
        });

        const sections = await reportInterpretationService.generateInterpretation({
          reportType: report.reportType,
          userName: profileA.name,
          partnerName: isCompatibility ? 'Partner' : undefined,
          chartA,
          chartB,
          compatibilityScore,
          language: report.language || 'en',
        });

        // Step 3: Safety & Output Validation
        currentStage = ReportFailureStage.VALIDATION;
        if (!sections || sections.length === 0) {
          throw new Error('Report sections generated empty payload');
        }

        // Step 4: PDF Document Generation
        currentStage = ReportFailureStage.PDF_GENERATION;
        await reportRepository.updateStatus(reportId, ReportStatus.GENERATING_PDF);

        const pdfBuffer = generateReportPdf({
          reportId: report._id,
          reportType: report.reportType,
          title: isCompatibility
            ? `Vedic Compatibility & Guna Milan: ${profileA.name}`
            : `Vedic Life Kundli: ${profileA.name}`,
          userName: profileA.name,
          generatedDate: new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          astrologySummary: astrologySnapshot,
          compatibilityScore,
          sections,
        });

        // Step 5: PDF Storage
        currentStage = ReportFailureStage.STORAGE;
        const { storageKey, publicUrl } = await reportStorage.savePdf(
          report._id,
          pdfBuffer,
        );

        // Step 6: Mark Complete
        await reportRepository.markCompleted(reportId, {
          astrologyData: astrologySnapshot,
          compatibilityScore,
          sections,
          pdfUrl: publicUrl,
          pdfStorageKey: storageKey,
        });

        eventBus.emit('report.ready', {
          userId: report.userId,
          reportId,
          reportType: report.reportType,
          pdfUrl: publicUrl,
        });

        logger.info(
          { reportId, userId: report.userId, reportType: report.reportType },
          'Asynchronous report generation successfully completed',
        );
      } catch (stageErr: any) {
        logger.error(
          { stageErr, reportId, stage: currentStage },
          'Report pipeline stage failed during execution',
        );

        // Check if retry limit reached
        if (report.retryCount + 1 < MAX_RETRIES) {
          await reportRepository.markFailed(
            reportId,
            currentStage,
            stageErr.message || 'Error occurred in pipeline stage',
          );
          // Exponential backoff retry
          if (process.env.NODE_ENV !== 'test') {
            setTimeout(() => {
              void this.processJob(reportId);
            }, 1000 * Math.pow(2, report.retryCount + 1));
          }
        } else {
          // Final Failure: Mark failed and issue automatic credit refund
          await this.handleFinalFailure(
            reportId,
            currentStage,
            stageErr.message || 'Exhausted maximum retry attempts',
          );
        }
      }
  },

  /**
   * Handles terminal report failure with automatic wallet refund.
   */
  async handleFinalFailure(
    reportId: string,
    failureStage: ReportFailureStage,
    failureReason: string,
  ): Promise<void> {
    const report = await reportRepository.markFailed(reportId, failureStage, failureReason);
    if (!report) return;

    // Automatic Refund of debited credits
    if (report.creditsCharged > 0) {
      try {
        const refundKey = `refund_rep_${report._id}_${Date.now()}`;
        await walletService.credit(report.userId, {
          amount: report.creditsCharged,
          source: WalletTransactionSource.REPORT,
          referenceId: report._id,
          idempotencyKey: refundKey,
          metadata: {
            description: `Automated refund for failed report generation (${report.reportType})`,
          },
        });
        logger.info(
          { reportId, userId: report.userId, amount: report.creditsCharged },
          'Successfully issued automated credit refund for failed report',
        );
      } catch (refundErr) {
        logger.error(
          { refundErr, reportId, userId: report.userId },
          'Failed to issue automated refund for failed report',
        );
      }
    }
  },
};
