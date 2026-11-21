import { AvailabilityStatus, SafeZoneCategory, VerificationStatus } from "../../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { calculateDistanceKm } from "../utils/haversine.js";

const MAX_SEARCH_RESULTS = 500;

export type SafeZoneSearch = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: SafeZoneCategory;
  availabilityStatus?: AvailabilityStatus;
  includeDemo?: boolean;
  limit?: number;
};

export async function searchSafeZones(input: SafeZoneSearch) {
  const radiusKm = input.radiusKm ?? 5;
  if (!Number.isFinite(radiusKm) || radiusKm < 0 || radiusKm > 100) {
    throw new RangeError("radiusKm must be between 0 and 100");
  }
  calculateDistanceKm(input.latitude, input.longitude, input.latitude, input.longitude);
  const limit = Math.max(1, Math.min(input.limit ?? 100, MAX_SEARCH_RESULTS));
  const records = await prisma.safeZone.findMany({
    where: {
      verificationStatus: {
        notIn: input.includeDemo
          ? [VerificationStatus.REJECTED]
          : [VerificationStatus.REJECTED, VerificationStatus.DEMO],
      },
      ...(input.category ? { category: input.category } : {}),
      ...(input.availabilityStatus ? { availabilityStatus: input.availabilityStatus } : {}),
    },
    take: MAX_SEARCH_RESULTS,
  });

  return records.map((zone) => ({
    id: zone.id,
    name: zone.name,
    category: zone.category,
    latitude: zone.latitude,
    longitude: zone.longitude,
    distanceKm: calculateDistanceKm(input.latitude, input.longitude, zone.latitude, zone.longitude),
    waterAvailable: zone.waterAvailable,
    shadeAvailable: zone.shadeAvailable,
    verificationStatus: zone.verificationStatus,
    availabilityStatus: zone.availabilityStatus,
    lastVerifiedAt: zone.lastVerifiedAt,
  }))
    .filter((zone) => zone.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export async function getSafeZone(id: string) {
  return prisma.safeZone.findFirst({ where: { id, verificationStatus: { not: VerificationStatus.REJECTED } } });
}

export type NewSafeZoneInput = {
  name: string;
  category: SafeZoneCategory;
  latitude: number;
  longitude: number;
  address: string;
  waterAvailable?: boolean;
  shadeAvailable?: boolean;
  seatingAvailable?: boolean;
  openingHours?: string | null;
};

export async function submitSafeZone(input: NewSafeZoneInput) {
  return prisma.safeZone.create({
    data: {
      ...input,
      verificationStatus: VerificationStatus.PENDING,
      availabilityStatus: AvailabilityStatus.UNKNOWN,
      lastVerifiedAt: null,
    },
  });
}
