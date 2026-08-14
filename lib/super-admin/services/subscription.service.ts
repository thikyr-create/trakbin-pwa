// lib/super-admin/services/subscription.service.ts
import { adminSupabase as supabase } from '../supabase/client';
import { resolvePlan } from '@/lib/core/finance/subscription-engine/plan-resolver';
import { emitSubscriptionEvent } from '@/lib/core/finance/subscription-engine/subscription-events';

export interface SubscriptionRow {
  id: string; companyId: number; orgName: string;
  plan: string; status: string; periodEnd: string | null; monthlyFee: number;
}

export async function listSubscriptions(): Promise<SubscriptionRow[]> {
  const [s, h] = await Promise.all([
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('haulers').select('id, business_name'),
  ]);
  const names = new Map((h.data || []).map((x: any) => [Number(x.id), x.business_name]));
  return (s.data || []).map((x: any) => ({
    id: x.id, companyId: x.company_id,
    orgName: names.get(Number(x.company_id)) || `Operator #${x.company_id}`,
    plan: x.plan, status: x.status, periodEnd: x.current_period_end,
    monthlyFee: resolvePlan(x.plan).monthlyFee,
  }));
}

export async function grantSubscription(companyId: number, plan: string, status: 'active' | 'trial') {
  const periodEnd = new Date(Date.now() + 30 * 864e5).toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ company_id: companyId, plan, status, current_period_end: periodEnd })
    .select().single();
  if (error) throw new Error(error.message);
  await emitSubscriptionEvent(supabase, { subscriptionId: data.id, companyId, type: 'created', metadata: { plan, status } });
  return data;
}

export async function renewSubscription(id: string, companyId: number) {
  const periodEnd = new Date(Date.now() + 30 * 864e5).toISOString();
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'active', current_period_start: new Date().toISOString(), current_period_end: periodEnd })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await emitSubscriptionEvent(supabase, { subscriptionId: id, companyId, type: 'renewed', metadata: { periodEnd } });
}

export async function cancelSubscription(id: string, companyId: number) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await emitSubscriptionEvent(supabase, { subscriptionId: id, companyId, type: 'cancelled', metadata: {} });
}

export async function listSubscriptionEvents(): Promise<any[]> {
  const { data } = await supabase.from('subscription_events').select('*').order('created_at', { ascending: false }).limit(30);
  return data || [];
}

export async function usageForSubscriptions(): Promise<any[]> {
  const [subs, bld, drv, usr, zon] = await Promise.all([
    supabase.from('subscriptions').select('company_id, plan, status'),
    supabase.from('Buildings').select('company_id'),
    supabase.from('drivers').select('company_id'),
    supabase.from('profiles').select('company_id'),
    supabase.from('company_zones').select('company_id'),
  ]);
  const cnt = (rows: any[], id: number) => rows.filter((r: any) => Number(r.company_id) === id).length;
  return (subs.data || []).map((s: any) => ({
    companyId: s.company_id, plan: s.plan, status: s.status,
    usage: {
      properties: cnt(bld.data || [], s.company_id),
      users: cnt(usr.data || [], s.company_id),
      drivers: cnt(drv.data || [], s.company_id),
      zones: cnt(zon.data || [], s.company_id),
    },
  }));
}