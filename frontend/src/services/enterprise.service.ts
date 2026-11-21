import { apiClient, ContractUnavailableError, isMockMode } from './apiClient';

export function getEnterpriseDashboard<T = unknown>(options?: {
  signal?: AbortSignal;
}): Promise<T> {
  if (isMockMode())
    return Promise.reject(new ContractUnavailableError('GET /enterprise/dashboard'));
  return apiClient.get<T>('/enterprise/dashboard', options);
}

export function createEnterprisePlan(): never {
  throw new ContractUnavailableError('POST /enterprise/plan');
}
