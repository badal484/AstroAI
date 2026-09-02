import type { AIRoutingCandidate, ModelAlias } from '@astroai/shared-types';
import { AIRoutingConfigModel } from './aiConfig.model';

export const aiConfigRepository = {
  findByAlias(alias: ModelAlias) {
    return AIRoutingConfigModel.findOne({ alias }).exec();
  },

  findAll() {
    return AIRoutingConfigModel.find().exec();
  },

  upsert(alias: ModelAlias, candidates: AIRoutingCandidate[]) {
    return AIRoutingConfigModel.findOneAndUpdate(
      { alias },
      { alias, candidates },
      { new: true, upsert: true },
    ).exec();
  },

  deleteByAlias(alias: ModelAlias) {
    return AIRoutingConfigModel.deleteOne({ alias }).exec();
  },
};
