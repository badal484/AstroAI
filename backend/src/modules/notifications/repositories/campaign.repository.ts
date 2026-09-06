import {
  NotificationCampaignModel,
  type ICampaignDoc,
} from '../models/campaign.model';
import type {
  CampaignStatus,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '@astroai/shared-types';

export const campaignRepository = {
  async create(data: CreateCampaignInput): Promise<ICampaignDoc> {
    return NotificationCampaignModel.create({
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    });
  },

  async findById(id: string): Promise<ICampaignDoc | null> {
    return NotificationCampaignModel.findById(id);
  },

  async list(): Promise<ICampaignDoc[]> {
    return NotificationCampaignModel.find({}).sort({ createdAt: -1 });
  },

  async update(id: string, updates: UpdateCampaignInput): Promise<ICampaignDoc | null> {
    const patch: any = { ...updates };
    if (updates.scheduledAt !== undefined) {
      patch.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null;
    }
    return NotificationCampaignModel.findByIdAndUpdate(id, patch, { new: true });
  },

  async updateStatus(
    id: string,
    status: CampaignStatus,
    extra: Partial<ICampaignDoc> = {},
  ): Promise<ICampaignDoc | null> {
    return NotificationCampaignModel.findByIdAndUpdate(
      id,
      { status, ...extra, updatedAt: new Date() },
      { new: true },
    );
  },
};
