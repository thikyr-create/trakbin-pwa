// lib/core/field-intelligence/storage/correctionRepository.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FieldCorrection } from '../models/FieldCorrection';
import { StorageError } from '../errors/FieldIntelligenceError';

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const correctionRepository = {
  async propose(cor: Omit<FieldCorrection, 'id'>, client?: SupabaseClient): Promise<void> {
    const c = client ?? admin();
    const { data: existing } = await c.from('field_corrections')
      .select('id, evidence_count, confidence')
      .eq('company_id', cor.companyId).eq('entity_type', cor.entityType)
      .eq('entity_id', cor.entityId).eq('field', cor.field)
      .in('status', ['candidate', 'strong_candidate'])
      .maybeSingle();

    if (existing) {
      const { error } = await c.from('field_corrections').update({
        proposed_value: cor.proposedValue,
        confidence: Math.max(existing.confidence, cor.confidence),
        evidence_count: existing.evidence_count + 1,
      }).eq('id', existing.id);
      if (error) throw new StorageError('field_corrections update failed: ' + error.message, error);
      return;
    }

    const { error } = await c.from('field_corrections').insert([{
      company_id: cor.companyId,
      entity_type: cor.entityType,
      entity_id: cor.entityId,
      field: cor.field,
      current_value: cor.currentValue,
      proposed_value: cor.proposedValue,
      confidence: cor.confidence,
      evidence_count: 1,
      status: 'candidate',
    }]);
    if (error) throw new StorageError('field_corrections insert failed: ' + error.message, error);
  },

  async listPending(companyId: number, client?: SupabaseClient) {
    const c = client ?? admin();
    const { data } = await c.from('field_corrections')
      .select('*').eq('company_id', companyId)
      .in('status', ['candidate', 'strong_candidate'])
      .order('confidence', { ascending: false });
    return data || [];
  },

  async setStatus(id: number, status: string, reviewedBy?: string, client?: SupabaseClient) {
    const c = client ?? admin();
    const { error } = await c.from('field_corrections')
      .update({ status, reviewed_by: reviewedBy ?? null }).eq('id', id);
    if (error) throw new StorageError('field_corrections setStatus failed: ' + error.message, error);
  },
};