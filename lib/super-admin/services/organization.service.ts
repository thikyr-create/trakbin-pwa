// lib/super-admin/services/organization.service.ts
import { adminSupabase as supabase } from '../supabase/client';
import type { Organization } from '../types/organization';

export interface ConnectedProperty {
  custom_id: string;
  address: string | null;
  status: string | null;
  payment_status: string | null;
}
export interface OrgCommEvent { id: string; title: string; at: string | null }
export interface OrgAuditEvent { id: string; action: string; at: string }

export interface OrganizationProfile extends Organization {
  users: number;
  grossCollected: number;
  commission: number;
  netPayable: number;
  settled: number;
  outstanding: number;
  lastActivityAt: string | null;
  connectedProperties: ConnectedProperty[];
  commsHistory: OrgCommEvent[];
  auditHistory: OrgAuditEvent[];
}

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

export async function getOrganizationProfile(id: number): Promise<OrganizationProfile> {
  const [orgs, u, lt, po, inv, bld, notices, audits] = await Promise.all([
    listOrganizations(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', id),
    supabase.from('ledger_transactions').select('gross, commission, net, created_at').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('payouts').select('amount, status').eq('company_id', id),
    supabase.from('invoices').select('amount, status').eq('company_id', id),
    supabase.from('Buildings').select('custom_id, address, status, payment_status').eq('company_id', id).order('custom_id', { ascending: true }),
    supabase.from('notices').select('id, title, created_at').eq('company_id', id).order('created_at', { ascending: false }).limit(5),
    supabase.from('audit_events').select('id, action, created_at').eq('target', `org:${id}`).order('created_at', { ascending: false }).limit(8),
  ]);

  const base = orgs.find((o) => o.id === id);
  const ledger = lt.data || [];
  return {
    ...(base || {
      id, name: `Operator #${id}`, kind: 'waste_operator' as const, status: 'active' as const,
      contactEmail: null, contactPhone: null, createdAt: '', properties: 0, drivers: 0, trucks: 0,
    }),
    users: u.count || 0,
    grossCollected: ledger.reduce((s: number, t: any) => s + (Number(t.gross) || 0), 0),
    commission: ledger.reduce((s: number, t: any) => s + (Number(t.commission) || 0), 0),
    netPayable: ledger.reduce((s: number, t: any) => s + (Number(t.net) || 0), 0),
    settled: (po.data || []).filter((p: any) => !['rejected', 'failed'].includes(p.status)).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0),
    outstanding: (inv.data || []).filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
    lastActivityAt: ledger[0]?.created_at || null,
    connectedProperties: (bld.data || []).map((x: any) => ({
      custom_id: x.custom_id, address: x.address, status: x.status, payment_status: x.payment_status,
    })),
    commsHistory: (notices.data || []).map((x: any) => ({ id: x.id, title: x.title, at: x.created_at })),
    auditHistory: (audits.data || []).map((x: any) => ({ id: x.id, action: x.action, at: x.created_at })),
  };
}

export async function listProperties(): Promise<any[]> {
  const [b, h] = await Promise.all([
    supabase.from('Buildings').select('custom_id, address, estate, status, payment_status, company_id').order('custom_id', { ascending: true }),
    supabase.from('haulers').select('id, business_name'),
  ]);
  const names = new Map((h.data || []).map((x: any) => [x.id, x.business_name]));
  return (b.data || []).map((x: any) => ({ ...x, operator: names.get(x.company_id) || 'Unassigned' }));
}

export async function listVerifications(): Promise<any[]> {
  try {
    const { data } = await supabase.from('verifications').select('*').order('created_at', { ascending: false }).limit(50);
    return data || [];
  } catch {
    const { data } = await supabase.from('verifications').select('*').limit(50);
    return data || [];
  }
}