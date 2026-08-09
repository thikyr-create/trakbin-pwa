// lib/core/field-intelligence/models/ArrivalObservation.ts
export interface ArrivalObservation {
  buildingId: string;
  arrivedAt: string;
  distanceFromExpectedM: number;
  scheduledAt?: string | null;
  gpsAccuracy?: number | null;
}