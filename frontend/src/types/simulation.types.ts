import type { WorkerProfile } from './worker.types';

/** UI-only HeatLab inputs. This is not the backend request contract. */
export interface SimulationScenario {
  worker: WorkerProfile;
  conditions: {
    temperatureC: number;
    humidityPercent: number;
    windSpeedKmh: number;
  };
}

/** Explicit demo presentation model, not an API response. */
export interface SimulationViewResult {
  source: 'DEMO';
  advisoryLabel: 'UNKNOWN';
  factorCount: 0;
  recommendations: string[];
  message: string;
}
