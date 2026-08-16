// lib/core/field-intelligence/models/FieldSignal.ts
export type SignalKind =
  | 'pickup_confidence' | 'location_accuracy' | 'route_deviation'
  | 'stop_duration' | 'route_efficiency' | 'arrival_accuracy'
  | 'road_behavior' | 'travel_time' | 'service_time'
  | 'route_distance' | 'route_duration'; // Added for breadcrumb learning

export type SignalEntityType = 'building' | 'zone' | 'route' | 'driver' | 'segment';

export interface FieldSignal {
  id?: number;
  companyId: number;
  entityType: SignalEntityType;
  entityId: string;
  kind: SignalKind;
  value: number;
  confidence: number;               // 0..1
  windowStart: string;
  windowEnd: string;
  observationIds?: number[];
  metadata?: Record<string, unknown>;
}
export function buildSignal(
  companyId: number,
  entityType: SignalEntityType,
  entityId: string,
  kind: SignalKind,
  value: number,
  confidence: number,
  windowStart: string,
  windowEnd: string,
  observationIds: number[] = [],
  metadata: Record<string, unknown> = {}
): FieldSignal {
  return { companyId, entityType, entityId, kind, value, confidence, windowStart, windowEnd, observationIds, metadata };
}