// lib/features/settings/services/settingsService.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const supabase = supabaseBrowser;

export interface CompanyProfile {
  id: number;
  business_name: string | null;
  license_number: string | null;
  operating_address: string | null;
  contact_number: string | null;
  billing_cutoff_day: number | null;
}

export interface CompanySettings {
  id: string;
  company_id: number;
  billing_cycle: string;
  cutoff_day: number;
  invoice_day: number;
  due_day: number;
  grace_period_days: number;
  late_fee_enabled: boolean;
  auto_invoice_generation: boolean;
  default_collection_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  max_stops_per_route: number;
  route_optimization: boolean;
  auto_assign_drivers: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notify_push: boolean;
  notify_driver: boolean;
  notify_payment: boolean;
  notify_issues: boolean;
  payment_gateway: string;
  settlement_bank: string | null;
  auto_settlement: string;
  wallet_enabled: boolean;
  theme: string;
  language: string;
  timezone: string;
  date_format: string;
  distance_unit: string;
  map_style: string;
}

export interface PricingPlan {
  id: string;
  company_id: number;
  plan_name: string;
  building_type: string;
  monthly_fee: number;
  is_active: boolean;
  effective_date: string;
  created_at: string;
}

export interface PricingHistoryEntry {
  id: string;
  company_id: number;
  plan_name: string;
  building_type: string;
  monthly_fee: number;
  effective_date: string;
  reason: string | null;
  created_at: string;
}

export interface SettingsBundle {
  profile: CompanyProfile | null;
  settings: CompanySettings | null;
  plans: PricingPlan[];
  history: PricingHistoryEntry[];
}

type ActionResult = { ok: boolean; error?: string };

export async function fetchSettingsBundle(company_id: number): Promise<SettingsBundle | null> {
  const { data: hauler } = await supabase
    .from('haulers')
    .select('id, business_name, license_number, operating_address, contact_number, billing_cutoff_day')
    .eq('id', company_id)
    .maybeSingle();

  // Settings row â€” create with defaults on first read
  let settings: any = null;
  const { data: existing } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', company_id)
    .maybeSingle();

  if (existing) {
    settings = existing;
  } else {
    const { data: created } = await supabase
      .from('company_settings')
      .insert([{ company_id }])
      .select('*')
      .maybeSingle();
    settings = created;
  }

  const [{ data: plans }, { data: history }] = await Promise.all([
    supabase
      .from('pricing_plans')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('pricing_history')
      .select('*')
      .eq('company_id', company_id)
      .order('effective_date', { ascending: false }),
  ]);

  return {
    profile: hauler || null,
    settings: settings || null,
    plans: plans || [],
    history: history || [],
  };
}

export async function updateProfile(
  company_id: number,
  payload: {
    business_name?: string;
    license_number?: string;
    operating_address?: string;
    contact_number?: string;
  }
): Promise<ActionResult> {
  const patch: Record<string, unknown> = {};
  if (payload.business_name !== undefined) patch.business_name = payload.business_name;
  if (payload.license_number !== undefined) patch.license_number = payload.license_number;
  if (payload.operating_address !== undefined) patch.operating_address = payload.operating_address;
  if (payload.contact_number !== undefined) patch.contact_number = payload.contact_number;

  const { error } = await supabase.from('haulers').update(patch).eq('id', company_id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateSettings(
  company_id: number,
  payload: Partial<Omit<CompanySettings, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
): Promise<ActionResult> {
  const { error } = await supabase
    .from('company_settings')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('company_id', company_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createPricingPlan(
  company_id: number,
  payload: {
    plan_name: string;
    building_type: string;
    monthly_fee: number;
    effective_date?: string;
  }
): Promise<ActionResult> {
  const effective = payload.effective_date || new Date().toISOString().slice(0, 10);

  const { data: plan, error } = await supabase
    .from('pricing_plans')
    .insert([
      {
        company_id,
        plan_name: payload.plan_name,
        building_type: payload.building_type,
        monthly_fee: payload.monthly_fee,
        effective_date: effective,
      },
    ])
    .select('id')
    .maybeSingle();

  if (error || !plan) return { ok: false, error: error?.message || 'Failed to create plan.' };

  // Audit trail â€” plan creation is the first history entry
  await supabase.from('pricing_history').insert([
    {
      company_id,
      plan_name: payload.plan_name,
      building_type: payload.building_type,
      monthly_fee: payload.monthly_fee,
      effective_date: effective,
      reason: 'Plan created',
    },
  ]);

  return { ok: true };
}

/**
 * Changes a plan's fee WITHOUT touching existing invoices.
 * Old invoices keep their stored amount; future invoices read the new fee.
 * Every change writes an immutable history row (audit trail).
 */
export async function changePlanFee(
  company_id: number,
  plan_id: string,
  payload: {
    monthly_fee: number;
    effective_date: string;
    reason: string;
  }
): Promise<ActionResult> {
  const { data: plan } = await supabase
    .from('pricing_plans')
    .select('plan_name, building_type')
    .eq('id', plan_id)
    .eq('company_id', company_id)
    .maybeSingle();

  if (!plan) return { ok: false, error: 'Plan not found.' };

  const { error } = await supabase
    .from('pricing_plans')
    .update({ monthly_fee: payload.monthly_fee, effective_date: payload.effective_date })
    .eq('id', plan_id);

  if (error) return { ok: false, error: error.message };

  await supabase.from('pricing_history').insert([
    {
      company_id,
      plan_name: plan.plan_name,
      building_type: plan.building_type,
      monthly_fee: payload.monthly_fee,
      effective_date: payload.effective_date,
      reason: payload.reason || null,
    },
  ]);

  return { ok: true };
}