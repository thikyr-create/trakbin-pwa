// lib/core/field-intelligence/ingestion/movementIngestor.ts
import type { RawFieldEvent } from '../events/fieldEvents';
import type { FieldObservation } from '../models/FieldObservation';
import { gpsConfig } from '../config/gpsConfig';

/** Every event carrying coordinates contributes a GPS movement sample. */
export const movementIngestor = {
  toObservation(raw: RawFieldEvent): FieldObservation | null {
    if (raw.latitude == null || raw.longitude == null) return null;
    const accuracy = raw.metadata?.accuracy ?? raw.metadata?.gps_accuracy ?? null;
    if (typeof accuracy === 'number' && accuracy > gpsConfig.accuracyCeilingM) return null;

    return {
      companyId: raw.companyId,
      driverId: raw.driverId ?? 'system',
      routeId: raw.routeId ?? null,
      buildingId: raw.buildingId ?? null,
      kind: 'movement',
      source: 'gps',
      occurredAt: raw.occurredAt,
      latitude: raw.latitude,
      longitude: raw.longitude,
      gpsAccuracy: accuracy,
      sourceEventId: raw.sourceEventId,
      payload: { eventType: raw.eventType },
    };
  },
};