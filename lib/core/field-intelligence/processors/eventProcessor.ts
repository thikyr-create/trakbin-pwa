// lib/core/field-intelligence/processors/eventProcessor.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawFieldEvent } from '../events/fieldEvents';
import { fieldEventIngestor } from '../ingestion/fieldEventIngestor';
import { pickupProcessor } from './pickupProcessor';
import { movementProcessor } from './movementProcessor';
import { routeProcessor } from './routeProcessor';
import { observationRepository } from '../storage/observationRepository';
import { fieldEventRepository } from '../storage/fieldEventRepository';

/**
 * C1 orchestrator: raw events → normalized observations → derived measurements.
 * Deterministic math only (no ML) — per the Phase C doctrine.
 */
export const eventProcessor = {
  async processRawBatch(raws: RawFieldEvent[], client?: SupabaseClient): Promise<{ observations: number; stops: number }> {
    const ordered = [...raws].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    const inserted: any[] = [];
    let count = 0;

    for (const raw of ordered) {
      const observations = fieldEventIngestor.map(raw);
      for (const obs of observations) {
        await pickupProcessor.enrichDwell(obs, client);
      }
      const ids = await fieldEventIngestor.persist(observations, client);
      count += ids.length;
      inserted.push(...observations);
    }

    // Derived measurements per driver
    let stops = 0;
    const byDriver = new Map<string, any[]>();
    for (const o of inserted) {
      if (!byDriver.has(o.driverId)) byDriver.set(o.driverId, []);
      byDriver.get(o.driverId)!.push(o);
    }

    for (const [driverId, obs] of byDriver) {
      const { stops: detected } = movementProcessor.segmentize(obs);
      for (const s of detected) {
        const id = await observationRepository.insert({
          companyId: obs[0].companyId,
          driverId,
          routeId: obs[0].routeId ?? null,
          buildingId: null,
          kind: 'stop',
          source: 'system',
          occurredAt: s.endTs,
          latitude: s.lat,
          longitude: s.lng,
          gpsAccuracy: null,
          sourceEventId: null,
          payload: { startTs: s.startTs, dwellMs: s.dwellMs },
        }, client);
        if (id != null) stops++;
      }
    }

    return { observations: count, stops };
  },

  /** Durable replay: backfill missed events, process, mark processed. */
  async replay(companyId: number, sinceIso: string, client?: SupabaseClient): Promise<{ processed: number; observations: number }> {
    await fieldEventRepository.backfill(sinceIso, client);
    const unprocessed = await fieldEventRepository.listUnprocessed(500, client);
    const mine = unprocessed.filter((r: any) => Number(r.company_id) === companyId);
    if (mine.length === 0) return { processed: 0, observations: 0 };

    const raws: RawFieldEvent[] = mine.map((r: any) => ({
      sourceEventId: r.source_event_id,
      eventType: r.event_type,
      companyId: Number(r.company_id),
      driverId: r.driver_id,
      routeId: r.route_id,
      buildingId: r.building_id,
      latitude: r.latitude,
      longitude: r.longitude,
      metadata: r.metadata ?? {},
      occurredAt: r.occurred_at,
    }));

    const result = await this.processRawBatch(raws, client);
    await fieldEventRepository.markProcessed(mine.map((r: any) => r.id), client);
    return { processed: mine.length, observations: result.observations };
  },
};