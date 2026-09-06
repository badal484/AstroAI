import {
  PricingConfigModel,
  DEFAULT_INITIAL_PRICING_CONFIG,
  type PricingConfigDocument,
} from './pricingConfig.model';
import { PricingConfigStatus } from '@astroai/shared-types';

export const pricingRepository = {
  /**
   * Finds the currently active pricing configuration. If none is stored yet,
   * creates the initial default seed configuration so the system is immediately usable.
   */
  async findActive(atDate: Date = new Date()): Promise<PricingConfigDocument> {
    const active = await PricingConfigModel.findOne({
      status: PricingConfigStatus.ACTIVE,
      effectiveFrom: { $lte: atDate },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gt: atDate } }],
    }).sort({ version: -1 });

    if (active) return active;

    // Check if any active config exists at all regardless of effective date bounds
    const fallbackActive = await PricingConfigModel.findOne({
      status: PricingConfigStatus.ACTIVE,
    }).sort({ version: -1 });

    if (fallbackActive) return fallbackActive;

    // Seed default if database is empty
    try {
      return (await PricingConfigModel.create(DEFAULT_INITIAL_PRICING_CONFIG)) as PricingConfigDocument;
    } catch (err: any) {
      if (err.code === 11000 || err.name === 'MongoServerError') {
        const seeded = await PricingConfigModel.findOne({ version: 1 });
        if (seeded) return seeded;
      }
      throw err;
    }
  },

  async findByVersion(version: number): Promise<PricingConfigDocument | null> {
    return PricingConfigModel.findOne({ version });
  },

  async findLatestVersion(): Promise<number> {
    const latest = await PricingConfigModel.findOne().sort({ version: -1 }).select('version');
    return latest?.version ?? 0;
  },

  async listVersions(limit = 20, cursor?: string): Promise<PricingConfigDocument[]> {
    const query: Record<string, unknown> = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }
    return PricingConfigModel.find(query).sort({ version: -1, _id: -1 }).limit(limit);
  },

  async create(data: Record<string, any>): Promise<PricingConfigDocument> {
    return (await PricingConfigModel.create(data)) as PricingConfigDocument;
  },

  async archivePriorActive(beforeVersion: number, effectiveTo: Date): Promise<void> {
    await PricingConfigModel.updateMany(
      {
        version: { $lt: beforeVersion },
        status: PricingConfigStatus.ACTIVE,
      },
      {
        $set: {
          status: PricingConfigStatus.ARCHIVED,
          effectiveTo,
        },
      },
    );
  },
};
