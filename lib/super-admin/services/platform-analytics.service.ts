// lib/super-admin/services/platform-analytics.service.ts
import { adminSupabase as supabase } from '../supabase/client';
import { resolvePlan } from '@/lib/core/finance/subscription-engine/plan-resolver';

export interface SeriesPoint { key: string; label: string; total: number; count: number }

function last12(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-NG', { month: 'short' }),
    });
  }
  return out;
}

function bucketize(rows: any[], dateField: string, amountField?: string): SeriesPoint[] {
  const map = new Map(last12().map((f) => [f.key, { ...f, total: 0, count: 0 }]));
  rows.forEach((r) => {
    const d = r?.[dateField] ? new Date(r[dateField]) : null;
    if (!d || isNaN(d.getTime())) return;
    const b = map.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    if (!b) return;
    b.count += 1;
    b.total += amountField ? (Number(r[amountField]) || 0) : 1;
  });
  return [...map.values()];
}

export interface PlatformAnalytics {
  orgSeries: SeriesPoint[];
  propertySeries: SeriesPoint[];
  paymentSeries: SeriesPoint[];
  revenueSeries: SeriesPoint[];
  zoneSeries: SeriesPoint[];
  observationSeries: SeriesPoint[];
  planPopularity: { plan: string; count: number }[];
  retention: { totalOrgs: number; activeLast30d: number; pct: number };
  topEstates: { name: string; count: number }[];
  mrr: number;
  totalCommission: number;
  totalCollections: number;
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const [h, b, p, lt, z, o, s, po] = await Promise.all([
    supabase.from('haulers').select('created_at'),
    supabase.from('Buildings').select('created_at, estate'),
    supabase.from('payments').select('amount, status, created_at'),
    supabase.from('ledger_transactions').select('commission, company_id, created_at'),
    supabase.from('company_zones').select('created_at'),
    supabase.from('field_observations').select('created_at'),
    supabase.from('subscriptions').select('plan, status'),
    supabase.from('payouts').select('company_id, created_at'),
  ]);

  const successPays = (p.data || []).filter((x: any) => x.status === 'success');
  const liveSubs = (s.data || []).filter((x: any) => ['active', 'trial'].includes(x.status));

  const planMap = new Map<string, number>();
  (s.data || []).forEach((x: any) => planMap.set(x.plan, (planMap.get(x.plan) || 0) + 1));

  // Retention: orgs with ledger or payout activity in the last 30 days
  const cutoff = Date.now() - 30 * 864e5;
  const activeOrgs = new Set<number>();
  (lt.data || []).forEach((x: any) => { if (x.created_at && new Date(x.created_at).getTime() > cutoff && x.company_id != null) activeOrgs.add(Number(x.company_id)); });
  (po.data || []).forEach((x: any) => { if (x.created_at && new Date(x.created_at).getTime() > cutoff && x.company_id != null) activeOrgs.add(Number(x.company_id)); });

  const estateMap = new Map<string, number>();
  (b.data || []).forEach((x: any) => { const k = x.estate || 'Unestated'; estateMap.set(k, (estateMap.get(k) || 0) + 1); });

  const totalOrgs = (h.data || []).length;

  return {
    orgSeries: bucketize(h.data || [], 'created_at'),
    propertySeries: bucketize(b.data || [], 'created_at'),
    paymentSeries: bucketize(successPays, 'created_at', 'amount'),
    revenueSeries: bucketize(lt.data || [], 'created_at', 'commission'),
    zoneSeries: bucketize(z.data || [], 'created_at'),
    observationSeries: bucketize(o.data || [], 'created_at'),
    planPopularity: [...planMap.entries()].map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count),
    retention: { totalOrgs, activeLast30d: activeOrgs.size, pct: totalOrgs ? Math.round((activeOrgs.size / totalOrgs) * 100) : 0 },
    topEstates: [...estateMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    mrr: liveSubs.reduce((sum: number, x: any) => sum + resolvePlan(x.plan).monthlyFee, 0),
    totalCommission: (lt.data || []).reduce((sum: number, x: any) => sum + (Number(x.commission) || 0), 0),
    totalCollections: successPays.reduce((sum: number, x: any) => sum + (Number(x.amount) || 0), 0),
  };
}