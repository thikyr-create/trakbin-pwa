// lib/core/field-intelligence/storage/observationRepository.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FieldObservation } from '../models/FieldObservation';
import { StorageError } from '../errors/FieldIntelligenceError';

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const observationRepository = {
  async insert(obs: FieldObservation, client?: SupabaseClient): Promise<number | null> {
    const c = client ?? admin();
    const { data, error } = await c.from('field_observations').insert([{
      company_id: obs.companyId,
      driver_id: obs.driverId,
      route_id: obs.routeId ?? null,
      building_id: obs.buildingId ?? null,
      kind: obs.kind,
      source: obs.source,
      occurred_at: obs.occurredAt,
      latitude: obs.latitude ?? null,
      longitude: obs.longitude ?? null,
      gps_accuracy: obs.gpsAccuracy ?? null,
      source_event_id: obs.sourceEventId ?? null,
      payload: obs.payload,
    }]).select('id').single();
    if (error) throw new StorageError('field_observations insert failed: ' + error.message, error);
    return data?.id ?? null;
  },

    async listByCompany(companyId: number, sinceIso: string, limit = 5000, client?: SupabaseClient) {
    const c = client ?? admin();
    const { data } = await c.from('field_observations')
      .select('*').eq('company_id', companyId).gte('occurred_at', sinceIso)
      .order('occurred_at', { ascending: true }).limit(limit);
    return data || [];
  },

  async listByBuilding(companyId: number, buildingId: string, kind?: string, limit = 200, client?: SupabaseClient) {
    const c = client ?? admin();
    let q = c.from('field_observations')
      .select('*').eq('company_id', companyId).eq('building_id', buildingId);
    if (kind) q = q.eq('kind', kind);
    const { data } = await q.order('occurred_at', { ascending: false }).limit(limit);
    return data || [];
  },

  async listByDriver(companyId: number, driverId: string, sinceIso: string, limit = 1000, client?: SupabaseClient) {
    const c = client ?? admin();
    const { data } = await c.from('field_observations')
      .select('*').eq('company_id', companyId).eq('driver_id', driverId)
      .gte('occurred_at', sinceIso)
      .order('occurred_at', { ascending: true }).limit(limit);
    return data || [];
  },
};