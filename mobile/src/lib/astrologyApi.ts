import type {
  AnalyzePalmInput,
  AstrologyChart,
  CastPrashnaInput,
  DailyDispatchResult,
  PalmistryAnalysisResult,
  PrashnaChartResult,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function getAstrologyChart(birthProfileId: string): Promise<AstrologyChart> {
  return apiRequest(`/api/v1/astrology/chart/${birthProfileId}`);
}

export function getCosmicRadar(): Promise<any> {
  return apiRequest('/api/v1/astrology/cosmic-radar');
}

export function analyzePalm(input: AnalyzePalmInput): Promise<PalmistryAnalysisResult> {
  return apiRequest('/api/v1/astrology/palmistry-analyze', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function castPrashna(input: CastPrashnaInput): Promise<PrashnaChartResult> {
  return apiRequest('/api/v1/astrology/prashna-cast', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getDailyDispatch(date?: string): Promise<DailyDispatchResult> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest(`/api/v1/horoscope/daily-dispatch${query}`);
}
