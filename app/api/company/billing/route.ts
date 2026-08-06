// app/api/company/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  invoiceDueDate,
  periodLabel,
  isBillableForCycle,
  cycleOfDate,
  type BillingSettings,
  DEFAULTS,
} from '@/lib/features/finance/utils/billingHelpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_CYCLE = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

interface GenResult {
  generated: number;
  skipped: Record<string, number>;
}

function bump(skipped: Record<string, number>, reason: string) {
  skipped[reason] = (skipped[reason] || 0) + 1;
}

/**
 * Fetch billing settings for a company.
 * Returns DEFAULTS if no settings row exists (backward compatible).
 */
async function fetchSettings(company_id: number): Promise<BillingSettings> {
  const { data } = await supabaseAdmin
    .from('company_settings')
    .select('cutoff_day, invoice_day, due_day, grace_period_days, auto_invoice_generation')
    .eq('company_id', company_id)
    .maybeSingle();

  if (!data) return DEFAULTS;

  return {
    cutoff_day: data.cutoff_day ?? DEFAULTS.cutoff_day,
    invoice_day: data.invoice_day ?? DEFAULTS.invoice_day,
    due_day: data.due_day ?? DEFAULTS.due_day,
    grace_period_days: data.grace_period_days ?? DEFAULTS.grace_period_days,
    auto_invoice_generation: data.auto_invoice_generation ?? DEFAULTS.auto_invoice_generation,
  };
}

/**
 * Resolve amount for a building.
 * Priority: pricing_plan_id (direct link) → billing_plan (legacy) → pricing_plan (by building_type) → null (skip)
 */
async function resolveAmount(
  building_id: string,
  company_id: number,
  buildingType: string | null,
  pricing_plan_id: string | null
): Promise<number | null> {
  // 1) Direct link via pricing_plan_id (preferred)
  if (pricing_plan_id) {
    const { data: plan } = await supabaseAdmin
      .from('pricing_plans')
      .select('monthly_fee')
      .eq('id', pricing_plan_id)
      .eq('company_id', company_id)
      .maybeSingle();

    if (plan) return Number(plan.monthly_fee) || null;
  }

  // 2) Explicit billing_plan (legacy per-building plans)
  const { data: billingPlan } = await supabaseAdmin
    .from('billing_plans')
    .select('amount')
    .eq('building_id', building_id)
    .eq('company_id', company_id)
    .eq('status', 'active')
    .maybeSingle();

  if (billingPlan) return Number(billingPlan.amount) || null;

  // 3) Fallback to pricing_plan by building_type
  if (!buildingType) return null;

  const today = new Date().toISOString().slice(0, 10);
  const { data: pricing } = await supabaseAdmin
    .from('pricing_plans')
    .select('monthly_fee')
    .eq('company_id', company_id)
    .eq('building_type', buildingType)
    .eq('is_active', true)
    .lte('effective_date', today)
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pricing) return Number(pricing.monthly_fee) || null;

  return null;
}

