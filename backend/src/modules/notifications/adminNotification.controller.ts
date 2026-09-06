import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@astroai/shared-types';
import {
  createCampaignSchema,
  createNotificationTemplateSchema,
  updateCampaignSchema,
  updateNotificationTemplateSchema,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { campaignService } from './campaign.service';
import { notificationService } from './notification.service';
import { notificationLogRepository } from './repositories/notificationLog.repository';
import { templateRepository } from './repositories/template.repository';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const adminNotificationController = {
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await notificationService.getStats();
    ok(req, res, stats);
  }),

  // Templates
  listTemplates: asyncHandler(async (req: Request, res: Response) => {
    const templates = await templateRepository.list();
    ok(
      req,
      res,
      templates.map((t) => t.toDTO()),
    );
  }),

  createTemplate: asyncHandler(async (req: Request, res: Response) => {
    const validated = createNotificationTemplateSchema.parse(req.body);
    const template = await templateRepository.create(validated);
    ok(req, res, template.toDTO(), 201);
  }),

  updateTemplate: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validated = updateNotificationTemplateSchema.parse(req.body);
    const template = await templateRepository.update(id, validated);
    if (!template) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      return;
    }
    ok(req, res, template.toDTO());
  }),

  // Campaigns
  listCampaigns: asyncHandler(async (req: Request, res: Response) => {
    const campaigns = await campaignService.list();
    ok(req, res, campaigns);
  }),

  getCampaign: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const campaign = await campaignService.getById(id);
    if (!campaign) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
      return;
    }
    ok(req, res, campaign);
  }),

  createCampaign: asyncHandler(async (req: Request, res: Response) => {
    const validated = createCampaignSchema.parse(req.body);
    const campaign = await campaignService.create(validated);
    ok(req, res, campaign, 201);
  }),

  updateCampaign: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validated = updateCampaignSchema.parse(req.body);
    const campaign = await campaignService.update(id, validated);
    if (!campaign) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
      return;
    }
    ok(req, res, campaign);
  }),

  executeCampaign: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const campaign = await campaignService.executeCampaign(id);
    ok(req, res, campaign);
  }),

  pauseCampaign: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const campaign = await campaignService.pause(id);
    if (!campaign) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
      return;
    }
    ok(req, res, campaign);
  }),

  resumeCampaign: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const campaign = await campaignService.resume(id);
    if (!campaign) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
      return;
    }
    ok(req, res, campaign);
  }),

  // Logs
  listLogs: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const channel = req.query.channel ? String(req.query.channel) : undefined;

    const result = await notificationLogRepository.listAll({
      limit,
      cursor,
      status,
      channel,
    });

    ok(req, res, {
      items: result.items.map((i) => i.toDTO()),
      nextCursor: result.nextCursor,
    });
  }),
};
