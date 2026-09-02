import type { AIErrorCategory, AIProviderName, ModelAlias } from '@astroai/shared-types';
import { logger } from '../../shared/logger';
import { estimateCostUsd } from './costRates';
import { AIUsageEventModel } from './aiUsage.model';

export interface UsageEventInput {
  requestId: string;
  alias: ModelAlias;
  provider: AIProviderName;
  model: string;
  operation: string;
  latencyMs: number;
  success: boolean;
  usedFallback: boolean;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  errorCategory: AIErrorCategory | null;
}

export const aiUsageService = {
  /** Fire-and-forget by design (ARCHITECTURE.md §5: "written asynchronously
   * ... so logging never adds latency to the user-facing response") —
   * callers must not `await` this on the response path. Failing to record
   * a usage event is a logging problem, never a reason to fail the AI
   * call itself. */
  record(input: UsageEventInput): void {
    AIUsageEventModel.create({
      ...input,
      estimatedCostUsd: estimateCostUsd(
        input.provider,
        input.model,
        input.promptTokens,
        input.completionTokens,
      ),
    }).catch((error: unknown) => {
      logger.error({ err: error, requestId: input.requestId }, 'Failed to record AI usage event');
    });
  },
};
