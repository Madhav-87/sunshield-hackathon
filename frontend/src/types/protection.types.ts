import type { AdvisoryLevel, DataMode } from './api.types';

export interface ProtectionPeriod {
  start: string;
  end: string;
  advisoryLevel: AdvisoryLevel;
  temperatureC: number | null;
  factors: unknown[];
  recommendationCodes: string[];
}

export interface ProtectionPlanResponse {
  dataMode: DataMode;
  timezone: string;
  workDate: string;
  workStart: string;
  workEnd: string;
  timeline: ProtectionPeriod[];
  disclaimerCode: string;
}
