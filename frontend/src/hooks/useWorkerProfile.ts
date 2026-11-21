import { useEffect, useMemo } from 'react';
import type { Language, Occupation, WorkerProfile } from '../types/worker.types';
import { state } from '../legacyMarkup';

const STORAGE_KEY = 'sunshield.workerProfile';

const roleToOccupation: Record<string, Occupation> = {
  'Construction worker': 'CONSTRUCTION',
  'Delivery rider': 'DELIVERY',
  'Street vendor': 'STREET_VENDOR',
  'Agricultural worker': 'AGRICULTURE',
  'Road maintenance worker': 'ROAD_WORKER',
  'Traffic police personnel': 'TRAFFIC_POLICE',
  'Other outdoor worker': 'OTHER',
};
const occupationToRole = Object.fromEntries(
  Object.entries(roleToOccupation).map(([role, occupation]) => [occupation, role]),
);

const validLanguages = new Set<Language>(['en', 'hi', 'mr']);
const isEnumValue = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && allowed.includes(value as T);

export function restoreWorkerProfile(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<WorkerProfile>;
    if (saved.occupation && occupationToRole[saved.occupation])
      state.role = occupationToRole[saved.occupation];
    if (isEnumValue(saved.workload, ['LIGHT', 'MODERATE', 'HEAVY'] as const))
      state.workload = saved.workload[0] + saved.workload.slice(1).toLowerCase();
    if (
      isEnumValue(saved.environment, ['DIRECT_SUNLIGHT', 'PARTIAL_SHADE', 'MOSTLY_SHADED'] as const)
    ) {
      state.environment = {
        DIRECT_SUNLIGHT: 'Direct Sunlight',
        PARTIAL_SHADE: 'Partial Shade',
        MOSTLY_SHADED: 'Mostly Shaded',
      }[saved.environment];
    }
    if (isEnumValue(saved.waterAccess, ['AVAILABLE', 'LIMITED', 'UNAVAILABLE'] as const)) {
      state.waterAccess = saved.waterAccess;
      state.water = saved.waterAccess !== 'UNAVAILABLE';
    }
    if (isEnumValue(saved.shadeAccess, ['AVAILABLE', 'LIMITED', 'UNAVAILABLE'] as const)) {
      state.shadeAccess = saved.shadeAccess;
      state.shade = saved.shadeAccess !== 'UNAVAILABLE';
    }
    if (
      isEnumValue(saved.scheduleFlexibility, ['FLEXIBLE', 'FIXED', 'EMPLOYER_CONTROLLED'] as const)
    ) {
      state.scheduleFlexibility = saved.scheduleFlexibility;
    }
    if (typeof saved.language === 'string' && validLanguages.has(saved.language as Language))
      state.language = saved.language as Language;
    if (saved.workStart && /^([01]\d|2[0-3]):[0-5]\d$/.test(saved.workStart))
      state.workStart = saved.workStart;
    if (saved.workEnd && /^([01]\d|2[0-3]):[0-5]\d$/.test(saved.workEnd))
      state.workEnd = saved.workEnd;
    if (
      saved.location &&
      Number.isFinite(saved.location.latitude) &&
      saved.location.latitude >= -90 &&
      saved.location.latitude <= 90 &&
      Number.isFinite(saved.location.longitude) &&
      saved.location.longitude >= -180 &&
      saved.location.longitude <= 180 &&
      typeof saved.location.city === 'string' &&
      typeof saved.location.timezone === 'string'
    ) {
      state.location = saved.location;
    }
    if (saved.alternativeDutiesAvailable !== undefined)
      state.alternativeDutiesAvailable = saved.alternativeDutiesAvailable;
  } catch {
    // A malformed local preference is ignored; the worker can set it again.
  }
}

export function useWorkerProfile(version: number): WorkerProfile {
  const profile = useMemo<WorkerProfile>(() => {
    void version;
    return {
      occupation: roleToOccupation[state.role] ?? 'OTHER',
      workload: state.workload.toUpperCase() as WorkerProfile['workload'],
      environment:
        (
          {
            'Direct Sunlight': 'DIRECT_SUNLIGHT',
            'Partial Shade': 'PARTIAL_SHADE',
            'Mostly Shaded': 'MOSTLY_SHADED',
          } as const
        )[state.environment as 'Direct Sunlight' | 'Partial Shade' | 'Mostly Shaded'] ??
        'DIRECT_SUNLIGHT',
      waterAccess: (state.waterAccess ??
        (state.water ? 'AVAILABLE' : 'UNAVAILABLE')) as WorkerProfile['waterAccess'],
      shadeAccess: (state.shadeAccess ??
        (state.shade ? 'AVAILABLE' : 'UNAVAILABLE')) as WorkerProfile['shadeAccess'],
      scheduleFlexibility: (state.scheduleFlexibility ??
        'EMPLOYER_CONTROLLED') as WorkerProfile['scheduleFlexibility'],
      alternativeDutiesAvailable: state.alternativeDutiesAvailable ?? false,
      workStart: state.workStart ?? '09:00',
      workEnd: state.workEnd ?? '18:00',
      language: validLanguages.has(state.language as Language)
        ? (state.language as Language)
        : 'en',
      location: state.location ?? {
        latitude: 18.5204,
        longitude: 73.8567,
        city: 'Pune',
        timezone: 'Asia/Kolkata',
      },
      // The source markup is deliberately preserved as a compatibility layer; the React shell
      // increments this version only when a saved worker preference changes.
    };
  }, [version]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Local storage may be unavailable in private browsing; the UI remains usable.
    }
  }, [profile]);

  return profile;
}
