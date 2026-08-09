// lib/core/field-intelligence/storage/feedbackRepository.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RoutingFeedback } from '../models/RoutingFeedback';
import { StorageError } from '../errors/FieldIntelligenceError';

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const feedbackRepository = {
  async insert(fb: Omit<RoutingFeedback, 'id' | 'status' | 'appliedAt'>, client?: SupabaseClient) {
    const c = client ?? admin();
    const { error } = await c.from('field_feedback').insert([{
      company_id: fb.companyId,
      target: fb.target,
      entity_type: fb.entityType,
      entity_id: fb.entityId,
      suggestion: fb.suggestion,
      confidence: fb.confidence,
      reason: fb.reason,
    }]);
    if (error) throw new StorageError('field_feedback insert failed: ' + error.message, error);
  },

  async listPending(companyId: number, target?: string, client?: SupabaseClient) {
    const c = client ?? admin();
    let q = c.from('field_feedback').select('*').eq('company_id', companyId).eq('status', 'pending');
    if (target) q = q.eq('target', target);
    const { data } = await q.order('confidence', { ascending: false });
    return data || [];
  },

  async markApplied(id: number, client?: SupabaseClient) {
    const c = client ?? admin();
    await c.from('field_feedback').update({ status: 'applied', applied_at: new Date().toISOString() }).eq('id', id);
  },

  async markDismissed(id: number, client?: SupabaseClient) {
    const c = client ?? admin();
    await c.from('field_feedback').update({ status: 'dismissed' }).eq('id', id);
  },
};