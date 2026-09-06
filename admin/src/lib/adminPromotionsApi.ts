import {
  CreatePromotionInput,
  PromotionAnalyticsDTO,
  PromotionDTO,
  PromotionStatus,
  ReferralRecordDTO,
  UpdatePromotionInput,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export const adminPromotionsApi = {
  async listPromotions(filters?: {
    status?: PromotionStatus;
    isActive?: boolean;
    limit?: number;
  }): Promise<{ items: PromotionDTO[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<{ items: PromotionDTO[]; total: number }>(`/api/v1/admin/promotions${query}`);
    return { items: res.items || [], total: res.total || 0 };
  },

  async createPromotion(input: CreatePromotionInput): Promise<PromotionDTO> {
    return apiRequest<PromotionDTO>('/api/v1/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getPromotion(id: string): Promise<PromotionDTO> {
    return apiRequest<PromotionDTO>(`/api/v1/admin/promotions/${id}`);
  },

  async updatePromotion(id: string, input: UpdatePromotionInput): Promise<PromotionDTO> {
    return apiRequest<PromotionDTO>(`/api/v1/admin/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async updateStatus(id: string, status: PromotionStatus): Promise<PromotionDTO> {
    return apiRequest<PromotionDTO>(`/api/v1/admin/promotions/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  async getAnalytics(): Promise<PromotionAnalyticsDTO> {
    return apiRequest<PromotionAnalyticsDTO>('/api/v1/admin/promotions/analytics');
  },

  async listReferrals(): Promise<ReferralRecordDTO[]> {
    return apiRequest<ReferralRecordDTO[]>('/api/v1/admin/promotions/referrals');
  },
};
