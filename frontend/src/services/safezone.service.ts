import { isMockMode, apiClient, ContractUnavailableError } from './apiClient';
import { demoSafeZones } from '../mocks/fixtures';
import type { SafeZonesResponse } from '../types/safezone.types';

export interface SafeZoneQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  includeDemo?: boolean;
}

export function getSafeZones(
  query: SafeZoneQuery,
  options?: { signal?: AbortSignal },
): Promise<SafeZonesResponse> {
  if (isMockMode()) return Promise.resolve(demoSafeZones);
  const params = new URLSearchParams({
    latitude: `${query.latitude}`,
    longitude: `${query.longitude}`,
    radiusKm: `${query.radiusKm ?? 5}`,
    includeDemo: `${query.includeDemo ?? false}`,
  });
  return apiClient.get<SafeZonesResponse>(`/safe-zones?${params.toString()}`, options);
}

export function getSafeZone(id: string, options?: { signal?: AbortSignal }): Promise<unknown> {
  if (isMockMode()) {
    const facility = demoSafeZones.facilities.find((item) => item.id === id);
    return facility
      ? Promise.resolve(facility)
      : Promise.reject(new Error('Demonstration facility was not found.'));
  }
  return apiClient.get<unknown>(`/safe-zones/${encodeURIComponent(id)}`, options);
}

export function submitSafeZone(): never {
  throw new ContractUnavailableError('POST /safe-zones');
}

export function reportSafeZoneAvailability(): never {
  throw new ContractUnavailableError('POST /safe-zones/{id}/reports');
}
