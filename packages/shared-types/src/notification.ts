import { z } from 'zod';

export const NotificationChannel = {
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationCategory = {
  TRANSACTIONAL: 'transactional',
  HOROSCOPE: 'horoscope',
  CONSULTATION: 'consultation',
  MARKETING: 'marketing',
  LIFECYCLE: 'lifecycle',
} as const;
export type NotificationCategory = (typeof NotificationCategory)[keyof typeof NotificationCategory];

export const NotificationEventType = {
  USER_REGISTRATION: 'user_registration',
  BIRTH_PROFILE_COMPLETION: 'birth_profile_completion',
  FIRST_CHAT: 'first_chat',
  LOW_WALLET_BALANCE: 'low_wallet_balance',
  REPORT_READY: 'report_ready',
  HOROSCOPE_READY: 'horoscope_ready',
  PURCHASE: 'purchase',
  INACTIVITY: 'inactivity',
  BIRTHDAY: 'birthday',
  PROMOTIONAL_CAMPAIGN: 'promotional_campaign',
  REFERRAL_REWARD: 'referral_reward',
} as const;
export type NotificationEventType = (typeof NotificationEventType)[keyof typeof NotificationEventType];

export const NotificationDeliveryStatus = {
  QUEUED: 'queued',
  DEFERRED_QUIET_HOURS: 'deferred_quiet_hours',
  SENDING: 'sending',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  SUPPRESSED_OPT_OUT: 'suppressed_opt_out',
  SUPPRESSED_FREQUENCY_CAP: 'suppressed_frequency_cap',
  SUPPRESSED_DUPLICATE: 'suppressed_duplicate',
} as const;
export type NotificationDeliveryStatus =
  (typeof NotificationDeliveryStatus)[keyof typeof NotificationDeliveryStatus];

export const CampaignStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const AudienceSegment = {
  ALL_USERS: 'all_users',
  COMPLETED_PROFILE: 'completed_profile',
  INACTIVE_7_DAYS: 'inactive_7_days',
  LOW_BALANCE: 'low_balance',
  HAS_PURCHASED: 'has_purchased',
  ZODIAC_SIGN: 'zodiac_sign',
} as const;
export type AudienceSegment = (typeof AudienceSegment)[keyof typeof AudienceSegment];

// User Notification Preferences
export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number; // 0 - 23
  startMinute: number; // 0 - 59
  endHour: number; // 0 - 23
  endMinute: number; // 0 - 59
}

export interface FrequencyCapConfig {
  maxMarketingPerDay: number;
  maxMarketingPerWeek: number;
}

export interface PushTokenRecord {
  token: string;
  deviceType: 'ios' | 'android' | 'web';
  updatedAt: string;
}

export interface UserNotificationPreferenceDTO {
  userId: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  categories: {
    transactional: boolean;
    horoscope: boolean;
    consultation: boolean;
    marketing: boolean;
    lifecycle: boolean;
  };
  language: string;
  timezone: string;
  quietHours: QuietHoursConfig;
  frequencyCap: FrequencyCapConfig;
  optedOut: boolean;
  pushTokensCount: number;
  updatedAt: string;
}

export const updateNotificationPreferenceSchema = z.object({
  channels: z
    .object({
      push: z.boolean().optional(),
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      inApp: z.boolean().optional(),
    })
    .optional(),
  categories: z
    .object({
      transactional: z.boolean().optional(),
      horoscope: z.boolean().optional(),
      consultation: z.boolean().optional(),
      marketing: z.boolean().optional(),
      lifecycle: z.boolean().optional(),
    })
    .optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).optional(),
  quietHours: z
    .object({
      enabled: z.boolean(),
      startHour: z.number().int().min(0).max(23),
      startMinute: z.number().int().min(0).max(59),
      endHour: z.number().int().min(0).max(23),
      endMinute: z.number().int().min(0).max(59),
    })
    .optional(),
  frequencyCap: z
    .object({
      maxMarketingPerDay: z.number().int().min(0).max(10),
      maxMarketingPerWeek: z.number().int().min(0).max(50),
    })
    .optional(),
  optedOut: z.boolean().optional(),
});
export type UpdateNotificationPreferenceInput = z.infer<typeof updateNotificationPreferenceSchema>;

export const registerPushTokenSchema = z.object({
  token: z.string().min(1),
  deviceType: z.enum(['ios', 'android', 'web']).default('android'),
});
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

// Template Schemas
export interface TemplateLocaleContent {
  title: string;
  body: string;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationTemplateDTO {
  id: string;
  templateCode: string;
  name: string;
  description?: string;
  eventType: NotificationEventType;
  category: NotificationCategory;
  channels: NotificationChannel[];
  locales: Record<string, TemplateLocaleContent>;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createNotificationTemplateSchema = z.object({
  templateCode: z.string().min(2).max(64),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  eventType: z.nativeEnum(NotificationEventType),
  category: z.nativeEnum(NotificationCategory),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1),
  locales: z.record(
    z.string(),
    z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      actionUrl: z.string().optional(),
      actionText: z.string().optional(),
    }),
  ),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});
export type CreateNotificationTemplateInput = z.infer<typeof createNotificationTemplateSchema>;

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();
export type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>;

// Campaign Schemas
export interface CampaignStats {
  totalTargeted: number;
  sent: number;
  delivered: number;
  failed: number;
  suppressed: number;
}

export interface NotificationCampaignDTO {
  id: string;
  name: string;
  description?: string;
  templateCode: string;
  audienceSegment: AudienceSegment;
  audienceFilters?: {
    zodiacSign?: string;
    inactiveDays?: number;
    maxBalance?: number;
  };
  targetLanguage?: string;
  channels: NotificationChannel[];
  status: CampaignStatus;
  scheduledAt?: string | null;
  executedAt?: string | null;
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

export const createCampaignSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  templateCode: z.string().min(1),
  audienceSegment: z.nativeEnum(AudienceSegment),
  audienceFilters: z
    .object({
      zodiacSign: z.string().optional(),
      inactiveDays: z.number().int().min(1).optional(),
      maxBalance: z.number().int().min(0).optional(),
    })
    .optional(),
  targetLanguage: z.string().optional(),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1),
  scheduledAt: z.string().datetime().optional().nullable(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = createCampaignSchema.partial();
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

// Delivery Log / History Schemas
export interface NotificationLogDTO {
  id: string;
  userId: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  eventType: NotificationEventType;
  templateCode?: string;
  campaignId?: string;
  recipient: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  status: NotificationDeliveryStatus;
  deduplicationKey?: string;
  retryCount: number;
  scheduledFor?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  failedReason?: string | null;
  createdAt: string;
}

export interface NotificationStatsDTO {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalSuppressed: number;
  byChannel: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}
