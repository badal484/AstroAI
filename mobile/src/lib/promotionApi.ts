import {
  ClaimReferralCodeInput,
  PromotionDTO,
  PromotionValidationResultDTO,
  ReferralRecordDTO,
  UserReferralSummaryDTO,
  ValidatePromoCodeInput,
} from '@astroai/shared-types';
import { apiClient } from './apiClient';

export const promotionApi = {
  async validatePromoCode(input: ValidatePromoCodeInput): Promise<PromotionValidationResultDTO> {
    const res = await apiClient.post<PromotionValidationResultDTO>('/promotions/validate', input);
    return res.data;
  },

  async getAvailableOffers(): Promise<PromotionDTO[]> {
    const res = await apiClient.get<PromotionDTO[]>('/promotions/offers');
    return res.data;
  },

  async getUserReferralSummary(): Promise<UserReferralSummaryDTO> {
    const res = await apiClient.get<UserReferralSummaryDTO>('/promotions/referral');
    return res.data;
  },

  async claimReferralCode(input: ClaimReferralCodeInput): Promise<ReferralRecordDTO> {
    const res = await apiClient.post<ReferralRecordDTO>('/promotions/referral/claim', input);
    return res.data;
  },
};
