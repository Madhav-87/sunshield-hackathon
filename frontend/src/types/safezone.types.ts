import type { VerificationStatus } from './api.types';

export interface SafeZone {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  waterAvailable: boolean;
  shadeAvailable: boolean;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string | null;
}

export interface SafeZonesResponse {
  distanceMethod: 'STRAIGHT_LINE';
  facilities: SafeZone[];
}
