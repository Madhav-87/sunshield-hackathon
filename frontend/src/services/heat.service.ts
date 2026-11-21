import { isMockMode, apiClient } from './apiClient';
import { demoAssessment } from '../mocks/fixtures';
import type { HeatAssessmentResponse } from '../types/api.types';
import type { WorkerProfile } from '../types/worker.types';

export function assessHeat(
  profile: WorkerProfile,
  options?: { signal?: AbortSignal },
): Promise<HeatAssessmentResponse> {
  if (isMockMode()) return Promise.resolve(demoAssessment);
  return apiClient.post<HeatAssessmentResponse>('/heat/assess', { profile }, options);
}
