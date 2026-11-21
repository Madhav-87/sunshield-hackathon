import { ContractUnavailableError, isMockMode } from './apiClient';
import type { SimulationScenario, SimulationViewResult } from '../types/simulation.types';

export function evaluateSimulation(
  _scenario: SimulationScenario,
  _options?: { signal?: AbortSignal },
): Promise<SimulationViewResult> {
  if (isMockMode()) {
    return Promise.resolve({
      source: 'DEMO',
      advisoryLabel: 'UNKNOWN',
      factorCount: 0,
      recommendations: [],
      message: 'The demo service does not calculate heat risk or return safety recommendations.',
    });
  }
  void _scenario;
  void _options;
  return Promise.reject(new ContractUnavailableError('POST /simulation/evaluate'));
}
