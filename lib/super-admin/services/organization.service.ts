// lib/super-admin/services/organization.service.ts
import { adminSupabase as supabase } from '../supabase/client';
import type { Organization } from '../types/organization';

export async function listOrganizations(): Promise<Organization[]> {
  const [h, b, d, t] = await Promise.all([
    supabase.from('haulers').select('*').order('id', { ascending: true }),
    supabase.from('Buildings').select('company_id'),
    supabase.from('drivers').select('company_id, status'),
    supabase.from('trucks').select('company_id'),
  ]);
  const count = (rows: any[], id: number) => rows.filter((r: any) => Number(r.company_id) === id).length;
  return (h.data || []).map((x: any) => ({
    id: x.id,
    name: x.business_name,
    kind: 'waste_operator' as const,
    status: 'active' as const,
    contactEmail: null,
    contactPhone: x.contact_number || null,
    createdAt: x.created_at || '',
    properties: count(b.data || [], x.id),
    drivers: count((d.data || []).filter((r: any) => ['active', 'busy'].includes(r.status)), x.id),
    trucks: count(t.data || [], x.id),
  }));
}