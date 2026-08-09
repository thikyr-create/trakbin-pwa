// lib/core/field-intelligence/storage/signalRepository.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FieldSignal } from '../models/FieldSignal';
import { StorageError } from '../errors/FieldIntelligenceError';

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const signalRepository = {
  async insert(sig: FieldSignal, client?: SupabaseClient): Promise<number | null> {
    const c = client ?? admin();
    const { data, error } = await c.from('field_signals').insert([{
      company_id: sig.companyId,
      entity_type: sig.entityType,
      entity_id: sig.entityId,
      kind: sig.kind,
      value: sig.value,
      confidence: sig.confidence,
      window_start: sig.windowStart,
      window_end: sig.windowEnd,
      observation_ids: sig.observationIds ?? [],
      metadata: sig.metadata ?? {},
    }]).select('id').single();
    if (error) throw new StorageError('field_signals insert failed: ' + error.message, error);
    return data?.id ?? null;
  },

    async listByCompany(companyId: number, sinceIso: string, kind?: string, limit = 2000, client?: SupabaseClient) {
    const c = client ?? admin();
    let q = c.from('field_signals').select('*').eq('company_id', companyId).gte('created_at', sinceIso);
    if (kind) q = q.eq('kind', kind);
    const { data } = await q.order('created_at', { ascending: true }).limit(limit);
    return data || [];
  },

  async latestFor(companyId: number, entityType: string, entityId: string, kind: string, client?: SupabaseClient) {
    const c = client ?? admin();
    const { data } = await c.from('field_signals')
      .select('*').eq('company_id', companyId)
      .eq('entity_type', entityType).eq('entity_id', entityId).eq('kind', kind)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    return data;
  },
};