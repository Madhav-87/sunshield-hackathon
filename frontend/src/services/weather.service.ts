import { isMockMode, apiClient } from './apiClient';
import { demoWeather } from '../mocks/fixtures';
import type { WeatherResponse } from '../types/weather.types';

export interface WeatherQuery {
  latitude: number;
  longitude: number;
}

export function getWeather(
  query: WeatherQuery,
  options?: { signal?: AbortSignal },
): Promise<WeatherResponse> {
  if (isMockMode()) return Promise.resolve(demoWeather);
  const params = new URLSearchParams({
    latitude: `${query.latitude}`,
    longitude: `${query.longitude}`,
  });
  return apiClient.get<WeatherResponse>(`/weather?${params.toString()}`, options);
}
