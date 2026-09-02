import type { AIRoutingCandidate, ModelAlias } from '@astroai/shared-types';
import { redis } from '../../lib/redis';
import { aiConfigRepository } from './aiConfig.repository';
import { DEFAULT_AI_ROUTING } from './router/defaultRouting';

// Short TTL, not a long one: an admin routing change should take effect
// quickly without a redeploy (ARCHITECTURE.md §5), and this is cheap to
// recompute — cache invalidation on write (below) covers the common case,
// this TTL is just a safety net for multi-instance deployments.
const CACHE_TTL_SECONDS = 60;
const cacheKey = (alias: ModelAlias): string => `ai:routing:${alias}`;

export const aiConfigService = {
  /** Ordered provider/model candidates for an alias — an admin override if
   * one exists, else the built-in default. Never empty for a known alias. */
  async getRoutingCandidates(alias: ModelAlias): Promise<AIRoutingCandidate[]> {
    const cached = await redis.get(cacheKey(alias));
    if (cached) return JSON.parse(cached) as AIRoutingCandidate[];

    const override = await aiConfigRepository.findByAlias(alias);
    const candidates = override?.candidates ?? DEFAULT_AI_ROUTING[alias];

    await redis.set(cacheKey(alias), JSON.stringify(candidates), 'EX', CACHE_TTL_SECONDS);
    return candidates;
  },

  async setRoutingCandidates(alias: ModelAlias, candidates: AIRoutingCandidate[]): Promise<void> {
    await aiConfigRepository.upsert(alias, candidates);
    await redis.del(cacheKey(alias));
  },

  async resetToDefault(alias: ModelAlias): Promise<void> {
    await aiConfigRepository.deleteByAlias(alias);
    await redis.del(cacheKey(alias));
  },
};
