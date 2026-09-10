import type {
  BookPujaInput,
  DashaTimelineResult,
  PujaItemDTO,
  PujaOrderDTO,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export interface GetPujaCatalogResponse {
  items: PujaItemDTO[];
}

export interface GetPujaOrdersResponse {
  orders: PujaOrderDTO[];
}

export async function fetchPujaCatalog(category?: string): Promise<PujaItemDTO[]> {
  const query = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
  const res = await apiRequest<GetPujaCatalogResponse>(`/api/v1/puja/catalog${query}`, {
    method: 'GET',
  });
  return res.items;
}

export async function fetchPujaById(id: string): Promise<PujaItemDTO> {
  const res = await apiRequest<PujaItemDTO>(`/api/v1/puja/catalog/${id}`, {
    method: 'GET',
  });
  return res;
}

export async function bookPuja(input: BookPujaInput): Promise<PujaOrderDTO> {
  const res = await apiRequest<PujaOrderDTO>('/api/v1/puja/book', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res;
}

export async function fetchMyPujaOrders(): Promise<PujaOrderDTO[]> {
  const res = await apiRequest<GetPujaOrdersResponse>('/api/v1/puja/my-orders', {
    method: 'GET',
  });
  return res.orders;
}

export async function fetchDashaTimeline(birthProfileId?: string): Promise<DashaTimelineResult> {
  const query = birthProfileId ? `?birthProfileId=${encodeURIComponent(birthProfileId)}` : '';
  const res = await apiRequest<DashaTimelineResult>(`/api/v1/astrology/dasha-timeline${query}`, {
    method: 'GET',
  });
  return res;
}
