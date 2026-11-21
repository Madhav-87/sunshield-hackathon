import { isMockMode, apiClient } from './apiClient';
import { demoPlan } from '../mocks/fixtures';
import type { ProtectionPlanResponse } from '../types/protection.types';
import type { WorkerProfile } from '../types/worker.types';

export function getProtectionPlan(
  profile: WorkerProfile,
  options?: { signal?: AbortSignal },
): Promise<ProtectionPlanResponse> {
  if (isMockMode()) return Promise.resolve(demoPlan);
  return apiClient.post<ProtectionPlanResponse>('/protection/plan', { profile }, options);
}
