import type { Request, Response } from 'express';
import {
  createReportRequestSchema,
  reportHistoryQuerySchema,
  type ApiSuccessResponse,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors';
import { reportService } from './report.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId: req.requestId,
  };
  res.status(status).json(body);
}

export const reportController = {
  createReport: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const input = createReportRequestSchema.parse(req.body);
    const report = await reportService.createReport(userId, input);
    ok(req, res, report, 202);
  }),

  getReport: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const reportId = req.params.id as string;
    const detail = await reportService.getReport(userId, reportId);
    ok(req, res, detail);
  }),

  listReports: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const query = reportHistoryQuerySchema.parse(req.query);
    const reports = await reportService.listUserReports(userId, query);
    ok(req, res, reports);
  }),

  retryReport: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const reportId = req.params.id as string;
    const report = await reportService.retryReport(userId, reportId);
    ok(req, res, report);
  }),

  downloadPdf: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const reportId = req.params.id as string;
    const pdfBuffer = await reportService.getPdfBuffer(reportId, userId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="AstroAI-Report-${reportId}.pdf"`,
    );
    res.send(pdfBuffer);
  }),

  adminListReports: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const status = req.query.status as any;
    const reportType = req.query.reportType as string;

    const result = await reportService.adminListReports({ limit, status, reportType });
    ok(req, res, result);
  }),

  adminGetReport: asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const detail = await reportService.adminGetReport(reportId);
    ok(req, res, detail);
  }),

  adminRetryReport: asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const report = await reportService.adminRetryReport(reportId);
    ok(req, res, report);
  }),

  adminRefundReport: asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const result = await reportService.adminRefundReport(reportId);
    ok(req, res, result);
  }),

  adminDownloadPdf: asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const pdfBuffer = await reportService.getPdfBuffer(reportId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="AstroAI-Report-${reportId}.pdf"`,
    );
    res.send(pdfBuffer);
  }),
};
