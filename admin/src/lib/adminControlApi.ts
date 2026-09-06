import {
  AITechnicalAnalyticsDTO,
  AIProviderDTO,
  AstrologyEngineConfigDTO,
  AstrologyRemedyDTO,
  AuditLogDTO,
  ExecutiveMetricsDTO,
  FeatureFlagDTO,
  FinancialAnalyticsDTO,
  HoroscopeItemDTO,
  LanguageConfigDTO,
  ModelRoutingRuleDTO,
  PaginatedAnalyticsEventsDTO,
  PersonaConfigDTO,
  ProductAnalyticsDTO,
  RevenueChartItemDTO,
  SupportTicketDTO,
  SystemSettingsDTO,
  User360DTO,
  UserActionInput,
  VedicArticleDTO,
} from '@astroai/shared-types';
import { apiGet, apiPost, apiPut } from './apiClient';

export const adminControlApi = {
  // User 360 & Operations
  getUser360: (userId: string) => apiGet<User360DTO>(`/api/v1/admin/users/${userId}/overview`),
  executeUserAction: (userId: string, input: UserActionInput) =>
    apiPost<User360DTO>(`/api/v1/admin/users/${userId}/action`, input),

  // Audit Logs
  listAuditLogs: (params?: {
    adminId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.adminId) qs.set('adminId', params.adminId);
    if (params?.action) qs.set('action', params.action);
    if (params?.targetType) qs.set('targetType', params.targetType);
    if (params?.targetId) qs.set('targetId', params.targetId);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<AuditLogDTO[]>(`/api/v1/admin/audit-logs${query}`);
  },

  // AI Configuration
  getAIConfig: () =>
    apiGet<{
      providers: AIProviderDTO[];
      routingRules: ModelRoutingRuleDTO[];
      personas: PersonaConfigDTO[];
      systemPrompt: {
        version: string;
        vedicAstrologyGuidelines: string;
        outputFormatRules: string;
        crisisInterventionRules: string;
        ethicalSafeguards: string;
        updatedAt: string;
      };
      languages: LanguageConfigDTO[];
    }>('/api/v1/admin/ai/config'),

  // Astrology Engine Configuration
  getAstrologyConfig: () => apiGet<AstrologyEngineConfigDTO>('/api/v1/admin/astrology/config'),
  updateAstrologyConfig: (config: Partial<AstrologyEngineConfigDTO>, reason: string) =>
    apiPut<AstrologyEngineConfigDTO>('/api/v1/admin/astrology/config', { config, reason }),

  // Content Management
  listHoroscopes: () => apiGet<HoroscopeItemDTO[]>('/api/v1/admin/content/horoscopes'),
  listArticles: () => apiGet<VedicArticleDTO[]>('/api/v1/admin/content/articles'),
  listRemedies: () => apiGet<AstrologyRemedyDTO[]>('/api/v1/admin/content/remedies'),

  // Feature Flags
  listFeatureFlags: () => apiGet<FeatureFlagDTO[]>('/api/v1/admin/feature-flags'),
  toggleFeatureFlag: (key: string, enabled: boolean, reason: string) =>
    apiPost<FeatureFlagDTO>(`/api/v1/admin/feature-flags/${key}/toggle`, { enabled, reason }),

  // Executive Analytics
  getExecutiveMetrics: () => apiGet<ExecutiveMetricsDTO>('/api/v1/admin/analytics/overview'),
  getRevenueChart: () => apiGet<RevenueChartItemDTO[]>('/api/v1/admin/analytics/revenue'),

  // Support Helpdesk
  listSupportTickets: (_params?: { status?: string; priority?: string; userId?: string }) =>
    apiGet<SupportTicketDTO[]>('/api/v1/admin/support/tickets'),
  replySupportTicket: (ticketId: string, body: string) =>
    apiPost<SupportTicketDTO>(`/api/v1/admin/support/tickets/${ticketId}/reply`, { body }),
  resolveSupportTicket: (ticketId: string, resolutionNotes: string) =>
    apiPost<SupportTicketDTO>(`/api/v1/admin/support/tickets/${ticketId}/resolve`, { resolutionNotes }),

  // System Settings & Maintenance
  getSystemSettings: () => apiGet<SystemSettingsDTO>('/api/v1/admin/settings'),
  toggleMaintenanceMode: (enabled: boolean, message: string, reason: string) =>
    apiPost<SystemSettingsDTO>('/api/v1/admin/settings/maintenance', { enabled, message, reason }),

  // Admin User Accounts
  listAdminUsers: () =>
    apiGet<Array<{ id: string; email: string; name: string; role: string; status: string; createdAt: string }>>(
      '/api/v1/admin/admin-users',
    ),
  createAdminUser: (data: { email: string; name: string; role: string; password?: string; reason: string }) =>
    apiPost<{ id: string; email: string; name: string; role: string }>('/api/v1/admin/admin-users', data),

  // Deep Product, Financial & AI Analytics
  getProductAnalytics: (range = '30d') =>
    apiGet<ProductAnalyticsDTO>(`/api/v1/admin/analytics/product?range=${range}`),
  getFinancialAnalytics: (range = '30d') =>
    apiGet<FinancialAnalyticsDTO>(`/api/v1/admin/analytics/financial?range=${range}`),
  getAITechnicalAnalytics: (range = '30d') =>
    apiGet<AITechnicalAnalyticsDTO>(`/api/v1/admin/analytics/ai?range=${range}`),
  getAnalyticsEvents: (params?: { category?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    return apiGet<PaginatedAnalyticsEventsDTO>(`/api/v1/admin/analytics/events?${qs.toString()}`);
  },
};
