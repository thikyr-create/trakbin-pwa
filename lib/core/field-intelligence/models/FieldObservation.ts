// lib/core/field-intelligence/models/FieldObservation.ts
export type ObservationKind = 'movement' | 'pickup' | 'arrival' | 'route' | 'stop' | 'evidence';
export type ObservationSource = 'gps' | 'driver_action' | 'evidence' | 'system';

export interface FieldObservation {
  id?: number;
  companyId: number;
  driverId: string;
  routeId?: string | null;
  buildingId?: string | null;
  kind: ObservationKind;
  source: ObservationSource;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  sourceEventId?: string | null;
  payload: Record<string, unknown>;
}