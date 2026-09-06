import crypto from 'crypto';
import {
  ReportStatus,
  WalletTransactionSource,
  type CreateReportInput,
  type ReportDTO,
  type ReportDetailDTO,
  type ReportHistoryQuery,
} from '@astroai/shared-types';
import { logger } from '../../shared/logger';
import {
  InsufficientWalletBalanceError,
  ReportAlreadyCompletedError,
  ReportInsufficientCreditsError,
  ReportNotFoundError,
  ReportPartnerProfileRequiredError,
} from '../../shared/errors';
import { pricingService } from '../pricing/pricing.service';
import { walletService } from '../wallet/wallet.service';
import { reportQueue } from './jobs/reportQueue';
import { reportRepository } from './report.repository';
import { reportStorage } from './storage/reportStorage';

export const reportService = {
  /**
   * Purchases and enqueues a personalized or compatibility report generation job.
   */
  async createReport(
    userId: string,
    input: CreateReportInput,
  ): Promise<ReportDTO> {
    const isCompatibility =
      input.reportType === 'compatibility' ||
      input.reportType === 'relationship_compatibility';

    if (isCompatibility && !input.partnerBirthProfileId) {
      throw new ReportPartnerProfileRequiredError();
    }

    // Check for existing report under this idempotency key
    const existing = await reportRepository.findByIdempotencyKey(
      userId,
      input.idempotencyKey,
    );
    if (existing) {
      return reportRepository.toDTO(existing);
    }

    // 1. Calculate price with active pricing rules
    const cost = await pricingService.calculateReportCost(input.reportType);
    const requiredCredits = cost.finalCredits;

    // Check user's available balance
    const wallet = await walletService.getBalance(userId);
    if (wallet.availableBalance < requiredCredits) {
      throw new ReportInsufficientCreditsError(
        `Insufficient credits. Required: ${requiredCredits}, Available: ${wallet.availableBalance}`,
      );
    }

    const reportId = `rep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const paymentIdempotencyKey = `pay_${reportId}_${input.idempotencyKey}`;

    // 2. Debit credits atomically from user's wallet
    try {
      await walletService.debit(
        userId,
        {
          amount: requiredCredits,
          source: WalletTransactionSource.REPORT,
          referenceId: reportId,
          idempotencyKey: paymentIdempotencyKey,
          pricingSnapshot: {
            pricingVersion: cost.pricingVersion,
            unitPrice: cost.baseCredits,
            discountAppliedPercent: cost.discountPercent,
            netAmount: requiredCredits,
          },
          metadata: { description: `Purchase of ${cost.reportType} report` },
        },
      );
    } catch (err: any) {
      if (err instanceof InsufficientWalletBalanceError) {
        throw new ReportInsufficientCreditsError();
      }
      throw err;
    }

    // 3. Persist Report doc in QUEUED state
    let doc;
    try {
      doc = await reportRepository.create({
        _id: reportId,
        userId,
        reportType: input.reportType,
        primaryBirthProfileId: input.primaryBirthProfileId,
        partnerBirthProfileId: input.partnerBirthProfileId || null,
        status: ReportStatus.QUEUED,
        creditsCharged: requiredCredits,
        pricingSnapshot: {
          pricingVersion: cost.pricingVersion,
          unitPrice: cost.baseCredits,
          discountAppliedPercent: cost.discountPercent,
          netAmount: requiredCredits,
        },
        astrologyData: {},
        compatibilityScore: null,
        sections: [],
        pdfUrl: null,
        pdfStorageKey: null,
        retryCount: 0,
        failureStage: null,
        failureReason: null,
        idempotencyKey: input.idempotencyKey,
        language: input.language || 'en',
      });
    } catch (err: any) {
      if (err.code === 11000 || err.name === 'MongoServerError') {
        const existing = await reportRepository.findByIdempotencyKey(userId, input.idempotencyKey);
        if (existing) {
          return reportRepository.toDTO(existing);
        }
      }
      throw err;
    }

    // 4. Enqueue background asynchronous worker
    reportQueue.enqueue(reportId);

    logger.info(
      { reportId, userId, reportType: input.reportType, credits: requiredCredits },
      'Report purchased and queued for asynchronous processing',
    );

    return reportRepository.toDTO(doc);
  },

  /**
   * Retrieves full report detail for authorized user.
   */
  async getReport(userId: string, reportId: string): Promise<ReportDetailDTO> {
    const doc = await reportRepository.findByIdAndUser(reportId, userId);
    if (!doc) {
      throw new ReportNotFoundError();
    }
    return reportRepository.toDetailDTO(doc);
  },

  /**
   * Lists report history for a user.
   */
  async listUserReports(
    userId: string,
    query: ReportHistoryQuery,
  ): Promise<ReportDTO[]> {
    const items = await reportRepository.listByUser(userId, {
      limit: query.limit,
      status: query.status,
    });
    return items.map(reportRepository.toDTO);
  },

  /**
   * Retries a failed report.
   */
  async retryReport(userId: string, reportId: string): Promise<ReportDTO> {
    const doc = await reportRepository.findByIdAndUser(reportId, userId);
    if (!doc) {
      throw new ReportNotFoundError();
    }

    if (doc.status === ReportStatus.COMPLETED) {
      throw new ReportAlreadyCompletedError();
    }

    const updated = await reportRepository.updateStatus(reportId, ReportStatus.QUEUED, {
      failureStage: null,
      failureReason: null,
    });

    reportQueue.enqueue(reportId);
    return reportRepository.toDTO(updated!);
  },

  /**
   * Gets PDF buffer for authorized user or admin.
   */
  async getPdfBuffer(reportId: string, userId?: string): Promise<Buffer> {
    const doc = await reportRepository.findById(reportId);
    if (!doc) {
      throw new ReportNotFoundError();
    }

    if (userId && doc.userId !== userId) {
      throw new ReportNotFoundError();
    }

    const buffer = await reportStorage.getPdf(reportId);
    if (!buffer) {
      throw new ReportNotFoundError('PDF document has not been generated or is missing');
    }

    return buffer;
  },

  // --- Admin Methods ---

  async adminListReports(query: {
    limit?: number;
    status?: any;
    reportType?: string;
  }): Promise<{ items: ReportDTO[]; total: number }> {
    const { items, total } = await reportRepository.listAll(query);
    return {
      items: items.map(reportRepository.toDTO),
      total,
    };
  },

  async adminGetReport(reportId: string): Promise<ReportDetailDTO> {
    const doc = await reportRepository.findById(reportId);
    if (!doc) {
      throw new ReportNotFoundError();
    }
    return reportRepository.toDetailDTO(doc);
  },

  async adminRetryReport(reportId: string): Promise<ReportDTO> {
    const doc = await reportRepository.findById(reportId);
    if (!doc) {
      throw new ReportNotFoundError();
    }

    const updated = await reportRepository.updateStatus(reportId, ReportStatus.QUEUED, {
      failureStage: null,
      failureReason: null,
    });

    reportQueue.enqueue(reportId);
    return reportRepository.toDTO(updated!);
  },

  async adminRefundReport(reportId: string): Promise<{ success: boolean; refundedCredits: number }> {
    const doc = await reportRepository.findById(reportId);
    if (!doc) {
      throw new ReportNotFoundError();
    }

    if (doc.creditsCharged > 0) {
      const refundKey = `admin_refund_rep_${doc._id}_${Date.now()}`;
      await walletService.credit(doc.userId, {
        amount: doc.creditsCharged,
        source: WalletTransactionSource.ADMIN,
        referenceId: doc._id,
        idempotencyKey: refundKey,
        metadata: { description: `Admin manual refund for report ${doc._id}` },
      });
      return { success: true, refundedCredits: doc.creditsCharged };
    }

    return { success: true, refundedCredits: 0 };
  },
};
