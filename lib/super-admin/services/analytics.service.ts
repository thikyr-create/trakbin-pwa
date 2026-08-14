// lib/super-admin/services/analytics.service.ts
import { adminSupabase as supabase } from '../supabase/client';
import type { PlatformOverview, AttentionItem, ActivityEvent } from '../types/analytics';

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const [orgs, props, zones, drivers, pays, ltx, outs, obs, issues, overdue] = await Promise.all([
    supabase.from('haulers').select('*', { count: 'exact', head: true }),
    supabase.from('Buildings').select('*', { count: 'exact', head: true }),
    supabase.from('company_zones').select('*', { count: 'exact', head: true }),
    supabase.from('drivers').select('status'),
    supabase.from('payments').select('amount, status'),
    supabase.from('ledger_transactions').select('gross, commission, net'),
    supabase.from('payouts').select('amount, status'),
    supabase.from('field_observations').select('*', { count: 'exact', head: true }),
    supabase.from('environmental_issues').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
  ]);

  const payments = pays.data || [];
  const successful = payments.filter((p: any) => p.status === 'success');
  const ledger = ltx.data || [];
  const settledOut = (outs.data || [])
    .filter((p: any) => !['rejected', 'failed'].includes(p.status))
    .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  return {
    organizations: orgs.count || 0,
    activeSubscriptions: 0,            // subscriptions table lands in A7R — real zero until then
    mrr: 0,                            // derived from subscriptions, never hardcoded
    outstandingPlatformInvoices: 0,    // platform billing engine lands in A6R
    properties: props.count || 0,
    zones: zones.count || 0,
    activeOperators: orgs.count || 0,
    activeDrivers: (drivers.data || []).filter((d: any) => ['active', 'busy'].includes(d.status)).length,
    collectionsProcessed: successful.length,
    collectionsVolume: successful.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0),
    fieldObservations: obs.count || 0,
    platformIncidents: issues.count || 0,
    overdueInvoices: overdue.count || 0,
    revenue: {
      grossCollected: ledger.reduce((s: number, t: any) => s + (Number(t.gross) || 0), 0),
      commissionRetained: ledger.reduce((s: number, t: any) => s + (Number(t.commission) || 0), 0),
      operatorPayable: ledger.reduce((s: number, t: any) => s + (Number(t.net) || 0), 0),
      settledOut,
    },
  };
}

export async function getAttentionItems(): Promise<AttentionItem[]> {
  const [fp, oi, sr, pq] = await Promise.all([
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payouts').select('*', { count: 'exact', head: true }).in('status', ['requested', 'pending']),
  ]);
  const items: AttentionItem[] = [];
  if (fp.count) items.push({ id: 'fp', label: `${fp.count} failed payment${fp.count > 1 ? 's' : ''}`, href: '/admin/billing', tone: 'rose' });
  if (oi.count) items.push({ id: 'oi', label: `${oi.count} overdue invoice${oi.count > 1 ? 's' : ''}`, href: '/admin/billing', tone: 'amber' });
  if (sr.count) items.push({ id: 'sr', label: `${sr.count} request${sr.count > 1 ? 's' : ''} awaiting approval`, href: '/admin/approvals', tone: 'amber' });
  if (pq.count) items.push({ id: 'pq', label: `${pq.count} settlement request${pq.count > 1 ? 's' : ''} awaiting review`, href: '/admin/approvals', tone: 'amber' });
  return items;
}

export async function getRecentActivity(): Promise<ActivityEvent[]> {
  const [p, l, s] = await Promise.all([
    supabase.from('payments').select('id, reference, status, created_at').order('created_at', { ascending: false }).limit(4),
    supabase.from('ledger_transactions').select('id, type, building_id, created_at').order('created_at', { ascending: false }).limit(4),
    supabase.from('service_requests').select('id, request_number, building_id, submitted_at').order('submitted_at', { ascending: false }).limit(4),
  ]);
  const ev: ActivityEvent[] = [
    ...(p.data || []).map((x: any) => ({ id: `p-${x.id}`, kind: 'payment' as const, label: `Payment ${x.status} · ${x.reference || x.id}`, at: x.created_at })),
    ...(l.data || []).map((x: any) => ({ id: `l-${x.id}`, kind: 'ledger' as const, label: `Ledger ${x.type} · ${x.building_id}`, at: x.created_at })),
    ...(s.data || []).map((x: any) => ({ id: `s-${x.id}`, kind: 'request' as const, label: `Request ${x.request_number} · ${x.building_id}`, at: x.submitted_at })),
  ];
  return ev.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 6);
}