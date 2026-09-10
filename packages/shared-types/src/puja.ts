import { z } from 'zod';

export const PujaCategory = {
  GRAHA_SHANTI: 'GRAHA_SHANTI',
  DOSHA_NIVARAN: 'DOSHA_NIVARAN',
  HEALTH_MAHAMRITYUNJAYA: 'HEALTH_MAHAMRITYUNJAYA',
  WEALTH_LAKSHMI: 'WEALTH_LAKSHMI',
  CAREER_VICTORY: 'CAREER_VICTORY',
  RELATIONSHIPS: 'RELATIONSHIPS',
} as const;
export type PujaCategory = (typeof PujaCategory)[keyof typeof PujaCategory];

export const PujaTier = {
  STANDARD: 'STANDARD',
  SHODASHA_UPCHARA: 'SHODASHA_UPCHARA',
  MAHA_ANUSHTHAN: 'MAHA_ANUSHTHAN',
} as const;
export type PujaTier = (typeof PujaTier)[keyof typeof PujaTier];

export const PujaOrderStatus = {
  CONFIRMED: 'CONFIRMED',
  SANKALPA_RECORDED: 'SANKALPA_RECORDED',
  LIVE_PERFORMED: 'LIVE_PERFORMED',
  PRASAD_DISPATCHED: 'PRASAD_DISPATCHED',
  COMPLETED: 'COMPLETED',
} as const;
export type PujaOrderStatus = (typeof PujaOrderStatus)[keyof typeof PujaOrderStatus];

export interface PujaTierOption {
  tier: PujaTier;
  title: string;
  priceINR: number;
  creditsRequired: number;
  panditCount: number;
  durationMinutes: number;
  samagriInclusions: string[];
}

export interface PujaItemDTO {
  id: string;
  title: string;
  sanskritTitle: string;
  category: PujaCategory;
  deity: string;
  templeName: string;
  templeLocation: string;
  description: string;
  vedicSignificance: string;
  benefits: string[];
  auspiciousUpcomingTithi: string;
  imageUrl: string;
  isLiveStreamAvailable: boolean;
  isPrasadDeliveryAvailable: boolean;
  tiers: PujaTierOption[];
}

export const bookPujaSchema = z.object({
  pujaId: z.string().trim().min(1),
  tier: z.nativeEnum(PujaTier),
  sankalpaName: z.string().trim().min(2).max(100),
  gotra: z.string().trim().min(2).max(50).default('Kashyapa'),
  nakshatra: z.string().trim().min(2).max(50),
  dateOfBirth: z.string().trim().optional(),
  prayerIntent: z.string().trim().min(5).max(500),
  isPrasadDeliveryRequested: z.boolean().default(true),
  deliveryAddress: z
    .object({
      fullAddress: z.string().trim().min(5).max(300),
      city: z.string().trim().min(2).max(100),
      state: z.string().trim().min(2).max(100),
      pincode: z.string().trim().min(5).max(10),
      contactPhone: z.string().trim().min(10).max(15),
    })
    .optional(),
});
export type BookPujaInput = z.infer<typeof bookPujaSchema>;

export interface PujaOrderDTO {
  id: string;
  userId: string;
  pujaId: string;
  pujaTitle: string;
  templeName: string;
  templeLocation: string;
  tier: PujaTier;
  amountINR: number;
  creditsDeducted: number;
  sankalpaName: string;
  gotra: string;
  nakshatra: string;
  prayerIntent: string;
  status: PujaOrderStatus;
  scheduledDate: string;
  liveStreamUrl?: string | null;
  prasadTrackingNumber?: string | null;
  prasadCourier?: string | null;
  isPrasadDeliveryRequested: boolean;
  createdAt: string;
  updatedAt: string;
}
