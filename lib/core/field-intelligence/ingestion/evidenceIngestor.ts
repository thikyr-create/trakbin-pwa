// lib/core/field-intelligence/ingestion/evidenceIngestor.ts
import type { RawFieldEvent } from '../events/fieldEvents';
import type { FieldObservation } from '../models/FieldObservation';

export const evidenceIngestor = {
  toObservation(raw: RawFieldEvent): FieldObservation | null {
    const urls: string[] = raw.metadata?.evidenceUrls ?? [];
    if (urls.length === 0) return null;

    return {
      companyId: raw.companyId,
      driverId: raw.driverId ?? 'system',
      routeId: raw.routeId ?? null,
      buildingId: raw.buildingId ?? null,
      kind: 'evidence',
      source: 'evidence',
      occurredAt: raw.occurredAt,
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      gpsAccuracy: null,
      sourceEventId: raw.sourceEventId,
      payload: {
        urls,
        activityType: raw.metadata?.activityType ?? null,
        count: urls.length,
      },
    };
  },
};