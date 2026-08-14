// lib/super-admin/services/audit.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export async function listAuditEvents(): Promise<any[]> {
  const { data } = await supabase
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return data || [];
}