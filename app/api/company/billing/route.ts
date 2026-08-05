// app/api/company/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  invoiceDueDate,
  periodLabel,
  isBillableForCycle,
  cycleOfDate,
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

async function runGeneration(
  company_id: number,
  cycle: { year: number; month: number },
  onlyCustomId?: string
): Promise<GenResult> {
  const result: GenResult = { generated: 0, skipped: {} };

  // Company cutoff day (per-company configurable, default 25)
  const { data: hauler } = await supabaseAdmin
    .from('haulers')
    .select('billing_cutoff_day')
    .eq('id', company_id)
    .maybeSingle();
  const cutoffDay = Number(hauler?.billing_cutoff_day) || 25;

  // Rule 1+2+6: only active buildings of this company
  let buildingsQuery = supabaseAdmin
    .from('Buildings')
    .select('custom_id, status')
    .eq('company_id', company_id)
    .eq('status', 'active');
  if (onlyCustomId) buildingsQuery = buildingsQuery.eq('custom_id', onlyCustomId);
  const { data: buildings } = await buildingsQuery;

  if (!buildings || buildings.length === 0) {
    if (onlyCustomId) bump(result.skipped, 'building_not_eligible');
    return result;
  }

  // Rule 3: active billing plans
  const { data: plans } = await supabaseAdmin
    .from('billing_plans')
    .select('*')
    .eq('company_id', company_id)
    .eq('status', 'active');
  const planMap = new Map<string, any>();
  (plans || []).forEach((p: any) => planMap.set(p.building_id, p));

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
    const plan = planMap.get(b.custom_id);
    if (!plan) {
      bump(result.skipped, 'no_billing_plan');
      continue;
    }

    const dueDay = Number(plan.due_day) || 5;
    const dueDate = invoiceDueDate(cycle, dueDay);

    // Rule 5: start date reached
    if (plan.start_date && new Date(plan.start_date).getTime() > new Date(dueDate).getTime()) {
      bump(result.skipped, 'service_not_started');
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
      amount: Number(plan.amount) || 0,
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

        // Refresh amount from current plan if available
        const { data: plan } = await supabaseAdmin
          .from('billing_plans')
          .select('amount')
          .eq('building_id', invoice.building_id)
          .eq('company_id', Number(company_id))
          .eq('status', 'active')
          .maybeSingle();

        const { data: updated, error } = await supabaseAdmin
          .from('invoices')
          .update({
            status: 'issued',
            amount: plan ? Number(plan.amount) : invoice.amount,
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