async function runGeneration(
  company_id: number,
  cycle: { year: number; month: number },
  onlyCustomId?: string
): Promise<GenResult> {
  const result: GenResult = { generated: 0, skipped: {} };

  // Read billing settings (cutoff, due_day, auto_invoice_generation)
  const settings = await fetchSettings(company_id);

  // If auto-generation is OFF, skip entirely (company prefers manual billing)
  if (!settings.auto_invoice_generation) {
    bump(result.skipped, 'auto_generation_disabled');
    return result;
  }

  const cutoffDay = settings.cutoff_day;
  const dueDay = settings.due_day;

  // Rule 1+2+6: only active buildings of this company
  let buildingsQuery = supabaseAdmin
    .from('Buildings')
    .select('custom_id, status, building_type, pricing_plan_id')
    .eq('company_id', company_id)
    .eq('status', 'active');
  if (onlyCustomId) buildingsQuery = buildingsQuery.eq('custom_id', onlyCustomId);
  const { data: buildings } = await buildingsQuery;

  if (!buildings || buildings.length === 0) {
    if (onlyCustomId) bump(result.skipped, 'building_not_eligible');
    return result;
  }

  // Cutoff rule: activation dates
  const { data: sas } = await supabaseAdmin
    .from('service_assignments')
    .select('building_id, activated_at')
    .eq('company_id', company_id);
  const saMap = new Map<string, any>();
  (sas || []).forEach((s: any) => {
    const prev = saMap.get(s.building_id);
    if (!prev || new Date(s.activated_at) > new Date(prev.activated_at)) {
      saMap.set(s.building_id, s);
    }
  });

  for (const b of buildings) {
    const dueDate = invoiceDueDate(cycle, dueDay);

    // Resolve amount: direct link → billing_plan → pricing_plan by type → skip
    const amount = await resolveAmount(
      b.custom_id,
      company_id,
      b.building_type || null,
      b.pricing_plan_id || null
    );
    if (amount === null) {
      bump(result.skipped, 'no_pricing_plan');
      continue;
    }

    // Cutoff rule
    const sa = saMap.get(b.custom_id);
    if (
      sa?.activated_at &&
      !isBillableForCycle({ activatedAt: sa.activated_at, cycle, cutoffDay })
    ) {
      bump(result.skipped, 'cutoff_rule');
      continue;
    }

    // Rule 4: no existing invoice for this period (cancelled excluded)
    const { data: existing } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('building_id', b.custom_id)
      .eq('due_date', dueDate)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      bump(result.skipped, 'already_exists');
      continue;
    }

    const { error } = await supabaseAdmin.from('invoices').insert({
      building_id: b.custom_id,
      company_id,
      amount,
      due_date: dueDate,
      status: 'issued',
      description: `Waste service — ${periodLabel(cycle)}`,
    });

    if (error) {
      // Unique index race → treat as duplicate
      if ((error as any).code === '23505') bump(result.skipped, 'already_exists');
      else bump(result.skipped, 'insert_error');
      continue;
    }

    result.generated += 1;
  }

  return result;
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, company_id } = body;

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    const cycle = body.cycle || DEFAULT_CYCLE();

    switch (action) {
      case 'generate': {
        if (!body.custom_id) {
          return NextResponse.json({ error: 'custom_id is required' }, { status: 400 });
        }
        const result = await runGeneration(Number(company_id), cycle, body.custom_id);
        return NextResponse.json({ ok: true, ...result });
      }

      case 'generate_bulk': {
        const result = await runGeneration(Number(company_id), cycle);
        return NextResponse.json({ ok: true, ...result });
      }

      case 'regenerate': {
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('*')
          .eq('id', body.invoice_id)
          .eq('company_id', Number(company_id))
          .maybeSingle();

        if (!invoice) {
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }
        if (invoice.status === 'paid') {
          return NextResponse.json(
            { error: 'Paid invoices cannot be regenerated.' },
            { status: 409 }
          );
        }

        // Fetch building type and pricing_plan_id for amount resolution
        const { data: building } = await supabaseAdmin
          .from('Buildings')
          .select('building_type, pricing_plan_id')
          .eq('custom_id', invoice.building_id)
          .eq('company_id', Number(company_id))
          .maybeSingle();

        // Refresh amount from current plan if available
        const amount = await resolveAmount(
          invoice.building_id,
          Number(company_id),
          building?.building_type || null,
          building?.pricing_plan_id || null
        );

        const { data: updated, error } = await supabaseAdmin
          .from('invoices')
          .update({
            status: 'issued',
            amount: amount ?? invoice.amount,
            issued_at: new Date().toISOString(),
            paid_at: null,
            description: `Waste service — ${periodLabel(cycleOfDate(new Date(invoice.due_date)))}`,
          })
          .eq('id', invoice.id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, invoice: updated });
      }

      case 'cancel': {
        const { data, error } = await supabaseAdmin
          .from('invoices')
          .update({ status: 'cancelled' })
          .eq('id', body.invoice_id)
          .eq('company_id', Number(company_id))
          .neq('status', 'paid')
          .select()
          .maybeSingle();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!data) {
          return NextResponse.json(
            { error: 'Invoice not found or already paid.' },
            { status: 409 }
          );
        }

        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[BillingAPI] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}