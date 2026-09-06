import {
  AudienceSegment,
  CampaignStatus,
  NotificationEventType,
  type CreateCampaignInput,
  type NotificationCampaignDTO,
  type UpdateCampaignInput,
} from '@astroai/shared-types';
import { logger } from '../../shared/logger';
import { BirthProfileModel } from '../birthProfiles/birthProfile.model';
import { UserModel } from '../users/user.model';
import { WalletBalanceModel } from '../wallet/balance.model';
import { notificationService } from './notification.service';
import { campaignRepository } from './repositories/campaign.repository';

export const campaignService = {
  async create(data: CreateCampaignInput): Promise<NotificationCampaignDTO> {
    const doc = await campaignRepository.create(data);
    return doc.toDTO();
  },

  async getById(id: string): Promise<NotificationCampaignDTO | null> {
    const doc = await campaignRepository.findById(id);
    return doc ? doc.toDTO() : null;
  },

  async list(): Promise<NotificationCampaignDTO[]> {
    const docs = await campaignRepository.list();
    return docs.map((d) => d.toDTO());
  },

  async update(id: string, updates: UpdateCampaignInput): Promise<NotificationCampaignDTO | null> {
    const doc = await campaignRepository.update(id, updates);
    return doc ? doc.toDTO() : null;
  },

  async pause(id: string): Promise<NotificationCampaignDTO | null> {
    const doc = await campaignRepository.updateStatus(id, CampaignStatus.PAUSED);
    return doc ? doc.toDTO() : null;
  },

  async resume(id: string): Promise<NotificationCampaignDTO | null> {
    const doc = await campaignRepository.updateStatus(id, CampaignStatus.SCHEDULED);
    return doc ? doc.toDTO() : null;
  },

  /**
   * Resolves audience and executes campaign delivery.
   */
  async executeCampaign(campaignId: string): Promise<NotificationCampaignDTO> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status === CampaignStatus.PAUSED || campaign.status === CampaignStatus.CANCELLED) {
      throw new Error(`Campaign is ${campaign.status} and cannot be executed`);
    }

    await campaignRepository.updateStatus(campaignId, CampaignStatus.RUNNING);

    // 1. Resolve Target Users
    const targetUserIds = await this.resolveAudienceUsers(
      campaign.audienceSegment,
      campaign.audienceFilters,
      campaign.targetLanguage,
    );

    let sent = 0;
    let delivered = 0;
    let failed = 0;
    let suppressed = 0;

    logger.info(
      { campaignId, targetCount: targetUserIds.length },
      'Executing notification campaign',
    );

    // 2. Dispatch to each target user
    for (const userId of targetUserIds) {
      // Check if paused during execution
      const current = await campaignRepository.findById(campaignId);
      if (current?.status === CampaignStatus.PAUSED || current?.status === CampaignStatus.CANCELLED) {
        logger.info({ campaignId }, 'Campaign was paused/cancelled during execution');
        break;
      }

      for (const channel of campaign.channels) {
        const res = await notificationService.send({
          userId,
          eventType: NotificationEventType.PROMOTIONAL_CAMPAIGN,
          templateCode: campaign.templateCode,
          campaignId: campaign._id.toString(),
          channelOverride: channel,
          deduplicationKey: `camp_${campaignId}_${userId}`,
        });

        delivered += res.deliveredCount;
        suppressed += res.suppressedCount;
        if (res.deliveredCount > 0) sent++;
        if (res.logs.some((l) => l.status === 'failed')) failed++;
      }
    }

    const updated = await campaignRepository.updateStatus(campaignId, CampaignStatus.COMPLETED, {
      executedAt: new Date(),
      stats: {
        totalTargeted: targetUserIds.length,
        sent,
        delivered,
        failed,
        suppressed,
      },
    });

    return updated ? updated.toDTO() : campaign.toDTO();
  },

  /**
   * Resolves user IDs matching audience segment and filters.
   */
  async resolveAudienceUsers(
    segment: AudienceSegment,
    filters: any = {},
    targetLanguage?: string,
  ): Promise<string[]> {
    const userQuery: any = { status: 'active' };
    if (targetLanguage) {
      userQuery.language = targetLanguage;
    }

    switch (segment) {
      case AudienceSegment.ALL_USERS: {
        const users = await UserModel.find(userQuery).select('_id');
        return users.map((u) => u._id.toString());
      }

      case AudienceSegment.COMPLETED_PROFILE: {
        const distinctUserIds = await BirthProfileModel.distinct('userId');
        const users = await UserModel.find({
          _id: { $in: distinctUserIds },
          ...userQuery,
        }).select('_id');
        return users.map((u) => u._id.toString());
      }

      case AudienceSegment.LOW_BALANCE: {
        const maxBalance = filters?.maxBalance ?? 5;
        const lowWallets = await WalletBalanceModel.find({
          balance: { $lte: maxBalance },
        }).select('userId');
        const userIds = lowWallets.map((w) => w.userId);
        const users = await UserModel.find({
          _id: { $in: userIds },
          ...userQuery,
        }).select('_id');
        return users.map((u) => u._id.toString());
      }

      case AudienceSegment.INACTIVE_7_DAYS: {
        const days = filters?.inactiveDays || 7;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const users = await UserModel.find({
          updatedAt: { $lte: cutoff },
          ...userQuery,
        }).select('_id');
        return users.map((u) => u._id.toString());
      }

      case AudienceSegment.HAS_PURCHASED: {
        const wallets = await WalletBalanceModel.find({
          lifetimeSpent: { $gt: 0 },
        }).select('userId');
        const userIds = wallets.map((w) => w.userId);
        const users = await UserModel.find({
          _id: { $in: userIds },
          ...userQuery,
        }).select('_id');
        return users.map((u) => u._id.toString());
      }

      default: {
        const users = await UserModel.find(userQuery).select('_id');
        return users.map((u) => u._id.toString());
      }
    }
  },
};
