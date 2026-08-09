// lib/core/field-intelligence/ingestion/pickupIngestor.ts
import type { RawFieldEvent } from '../events/fieldEvents';
import type { FieldObservation } from '../models/FieldObservation';
import type { PickupOutcome } from '../models/PickupObservation';

export const pickupIngestor = {
  toObservation(raw: RawFieldEvent, outcome: PickupOutcome): FieldObservation | null {
    if (!raw.buildingId) return null;

    return {
      companyId: raw.companyId,
      driverId: raw.driverId ?? 'system',
      routeId: raw.routeId ?? null,
      buildingId: raw.buildingId,
      kind: 'pickup',
      source: 'driver_action',
      occurredAt: raw.occurredAt,
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      gpsAccuracy: raw.metadata?.accuracy ?? null,
      sourceEventId: raw.sourceEventId,
      payload: {
        outcome,
        reason: raw.metadata?.reason ?? null,
        evidenceUrls: raw.metadata?.evidenceUrls ?? [],
      },
    };
  },
};