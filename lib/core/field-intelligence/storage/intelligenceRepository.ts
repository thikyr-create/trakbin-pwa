// lib/core/field-intelligence/storage/intelligenceRepository.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { StorageError } from '../errors/FieldIntelligenceError';

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const intelligenceRepository = {
  /** Upsert learned value; on conflict, merge sample count (caller recomputes value/confidence). */
  async upsert(companyId: number, entityType: string, entityId: string, kind: string, patch: {
    value: Record<string, unknown>; confidence: number; sampleCount: number; variance?: number | null; status?: string;
  }, client?: SupabaseClient) {
    const c = client ?? admin();
    const { error } = await c.from('field_intelligence').upsert({
      company_id: companyId,
      entity_type: entityType,
      entity_id: entityId,
      kind,
      value: patch.value,
      confidence: patch.confidence,
      sample_count: patch.sampleCount,
      variance: patch.variance ?? null,
      status: patch.status ?? 'candidate',
    }, { onConflict: 'company_id,entity_type,entity_id,kind' });
    if (error) throw new StorageError('field_intelligence upsert failed: ' + error.message, error);
  },

  async get(companyId: number, entityType: string, entityId: string, kind: string, client?: SupabaseClient) {
    const c = client ?? admin();
    const { data } = await c.from('field_intelligence')
      .select('*').eq('company_id', companyId)
      .eq('entity_type', entityType).eq('entity_id', entityId).eq('kind', kind)
      .maybeSingle();
    return data;
  },

  async listByCompany(companyId: number, limit = 500, client?: SupabaseClient) {
    const c = client ?? admin();
    const { data } = await c.from('field_intelligence')
      .select('*').eq('company_id', companyId)
      .order('updated_at', { ascending: false }).limit(limit);
    return data || [];
  },
};