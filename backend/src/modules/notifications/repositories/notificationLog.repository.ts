import {
  NotificationCategory,
  NotificationDeliveryStatus,
  type NotificationStatsDTO,
} from '@astroai/shared-types';
import {
  NotificationLogModel,
  type INotificationLogDoc,
} from '../models/notificationLog.model';

export const notificationLogRepository = {
  async create(data: Partial<INotificationLogDoc>): Promise<INotificationLogDoc> {
    return NotificationLogModel.create(data);
  },

  async findById(id: string): Promise<INotificationLogDoc | null> {
    return NotificationLogModel.findById(id);
  },

  async listForUser(
    userId: string,
    options: { limit?: number; cursor?: string } = {},
  ): Promise<{ items: INotificationLogDoc[]; nextCursor: string | null }> {
    const limit = options.limit || 20;
    const query: any = { userId };

    if (options.cursor) {
      query._id = { $lt: options.cursor };
    }

    const items = await NotificationLogModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1);

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem._id.toString() : null;
    }

    return { items, nextCursor };
  },

  async countMarketingSince(userId: string, sinceDate: Date): Promise<number> {
    return NotificationLogModel.countDocuments({
      userId,
      category: NotificationCategory.MARKETING,
      status: {
        $in: [
          NotificationDeliveryStatus.DELIVERED,
          NotificationDeliveryStatus.SENDING,
          NotificationDeliveryStatus.QUEUED,
        ],
      },
      createdAt: { $gte: sinceDate },
    });
  },

  async checkDuplicate(
    deduplicationKey: string,
    windowMs: number = 86400000,
  ): Promise<boolean> {
    if (!deduplicationKey) return false;
    const windowStart = new Date(Date.now() - windowMs);
    const existing = await NotificationLogModel.findOne({
      deduplicationKey,
      createdAt: { $gte: windowStart },
      status: {
        $in: [
          NotificationDeliveryStatus.DELIVERED,
          NotificationDeliveryStatus.SENDING,
          NotificationDeliveryStatus.QUEUED,
          NotificationDeliveryStatus.DEFERRED_QUIET_HOURS,
        ],
      },
    });
    return !!existing;
  },

  async updateStatus(
    id: string,
    status: NotificationDeliveryStatus,
    extra: Partial<INotificationLogDoc> = {},
  ): Promise<INotificationLogDoc | null> {
    return NotificationLogModel.findByIdAndUpdate(
      id,
      { status, ...extra, updatedAt: new Date() },
      { new: true },
    );
  },

  async getStats(): Promise<NotificationStatsDTO> {
    const all = await NotificationLogModel.find({});
    let totalSent = 0;
    let totalDelivered = 0;
    let totalFailed = 0;
    let totalSuppressed = 0;
    const byChannel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const doc of all) {
      byChannel[doc.channel] = (byChannel[doc.channel] || 0) + 1;
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;

      if (doc.status === NotificationDeliveryStatus.DELIVERED) {
        totalDelivered++;
        totalSent++;
      } else if (doc.status === NotificationDeliveryStatus.SENDING) {
        totalSent++;
      } else if (doc.status === NotificationDeliveryStatus.FAILED) {
        totalFailed++;
      } else if (doc.status.startsWith('suppressed')) {
        totalSuppressed++;
      }
    }

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      totalSuppressed,
      byChannel,
      byCategory,
      byStatus,
    };
  },

  async listAll(options: {
    limit?: number;
    cursor?: string;
    status?: string;
    channel?: string;
  } = {}): Promise<{ items: INotificationLogDoc[]; nextCursor: string | null }> {
    const limit = options.limit || 50;
    const query: any = {};
    if (options.status && options.status !== 'all') {
      query.status = options.status;
    }
    if (options.channel && options.channel !== 'all') {
      query.channel = options.channel;
    }
    if (options.cursor) {
      query._id = { $lt: options.cursor };
    }

    const items = await NotificationLogModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1);

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem._id.toString() : null;
    }

    return { items, nextCursor };
  },
};
