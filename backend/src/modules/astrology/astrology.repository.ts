import {
  AstrologyChartModel,
  AstrologyCompatibilityModel,
  type ChartDocument,
  type CompatibilityDocument,
} from './astrology.model';
import type { ComputedNatalChart } from './engine/astrologyEngine.types';
import type { CompatibilityScore } from '@astroai/shared-types';

export function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join(':');
}

export const astrologyRepository = {
  findChart(birthProfileId: string): Promise<ChartDocument | null> {
    return AstrologyChartModel.findOne({ birthProfileId }).exec();
  },

  async upsertChart(
    birthProfileId: string,
    data: { calculationVersion: number; engineProviderId: string; facts: ComputedNatalChart },
  ): Promise<ChartDocument> {
    const doc = await AstrologyChartModel.findOneAndUpdate({ birthProfileId }, data, {
      new: true,
      upsert: true,
    }).exec();
    return doc;
  },

  deleteChart(birthProfileId: string): Promise<unknown> {
    return AstrologyChartModel.deleteOne({ birthProfileId }).exec();
  },

  findCompatibility(idA: string, idB: string): Promise<CompatibilityDocument | null> {
    return AstrologyCompatibilityModel.findOne({ pairKey: pairKey(idA, idB) }).exec();
  },

  async upsertCompatibility(
    idA: string,
    idB: string,
    data: { calculationVersion: number; engineProviderId: string; score: CompatibilityScore },
  ): Promise<CompatibilityDocument> {
    const doc = await AstrologyCompatibilityModel.findOneAndUpdate(
      { pairKey: pairKey(idA, idB) },
      { birthProfileIdA: idA, birthProfileIdB: idB, ...data },
      { new: true, upsert: true },
    ).exec();
    return doc;
  },

  deleteChartsAndCompatibilityFor(birthProfileId: string): Promise<unknown> {
    return Promise.all([
      AstrologyChartModel.deleteOne({ birthProfileId }).exec(),
      AstrologyCompatibilityModel.deleteMany({
        $or: [{ birthProfileIdA: birthProfileId }, { birthProfileIdB: birthProfileId }],
      }).exec(),
    ]);
  },
};
