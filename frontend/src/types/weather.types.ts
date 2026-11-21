import type { DataMode } from './api.types';

export interface WeatherMetrics {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  observedAt: string;
}

export interface WeatherResponse {
  dataMode: DataMode;
  source: string;
  timezone: string;
  fetchedAt: string;
  current: WeatherMetrics;
  hourly: Array<WeatherMetrics & { time: string }>;
}
