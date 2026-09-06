import { z } from 'zod';
import { ReportType } from './pricing';
import type { PricingSnapshot } from './wallet';

/**
 * Asynchronous report processing states.
 */
export const ReportStatus = {
  QUEUED: 'queued',
  CALCULATING: 'calculating',
  INTERPRETING: 'interpreting',
  GENERATING_PDF: 'generating_pdf',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

/**
 * Pipeline stage where a failure occurred (if any).
 */
export const ReportFailureStage = {
  PAYMENT: 'payment',
  ASTROLOGY_ENGINE: 'astrology_engine',
  AI_INTERPRETATION: 'ai_interpretation',
  VALIDATION: 'validation',
  PDF_GENERATION: 'pdf_generation',
  STORAGE: 'storage',
} as const;
export type ReportFailureStage =
  (typeof ReportFailureStage)[keyof typeof ReportFailureStage];

/**
 * Input schema to request and purchase a report generation job.
 */
export const createReportRequestSchema = z.object({
  reportType: z.nativeEnum(ReportType),
  primaryBirthProfileId: z.string().min(1, 'primaryBirthProfileId is required'),
  partnerBirthProfileId: z.string().nullable().optional(),
  language: z.enum(['en', 'hi', 'te', 'ta', 'kn', 'bn', 'mr', 'gu']).default('en'),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
});
export type CreateReportInput = z.infer<typeof createReportRequestSchema>;

/**
 * Input schema to manually retry a failed report.
 */
export const retryReportSchema = z.object({
  reportId: z.string().min(1, 'reportId is required'),
});
export type RetryReportInput = z.infer<typeof retryReportSchema>;

/**
 * Query schema for listing reports.
 */
export const reportHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  cursor: z.string().optional(),
  status: z.nativeEnum(ReportStatus).optional(),
});
export type ReportHistoryQuery = z.infer<typeof reportHistoryQuerySchema>;

/**
 * Ashtakoota Guna Milan category score breakdown.
 */
export interface AshtakootaCategoryDTO {
  name: string; // e.g. "Varna", "Vashya", "Tara", "Yoni", "Graha Maitri", "Gana", "Bhakoot", "Nadi"
  score: number;
  maxScore: number;
  area: string; // e.g. "Spiritual Compatibility", "Mental Friendship", "Genetic Harmony"
  description: string;
}

/**
 * Full deterministic Ashtakoota Compatibility calculation score DTO.
 */
export interface AshtakootaScoreDTO {
  totalScore: number;
  maxScore: number; // 36
  percentage: number;
  isAuspicious: boolean;
  categories: AshtakootaCategoryDTO[];
  nadiDosha: boolean;
  nadiDoshaCancelled: boolean;
  bhakootDosha: boolean;
  bhakootDoshaCancelled: boolean;
  mangalDoshaA: boolean;
  mangalDoshaB: boolean;
}

/**
 * Report structured content section.
 */
export interface ReportSectionDTO {
  title: string;
  category: string;
  content: string;
  bulletPoints?: string[];
}

/**
 * Base Report entity DTO.
 */
export interface ReportDTO {
  id: string;
  userId: string;
  reportType: ReportType;
  primaryBirthProfileId: string;
  partnerBirthProfileId: string | null;
  status: ReportStatus;
  creditsCharged: number;
  pricingSnapshot: PricingSnapshot;
  pdfUrl: string | null;
  retryCount: number;
  failureStage: ReportFailureStage | null;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full Report Detail DTO with astrology calculation and interpretation sections.
 */
export interface ReportDetailDTO {
  report: ReportDTO;
  astrologyData: Record<string, unknown>;
  compatibilityScore?: AshtakootaScoreDTO | null;
  sections: ReportSectionDTO[];
}

/**
 * Lightweight report summary for list views.
 */
export interface ReportSummaryDTO {
  id: string;
  reportType: ReportType;
  title: string;
  status: ReportStatus;
  createdAt: string;
  completedAt: string | null;
  pdfUrl: string | null;
}
