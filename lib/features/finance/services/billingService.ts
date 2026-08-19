// lib/features/finance/services/billingService.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { isInvoiceOverdue } from '../utils/billingHelpers';
import type { PricingPlan } from '@/lib/features/settings/services/settingsService';

const supabase = supabaseBrowser;

export interface BillingPlan {
  id: string;
  building_id: string;
  company_id: number;
  amount: number;
  frequency: string;
  due_day: number;
  grace_days: number;
  start_date: string | null;
  status: string;
  created_at: string;
}

export interface InvoiceRow {
  id: number;
  building_id: string;
  amount: number;
  due_date: string;
  status: string;
  description: string | null;
  created_at: string;
  company_id: number;
  paid_at: string | null;
  building_address?: string | null;
  building_estate?: string | null;
}

export interface InvoiceStats {
  issuedToday: number;
  open: number;
  overdue: number;
  paid: number;
  outstandingAmount: number;
}

export interface LinkedPlanInfo {
  plan: PricingPlan | null;
  hasExplicitLink: boolean;
}

export async function fetchBillingPlans(company_id: number): Promise<BillingPlan[]> {
  const { data, error } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching billing plans:', error);
    return [];
  }
  return (data || []) as BillingPlan[];
}

export async function fetchInvoices(company_id: number): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', company_id)
    .order('due_date', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  const invoices = (data || []) as InvoiceRow[];
  const customIds = [...new Set(invoices.map((i) => i.building_id).filter(Boolean))];

  if (customIds.length > 0) {
    const { data: buildings } = await supabase
      .from('Buildings')
      .select('custom_id, address, estate')
      .eq('company_id', company_id)
      .in('custom_id', customIds);

    const map = new Map<string, any>();
    (buildings || []).forEach((b: any) => map.set(b.custom_id, b));

    invoices.forEach((inv) => {
      const b = map.get(inv.building_id);
      inv.building_address = b?.address || null;
      inv.building_estate = b?.estate || null;
    });
  }

  return invoices;
}

export async function fetchInvoiceStats(company_id: number): Promise<InvoiceStats> {
  const invoices = await fetchInvoices(company_id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let issuedToday = 0;
  let open = 0;
  let overdue = 0;
  let paid = 0;
  let outstandingAmount = 0;

  invoices.forEach((inv) => {
    const created = new Date(inv.created_at);
    if (created >= todayStart) issuedToday += 1;

    if (inv.status === 'paid') {
      paid += 1;
      return;
    }
    if (inv.status === 'cancelled') return;

    // Overdue by status OR by date math (status may lag reality)
    const overdueNow =
      inv.status === 'overdue' ||
      isInvoiceOverdue(inv.due_date, 2);

    if (overdueNow) {
      overdue += 1;
    } else if (inv.status === 'issued' || inv.status === 'viewed' || inv.status === 'draft') {
      open += 1;
    }

    outstandingAmount += Number(inv.amount) || 0;
  });

  return { issuedToday, open, overdue, paid, outstandingAmount };
}

export async function fetchBuildingInvoices(
  building_id: string,
  company_id: number
): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('building_id', building_id)
    .eq('company_id', company_id)
    .order('due_date', { ascending: false });

  if (error) {
    console.error('Error fetching building invoices:', error);
    return [];
  }
  return (data || []) as InvoiceRow[];
}

/**
 * Fetch the pricing plan linked to a building.
 * Returns the explicit link (pricing_plan_id) if set, otherwise null.
 */
export async function fetchLinkedPlan(
  building_id: string,
  company_id: number
): Promise<LinkedPlanInfo> {
  const { data: building } = await supabase
    .from('Buildings')
    .select('pricing_plan_id')
    .eq('custom_id', building_id)
    .eq('company_id', company_id)
    .maybeSingle();

  if (!building?.pricing_plan_id) {
    return { plan: null, hasExplicitLink: false };
  }

  const { data: plan } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('id', building.pricing_plan_id)
    .eq('company_id', company_id)
    .maybeSingle();

  return { plan: (plan as PricingPlan) || null, hasExplicitLink: true };
}

/**
 * Link a building to a specific pricing plan (or unlink if plan_id is null).
 */
export async function linkBuildingToPlan(
  building_id: string,
  company_id: number,
  plan_id: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('Buildings')
    .update({ pricing_plan_id: plan_id })
    .eq('custom_id', building_id)
    .eq('company_id', company_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Bulk link all buildings to matching pricing plans by building_type.
 * Only links buildings that don't already have an explicit link.
 */
export async function autoLinkBuildingsToPlans(
  company_id: number
): Promise<{ linked: number; skipped: number }> {
  // Fetch all buildings without explicit links
  const { data: buildings } = await supabase
    .from('Buildings')
    .select('custom_id, building_type')
    .eq('company_id', company_id)
    .is('pricing_plan_id', null);

  if (!buildings || buildings.length === 0) {
    return { linked: 0, skipped: 0 };
  }

  // Fetch all active pricing plans (most recent effective first)
  const today = new Date().toISOString().slice(0, 10);
  const { data: plans } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('company_id', company_id)
    .eq('is_active', true)
    .lte('effective_date', today)
    .order('effective_date', { ascending: false });

  if (!plans || plans.length === 0) {
    return { linked: 0, skipped: buildings.length };
  }

  // Build a map: building_type â†’ most recent active plan
  const planByType = new Map<string, any>();
  plans.forEach((p: any) => {
    if (!planByType.has(p.building_type)) {
      planByType.set(p.building_type, p);
    }
  });

  let linked = 0;
  let skipped = 0;

  for (const b of buildings) {
    const plan = planByType.get(b.building_type || 'Residential');
    if (!plan) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase
      .from('Buildings')
      .update({ pricing_plan_id: plan.id })
      .eq('custom_id', b.custom_id)
      .eq('company_id', company_id);

    if (!error) linked += 1;
    else skipped += 1;
  }

  return { linked, skipped };
}