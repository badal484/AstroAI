import {
  ReportFailureStage,
  ReportStatus,
  type ReportDTO,
  type ReportDetailDTO,
} from '@astroai/shared-types';
import { type IReportDoc, ReportModel } from './report.model';

function toReportDTO(doc: IReportDoc): ReportDTO {
  return {
    id: doc._id,
    userId: doc.userId,
    reportType: doc.reportType,
    primaryBirthProfileId: doc.primaryBirthProfileId,
    partnerBirthProfileId: doc.partnerBirthProfileId,
    status: doc.status,
    creditsCharged: doc.creditsCharged,
    pricingSnapshot: doc.pricingSnapshot,
    pdfUrl: doc.pdfUrl,
    retryCount: doc.retryCount,
    failureStage: doc.failureStage,
    failureReason: doc.failureReason,
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toReportDetailDTO(doc: IReportDoc): ReportDetailDTO {
  return {
    report: toReportDTO(doc),
    astrologyData: doc.astrologyData || {},
    compatibilityScore: doc.compatibilityScore || null,
    sections: doc.sections || [],
  };
}

export const reportRepository = {
  async create(reportData: Partial<IReportDoc>): Promise<IReportDoc> {
    return ReportModel.create(reportData);
  },

  async findById(id: string): Promise<IReportDoc | null> {
    return ReportModel.findById(id);
  },

  async findByIdAndUser(id: string, userId: string): Promise<IReportDoc | null> {
    return ReportModel.findOne({ _id: id, userId });
  },

  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<IReportDoc | null> {
    return ReportModel.findOne({ userId, idempotencyKey });
  },

  async updateStatus(
    id: string,
    status: ReportStatus,
    extra: Partial<IReportDoc> = {},
  ): Promise<IReportDoc | null> {
    return ReportModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          ...extra,
        },
      },
      { new: true },
    );
  },

  async markFailed(
    id: string,
    failureStage: ReportFailureStage,
    failureReason: string,
  ): Promise<IReportDoc | null> {
    return ReportModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: ReportStatus.FAILED,
          failureStage,
          failureReason,
        },
        $inc: { retryCount: 1 },
      },
      { new: true },
    );
  },

  async markCompleted(
    id: string,
    update: {
      astrologyData: Record<string, any>;
      compatibilityScore?: any;
      sections: any[];
      pdfUrl: string;
      pdfStorageKey: string;
    },
  ): Promise<IReportDoc | null> {
    return ReportModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: ReportStatus.COMPLETED,
          completedAt: new Date(),
          failureStage: null,
          failureReason: null,
          ...update,
        },
      },
      { new: true },
    );
  },

  async listByUser(
    userId: string,
    query: { limit?: number; status?: ReportStatus },
  ): Promise<IReportDoc[]> {
    const filter: Record<string, any> = { userId };
    if (query.status) {
      filter.status = query.status;
    }
    const limit = query.limit || 20;
    return ReportModel.find(filter).sort({ createdAt: -1 }).limit(limit);
  },

  async listAll(query: {
    limit?: number;
    status?: ReportStatus;
    reportType?: string;
  }): Promise<{ items: IReportDoc[]; total: number }> {
    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.reportType) filter.reportType = query.reportType;

    const limit = query.limit || 50;
    const [items, total] = await Promise.all([
      ReportModel.find(filter).sort({ createdAt: -1 }).limit(limit),
      ReportModel.countDocuments(filter),
    ]);

    return { items, total };
  },

  toDTO: toReportDTO,
  toDetailDTO: toReportDetailDTO,
};
