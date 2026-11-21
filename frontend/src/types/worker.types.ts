export type Occupation =
  | 'CONSTRUCTION'
  | 'DELIVERY'
  | 'STREET_VENDOR'
  | 'AGRICULTURE'
  | 'ROAD_WORKER'
  | 'TRAFFIC_POLICE'
  | 'OTHER';

export type Workload = 'LIGHT' | 'MODERATE' | 'HEAVY';
export type Environment = 'DIRECT_SUNLIGHT' | 'PARTIAL_SHADE' | 'MOSTLY_SHADED';
export type AccessLevel = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
export type ScheduleFlexibility = 'FLEXIBLE' | 'FIXED' | 'EMPLOYER_CONTROLLED';
export type Language = 'en' | 'hi' | 'mr';

export interface WorkerProfile {
  occupation: Occupation;
  workload: Workload;
  environment: Environment;
  waterAccess: AccessLevel;
  shadeAccess: AccessLevel;
  scheduleFlexibility: ScheduleFlexibility;
  alternativeDutiesAvailable: boolean;
  workStart: string;
  workEnd: string;
  language: Language;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    timezone: string;
  };
}
