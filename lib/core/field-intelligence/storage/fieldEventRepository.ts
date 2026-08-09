// lib/core/field-intelligence/storage/fieldEventRepository.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RawFieldEvent } from '../events/fieldEvents';
import { StorageError } from '../errors/FieldIntelligenceError';

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Defensive mapper: driver_activity column naming may vary */
export function mapActivityRow(row: any): RawFieldEvent | null {
  if (!row) return null;
  const id = row.id ?? row.source_event_id;
  const companyId = row.company_id ?? row.companyId;
  if (!id || !companyId) return null;
  return {
    sourceEventId: String(id),
    eventType: row.event_type ?? row.eventType ?? 'UNKNOWN',
    companyId: Number(companyId),
    driverId: row.driver_id ?? row.driverId ?? null,
    routeId: row.route_id ?? row.routeId ?? null,
    buildingId: row.building_id ?? row.buildingId ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    metadata: row.metadata ?? {},
    occurredAt: row.occurred_at ?? row.occurredAt ?? new Date().toISOString(),
  };
}

export const fieldEventRepository = {
  /** Idempotent insert. Returns true if newly recorded. */
  async record(raw: RawFieldEvent, client?: SupabaseClient): Promise<boolean> {
    const c = client ?? admin();
    const { error } = await c.from('field_events').insert([{
      source_event_id: raw.sourceEventId,
      event_type: raw.eventType,
      company_id: raw.companyId,
      driver_id: raw.driverId,
      route_id: raw.routeId,
      building_id: raw.buildingId,
      latitude: raw.latitude,
      longitude: raw.longitude,
      metadata: raw.metadata,
      occurred_at: raw.occurredAt,
    }]);
    if (error?.code === '23505') return false;      // duplicate → already recorded
    if (error) throw new StorageError('field_events insert failed: ' + error.message, error);
    return true;
  },

  async markProcessed(ids: number[], client?: SupabaseClient): Promise<void> {
    const c = client ?? admin();
    await c.from('field_events').update({ processed: true }).in('id', ids);
  },

  async listUnprocessed(limit = 500, client?: SupabaseClient) {
    const c = client ?? admin();
    const { data, error } = await c.from('field_events')
      .select('*').eq('processed', false)
      .order('occurred_at', { ascending: true }).limit(limit);
    if (error) throw new StorageError('field_events select failed: ' + error.message, error);
    return data || [];
  },

  /** Durable backstop: mirror anything the realtime listener missed. */
  async backfill(sinceIso: string, client?: SupabaseClient): Promise<number> {
    const c = client ?? admin();
    const { data: rows } = await c.from('driver_activity')
      .select('*').gte('occurred_at', sinceIso).limit(1000);
    if (!rows?.length) return 0;
    const mapped = rows.map(mapActivityRow).filter(Boolean) as RawFieldEvent[];
    const { data: existing } = await c.from('field_events')
      .select('source_event_id').in('source_event_id', mapped.map(m => m.sourceEventId));
    const known = new Set((existing || []).map((e: any) => e.source_event_id));
    let added = 0;
    for (const raw of mapped) {
      if (known.has(raw.sourceEventId)) continue;
      if (await this.record(raw, c)) added++;
    }
    return added;
  },
};