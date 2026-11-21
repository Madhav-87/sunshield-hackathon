import type { HeatAssessmentResponse } from '../types/api.types';
import type { ProtectionPlanResponse } from '../types/protection.types';
import type { SafeZonesResponse } from '../types/safezone.types';
import type { WeatherResponse } from '../types/weather.types';

// These values are intentionally SIMULATION/DEMO and must never be presented as live conditions.
export const demoWeather: WeatherResponse = {
  dataMode: 'SIMULATION',
  source: 'SunShield demonstration fixture',
  timezone: 'Asia/Kolkata',
  fetchedAt: '2026-11-21T09:00:00+05:30',
  current: {
    temperatureC: 42,
    apparentTemperatureC: 45,
    humidityPercent: 38,
    windSpeedKmh: 12,
    observedAt: '2026-11-21T09:00:00+05:30',
  },
  hourly: [34, 37, 39, 42, 44, 43, 41, 39, 36, 34].map((temperatureC, index) => ({
    time: `2026-11-21T${String(index + 9).padStart(2, '0')}:00:00+05:30`,
    temperatureC,
    apparentTemperatureC: temperatureC + 3,
    humidityPercent: 38,
    windSpeedKmh: 12,
    observedAt: `2026-11-21T${String(index + 9).padStart(2, '0')}:00:00+05:30`,
  })),
};

export const demoAssessment: HeatAssessmentResponse = {
  dataMode: 'SIMULATION',
  assessment: {
    advisoryLevel: 'UNKNOWN',
    engineVersion: 'demo-no-engine',
    factors: [],
    recommendations: [],
    medicalValidation: false,
    disclaimerCode: 'DEMONSTRATION_DATA_ONLY',
  },
};

export const demoPlan: ProtectionPlanResponse = {
  dataMode: 'SIMULATION',
  timezone: 'Asia/Kolkata',
  workDate: '2026-11-21',
  workStart: '09:00',
  workEnd: '18:00',
  timeline: [],
  disclaimerCode: 'DEMONSTRATION_DATA_ONLY',
};

export const demoSafeZones: SafeZonesResponse = {
  distanceMethod: 'STRAIGHT_LINE',
  facilities: [
    {
      id: 'demo-cooling-hub-1',
      name: 'Shivajinagar Metro Cooling Hub',
      category: 'COOLING_CENTRE',
      latitude: 18.5308,
      longitude: 73.8475,
      distanceKm: 0.25,
      waterAvailable: true,
      shadeAvailable: true,
      verificationStatus: 'DEMO',
      lastVerifiedAt: null,
    },
    {
      id: 'demo-shaded-pavilion-2',
      name: 'Sambhaji Park Shaded Pavilion',
      category: 'SHADED_REST',
      latitude: 18.5197,
      longitude: 73.8404,
      distanceKm: 0.48,
      waterAvailable: false,
      shadeAvailable: true,
      verificationStatus: 'DEMO',
      lastVerifiedAt: null,
    },
    {
      id: 'demo-water-kiosk-3',
      name: 'Deccan Corner Water Kiosk',
      category: 'DRINKING_WATER',
      latitude: 18.5157,
      longitude: 73.8372,
      distanceKm: 0.62,
      waterAvailable: true,
      shadeAvailable: false,
      verificationStatus: 'DEMO',
      lastVerifiedAt: null,
    },
  ],
};
