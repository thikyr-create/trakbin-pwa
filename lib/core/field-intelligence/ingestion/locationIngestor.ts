// lib/core/field-intelligence/ingestion/locationIngestor.ts
import type { RawFieldEvent } from '../events/fieldEvents';
import type { FieldObservation } from '../models/FieldObservation';

/** Driver-submitted corrections are high-weight location samples (source: driver_action). */
export const locationIngestor = {
  toObservation(raw: RawFieldEvent): FieldObservation | null {
    const lat = raw.metadata?.latitude ?? raw.latitude;
    const lng = raw.metadata?.longitude ?? raw.longitude;
    if (lat == null || lng == null) return null;

    return {
      companyId: raw.companyId,
      driverId: raw.driverId ?? 'system',
      routeId: raw.routeId ?? null,
      buildingId: raw.buildingId ?? null,
      kind: 'movement',
      source: 'driver_action',
      occurredAt: raw.occurredAt,
      latitude: Number(lat),
      longitude: Number(lng),
      gpsAccuracy: null,
      sourceEventId: raw.sourceEventId,
      payload: {
        correction: true,
        originalLat: raw.latitude ?? null,
        originalLng: raw.longitude ?? null,
      },
    };
  },
};