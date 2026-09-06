import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. QUERY PARAMS & TIME RANGES
// ---------------------------------------------------------------------------

export const AnalyticsTimeRange = {
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
  NINETY_DAYS: '90d',
  ONE_YEAR: '1y',
  CUSTOM: 'custom',
} as const;
export type AnalyticsTimeRange = (typeof AnalyticsTimeRange)[keyof typeof AnalyticsTimeRange];

export const analyticsTimeRangeQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y', 'custom']).default('30d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type AnalyticsTimeRangeQuery = z.infer<typeof analyticsTimeRangeQuerySchema>;

// ---------------------------------------------------------------------------
// 2. PRODUCT & GROWTH ANALYTICS
// ---------------------------------------------------------------------------

export interface RegistrationTrendItem {
  date: string;
  registrations: number;
}

export interface ActivationFunnelDTO {
  totalRegistrations: number;
  profileCompleted: {
    count: number;
    conversionRate: number; // percentage (0 to 100)
  };
  firstChatStarted: {
    count: number;
    conversionRate: number; // percentage (0 to 100)
  };
  firstPurchaseCompleted: {
    count: number;
    conversionRate: number; // percentage (0 to 100)
  };
}

export interface ActiveUsersDTO {
  dau: number;
  wau: number;
  mau: number;
  stickinessPercent: number; // (DAU / MAU) * 100
}

export interface RetentionCohortItem {
  cohortDate: string; // e.g. "2026-08-01"
  initialUsers: number;
  day1Percent: number;
  day7Percent: number;
  day14Percent: number;
  day30Percent: number;
}

export interface ChurnMetricsDTO {
  totalUsers: number;
  activeUsers30d: number;
  churnedUsersCount: number;
  churnRatePercent: number;
}

export interface ProductAnalyticsDTO {
  registrationsTimeline: RegistrationTrendItem[];
  activationFunnel: ActivationFunnelDTO;
  activeUsers: ActiveUsersDTO;
  retentionCohorts: RetentionCohortItem[];
  churn: ChurnMetricsDTO;
}

// ---------------------------------------------------------------------------
// 3. FINANCIAL & MONETIZATION ANALYTICS
// ---------------------------------------------------------------------------

export interface FinancialOverviewDTO {
  gmvPaise: number;
  netRevenuePaise: number;
  refundsPaise: number;
  totalPaidOrders: number;
}

export interface UnitEconomicsDTO {
  arpuPaise: number;
  arppuPaise: number;
  averageOrderValuePaise: number;
}

export interface ServiceRevenueItem {
  service: 'credit_packs' | 'reports' | 'voice_calls';
  revenuePaise: number;
  ordersCount: number;
  sharePercent: number;
}

export interface WalletUsageDTO {
  totalCreditsPurchased: number;
  totalCreditsConsumed: number;
  totalCreditsHeld: number;
  totalCreditsExpired: number;
}

export interface VoiceAnalyticsDTO {
  totalMinutesBilled: number;
  totalCalls: number;
  averageDurationMinutes: number;
  billedRevenuePaise: number;
  providerCostPaise: number;
  grossMarginPercent: number;
}

export interface ReportAnalyticsDTO {
  totalReportsPurchased: number;
  kundliReports: number;
  compatibilityReports: number;
  revenuePaise: number;
}

export interface MarketingAttributionDTO {
  promotions: {
    redemptionsCount: number;
    discountCostPaise: number;
    attributedGmvPaise: number;
    roiMultiplier: number;
  };
  referrals: {
    invitesSent: number;
    refereesClaimed: number;
    qualifyingPurchases: number;
    rewardsIssuedCredits: number;
  };
  notifications: {
    totalSent: number;
    openRatePercent: number;
    conversionRatePercent: number;
    attributedGmvPaise: number;
  };
}

export interface FinancialAnalyticsDTO {
  overview: FinancialOverviewDTO;
  unitEconomics: UnitEconomicsDTO;
  serviceBreakdown: ServiceRevenueItem[];
  walletUsage: WalletUsageDTO;
  voice: VoiceAnalyticsDTO;
  reports: ReportAnalyticsDTO;
  marketingAttribution: MarketingAttributionDTO;
}

// ---------------------------------------------------------------------------
// 4. AI GATEWAY & RELIABILITY ANALYTICS
// ---------------------------------------------------------------------------

export interface AIOperationOverviewDTO {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRatePercent: number;
}

export interface AITokenUsageDTO {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIProviderCostDTO {
  provider: string;
  requests: number;
  totalTokens: number;
  costPaise: number;
  costUsd: number;
}

export interface AIReliabilityDTO {
  fallbackCount: number;
  fallbackRatePercent: number;
  failuresByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

export interface LatencyDistributionDTO {
  averageMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface AITaskLatencyDTO extends LatencyDistributionDTO {
  task: string;
}

export interface AITechnicalAnalyticsDTO {
  overview: AIOperationOverviewDTO;
  tokens: AITokenUsageDTO;
  cost: {
    totalCostPaise: number;
    totalCostUsd: number;
    costByProvider: AIProviderCostDTO[];
  };
  reliability: AIReliabilityDTO;
  latencies: {
    overall: LatencyDistributionDTO;
    byTask: AITaskLatencyDTO[];
  };
}

// ---------------------------------------------------------------------------
// 5. DIAGNOSTIC ANALYTICS EVENTS LOG (PAGINATED, PRIVACY-SAFE)
// ---------------------------------------------------------------------------

export interface AnalyticsEventLogDTO {
  id: string;
  category: 'product' | 'financial' | 'ai_gateway' | 'notification' | 'system';
  eventName: string;
  entityId?: string | null;
  status: 'success' | 'failure' | 'warning';
  durationMs?: number | null;
  metrics?: Record<string, number> | null;
  createdAt: string;
}

export interface PaginatedAnalyticsEventsDTO {
  items: AnalyticsEventLogDTO[];
  total: number;
  limit: number;
  offset: number;
}
