// lib/core/field-intelligence/ingestion/fieldEventIngestor.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawFieldEvent } from '../events/fieldEvents';
import type { FieldObservation } from '../models/FieldObservation';
import { movementIngestor } from './movementIngestor';
import { locationIngestor } from './locationIngestor';
import { pickupIngestor } from './pickupIngestor';
import { evidenceIngestor } from './evidenceIngestor';
import { observationRepository } from '../storage/observationRepository';

function arrivalObservation(raw: RawFieldEvent, phase: 'arrived' | 'approached'): FieldObservation {
  return {
    companyId: raw.companyId,
    driverId: raw.driverId ?? 'system',
    routeId: raw.routeId ?? null,
    buildingId: raw.buildingId ?? null,
    kind: 'arrival',
    source: 'system',
    occurredAt: raw.occurredAt,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    gpsAccuracy: raw.metadata?.accuracy ?? null,
    sourceEventId: raw.sourceEventId,
    payload: { phase, distanceM: raw.metadata?.distanceM ?? null },
  };
}

function routeObservation(raw: RawFieldEvent): FieldObservation {
  const phase =
    raw.eventType === 'DRIVER_DEVIATED' ? 'deviated' :
    raw.eventType === 'DRIVER_REJOINED_ROUTE' ? 'rejoined' :
    raw.eventType === 'DRIVER_ROUTE_STARTED' ? 'started' :
    raw.eventType === 'DRIVER_ROUTE_COMPLETED' ? 'completed' :
    raw.eventType === 'DRIVER_ROUTE_PAUSED' ? 'paused' : 'resumed';

  return {
    companyId: raw.companyId,
    driverId: raw.driverId ?? 'system',
    routeId: raw.routeId ?? null,
    buildingId: raw.buildingId ?? null,
    kind: 'route',
    source: 'system',
    occurredAt: raw.occurredAt,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    gpsAccuracy: null,
    sourceEventId: raw.sourceEventId,
    payload: { phase, distanceM: raw.metadata?.distanceM ?? null },
  };
}

/**
 * Ingestion normalizes raw events into observations.
 * It does NOT interpret them — analyzers (C2) do that.
 */
export const fieldEventIngestor = {
  map(raw: RawFieldEvent): FieldObservation[] {
    const out: FieldObservation[] = [];
    const t = raw.eventType;

    // Corrections supersede the generic GPS sample for the same event
    if (t === 'DRIVER_LOCATION_CORRECTED') {
      const o = locationIngestor.toObservation(raw);
      if (o) out.push(o);
      return out;
    }

    const mv = movementIngestor.toObservation(raw);
    if (mv) out.push(mv);

    if (t === 'DRIVER_PICKUP_CONFIRMED' || t === 'DRIVER_PICKUP_SKIPPED' || t === 'DRIVER_PICKUP_FAILED') {
      const outcome = t.endsWith('CONFIRMED') ? 'confirmed' : t.endsWith('SKIPPED') ? 'skipped' : 'failed';
      const o = pickupIngestor.toObservation(raw, outcome);
      if (o) out.push(o);
    } else if (t === 'DRIVER_EVIDENCE_ATTACHED') {
      const o = evidenceIngestor.toObservation(raw);
      if (o) out.push(o);
    } else if (t === 'DRIVER_STOP_ARRIVED' || t === 'DRIVER_STOP_APPROACHED') {
      out.push(arrivalObservation(raw, t.endsWith('ARRIVED') ? 'arrived' : 'approached'));
    } else if (t.startsWith('DRIVER_ROUTE') || t === 'DRIVER_DEVIATED' || t === 'DRIVER_REJOINED_ROUTE') {
      out.push(routeObservation(raw));
    }

    return out;
  },

  async persist(observations: FieldObservation[], client?: SupabaseClient): Promise<number[]> {
    const ids: number[] = [];
    for (const obs of observations) {
      const id = await observationRepository.insert(obs, client);
      if (id != null) ids.push(id);
    }
    return ids;
  },
};