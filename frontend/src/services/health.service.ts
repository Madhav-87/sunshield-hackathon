import { apiClient, isMockMode } from './apiClient';

export function checkBackendHealth(options?: { signal?: AbortSignal }): Promise<number> {
  if (isMockMode()) return Promise.resolve(200);
  return apiClient.getStatus('/health', options);
}
