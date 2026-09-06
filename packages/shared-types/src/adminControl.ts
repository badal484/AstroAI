import { z } from 'zod';
import { AccountStatus, AdminRole } from './auth';

// ---------------------------------------------------------------------------
// 1. AUDIT LOGGING
// ---------------------------------------------------------------------------

export const AuditAction = {
  USER_SUSPEND: 'user.suspend',
  USER_ACTIVATE: 'user.activate',
  USER_DELETE: 'user.delete',
  WALLET_CREDIT_ADJUST: 'wallet.credit_adjust',
  WALLET_DEBIT_ADJUST: 'wallet.debit_adjust',
  PAYMENT_REFUND: 'payment.refund',
  PRICING_UPDATE: 'pricing.update',
  PROMOTION_CREATE: 'promotion.create',
  PROMOTION_UPDATE: 'promotion.update',
  AI_CONFIG_UPDATE: 'ai.config_update',
  ASTROLOGY_CONFIG_UPDATE: 'astrology.config_update',
  CONTENT_PUBLISH: 'content.publish',
  FEATURE_FLAG_TOGGLE: 'feature_flag.toggle',
  SUPPORT_TICKET_RESOLVE: 'support.ticket_resolve',
  MAINTENANCE_MODE_TOGGLE: 'system.maintenance_mode_toggle',
  ADMIN_ROLE_CHANGE: 'admin.role_change',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditTargetType = {
  USER: 'user',
  WALLET: 'wallet',
  PAYMENT: 'payment',
  PRICING: 'pricing',
  PROMOTION: 'promotion',
  AI_PROVIDER: 'ai_provider',
  ASTROLOGY_CONFIG: 'astrology_config',
  CONTENT: 'content',
  FEATURE_FLAG: 'feature_flag',
  SUPPORT_TICKET: 'support_ticket',
  SYSTEM: 'system',
  ADMIN_USER: 'admin_user',
} as const;
export type AuditTargetType = (typeof AuditTargetType)[keyof typeof AuditTargetType];

export interface AuditLogDTO {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  reason: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 2. USER 360 OVERVIEW
// ---------------------------------------------------------------------------

export interface User360DTO {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    language: string;
    status: AccountStatus;
    createdAt: string;
    updatedAt: string;
  };
  birthProfile: {
    id: string;
    name: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: {
      name: string;
      latitude: number;
      longitude: number;
      timezone: string;
    };
    kundliSummary?: {
      rashi: string;
      nakshatra: string;
      ascendant: string;
    } | null;
  } | null;
  wallet: {
    balance: number;
    heldBalance: number;
    availableBalance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
  stats: {
    totalOrders: number;
    totalSpentPaise: number;
    totalReports: number;
    totalVoiceMinutes: number;
    totalChats: number;
    lastActiveAt: string | null;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
  }>;
  recentOrders: Array<{
    id: string;
    amount: number;
    credits: number;
    status: string;
    promoCode?: string | null;
    createdAt: string;
  }>;
  recentReports: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
  recentVoiceSessions: Array<{
    id: string;
    durationSeconds: number;
    billedCredits: number;
    status: string;
    createdAt: string;
  }>;
}

export const userActionSchema = z.object({
  action: z.enum(['suspend', 'activate', 'delete', 'adjust_wallet']),
  reason: z.string().min(3, 'A clear administrative reason is mandatory'),
  amountCredits: z.number().int().optional(),
});
export type UserActionInput = z.infer<typeof userActionSchema>;

// ---------------------------------------------------------------------------
// 3. AI CONFIGURATION & MODEL ROUTING
// ---------------------------------------------------------------------------

export interface AIProviderDTO {
  id: string;
  name: string;
  provider: 'openai' | 'gemini' | 'anthropic' | 'elevenlabs' | 'deepgram';
  type: 'llm' | 'stt' | 'tts';
  enabled: boolean;
  priority: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  costPer1kTokensPaise?: number;
}

export interface ModelRoutingRuleDTO {
  task: 'chat' | 'kundli_interpretation' | 'compatibility' | 'voice_realtime' | 'crisis_detection';
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export interface PersonaConfigDTO {
  id: string;
  name: string;
  specialty: string;
  tone: string;
  experienceYears: number;
  voiceId: string;
  systemPromptAdditions: string;
  enabled: boolean;
}

export interface SystemPromptDTO {
  version: string;
  vedicAstrologyGuidelines: string;
  outputFormatRules: string;
  crisisInterventionRules: string;
  ethicalSafeguards: string;
  updatedAt: string;
  updatedBy: string;
}

export interface LanguageConfigDTO {
  code: string;
  name: string;
  nativeName: string;
  chatEnabled: boolean;
  voiceEnabled: boolean;
  reportsEnabled: boolean;
}

// ---------------------------------------------------------------------------
// 4. ASTROLOGY ENGINE CONFIGURATION
// ---------------------------------------------------------------------------

export const AyanamshaSystem = {
  LAHIRI: 'lahiri',
  RAMAN: 'raman',
  KRISHNAMURTI: 'krishnamurti',
  FAGAN_BRADLEY: 'fagan_bradley',
} as const;
export type AyanamshaSystem = (typeof AyanamshaSystem)[keyof typeof AyanamshaSystem];

export const HouseSystem = {
  PLACIDUS: 'placidus',
  WHOLE_SIGN: 'whole_sign',
  EQUAL_HOUSE: 'equal_house',
  SRIPATI: 'sripati',
} as const;
export type HouseSystem = (typeof HouseSystem)[keyof typeof HouseSystem];

export interface AstrologyEngineConfigDTO {
  ayanamsha: AyanamshaSystem;
  houseSystem: HouseSystem;
  ephemerisProvider: 'swiss_ephemeris' | 'nasa_jpl' | 'moshier';
  ephemerisPrecision: 'standard' | 'high_precision';
  ashtakootaWeights: {
    varna: number;
    vashya: number;
    tara: number;
    yoni: number;
    grahaMaitri: number;
    gana: number;
    bhakoot: number;
    nadi: number;
  };
  manglikStrictness: 'lenient' | 'standard' | 'strict';
  sadeSatiCalculation: 'moon_sign_based' | 'exact_degree_transit';
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// 5. CONTENT MANAGEMENT (CMS)
// ---------------------------------------------------------------------------

export interface HoroscopeItemDTO {
  id: string;
  rashi: string; // Aries, Taurus, etc.
  period: 'daily' | 'weekly' | 'monthly';
  date: string; // YYYY-MM-DD
  overview: string;
  career: string;
  love: string;
  finance: string;
  luckyNumber: number;
  luckyColor: string;
  luckyTime: string;
  published: boolean;
  createdAt: string;
}

export interface VedicArticleDTO {
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  category: 'kundli' | 'planetary_transits' | 'gemstones' | 'rituals' | 'vedic_philosophy';
  author: string;
  tags: string[];
  readingTimeMinutes: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface AstrologyRemedyDTO {
  id: string;
  name: string;
  type: 'gemstone' | 'rudraksha' | 'mantra' | 'puja' | 'fasting';
  deityPlanet: string;
  problemTarget: string;
  instructions: string;
  benefits: string;
  caution: string;
  published: boolean;
}

// ---------------------------------------------------------------------------
// 6. FEATURE FLAGS & ROLLOUTS
// ---------------------------------------------------------------------------

export interface FeatureFlagDTO {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0 to 100
  targetUserSegments: string[]; // e.g. ['vip', 'new_users']
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// 7. PLATFORM ANALYTICS & EXECUTIVE KPIS
// ---------------------------------------------------------------------------

export interface ExecutiveMetricsDTO {
  grossMerchandiseValuePaise: number;
  netRevenuePaise: number;
  monthlyRecurringRevenuePaise: number;
  totalSeekers: number;
  activeSeekersToday: number;
  activeSeekersMonth: number;
  totalVoiceMinutesBilled: number;
  totalReportsCompleted: number;
  aiGatewayTotalCostPaise: number;
  supportTicketsPending: number;
}

export interface RevenueChartItemDTO {
  date: string;
  grossRevenue: number;
  netRevenue: number;
  ordersCount: number;
  creditsPurchased: number;
}

export interface VoiceMetricsDTO {
  totalCalls: number;
  completedCalls: number;
  interruptedCalls: number;
  averageDurationMinutes: number;
  totalMinutesBilled: number;
  providerCostPaise: number;
  userBilledRevenuePaise: number;
}

export interface AIUsageMetricsDTO {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  averageLatencyMs: number;
  costByProvider: Array<{
    provider: string;
    requests: number;
    tokens: number;
    costPaise: number;
  }>;
}

// ---------------------------------------------------------------------------
// 8. SUPPORT TICKETING
// ---------------------------------------------------------------------------

export const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_USER: 'waiting_user',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export interface TicketMessageDTO {
  id: string;
  senderType: 'user' | 'agent' | 'system';
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface SupportTicketDTO {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: 'billing' | 'report' | 'voice_call' | 'account' | 'astrology_inquiry';
  priority: TicketPriority;
  status: TicketStatus;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  messages: TicketMessageDTO[];
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 9. SYSTEM SETTINGS & MAINTENANCE
// ---------------------------------------------------------------------------

export interface MaintenanceModeDTO {
  enabled: boolean;
  message: string;
  allowedIpAddresses: string[];
  startedAt: string | null;
  estimatedEndAt: string | null;
}

export interface SystemSettingsDTO {
  maintenance: MaintenanceModeDTO;
  globalRateLimits: {
    publicApiRequestsPerMin: number;
    authRequestsPerMin: number;
    chatRequestsPerMin: number;
    voiceTurnsPerMin: number;
  };
  security: {
    enforceMfaForAdmins: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
  };
  systemHealth: {
    mongoDbConnected: boolean;
    redisConnected: boolean;
    aiGatewayOperational: boolean;
    razorpayWebhookOperational: boolean;
    uptimeSeconds: number;
  };
}
