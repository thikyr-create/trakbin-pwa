// app/api/cron/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1) Fetch all companies with auto_invoice_generation = ON
  const { data: companies } = await supabaseAdmin
    .from('company_settings')
    .select('company_id, grace_period_days')
    .eq('auto_invoice_generation', true);

  if (!companies || companies.length === 0) {
    return NextResponse.json({
      ok: true,
      overdueMarked: 0,
      companiesProcessed: 0,
      results: [],
    });
  }

  // 2) Status maintenance — flip issued/viewed past grace to overdue
  // Each company may have a different grace_period_days
  const overdueResults: any[] = [];

  for (const company of companies) {
    const graceDays = company.grace_period_days ?? 2;
    const graceCutoff = new Date();
    graceCutoff.setDate(graceCutoff.getDate() - graceDays);
    const cutoffIso = graceCutoff.toISOString().slice(0, 10);

    const { data: overdueRows, error: overdueError } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('company_id', company.company_id)
      .in('status', ['issued', 'viewed'])
      .lt('due_date', cutoffIso)
      .select('id');

    overdueResults.push({
      company_id: company.company_id,
      marked: overdueError ? overdueError.message : (overdueRows || []).length,
    });
  }

  // 3) Bulk generation per company via the billing API (rules live there)
  const origin = req.nextUrl.origin;
  const results: any[] = [];

  for (const company of companies) {
    try {
      const res = await fetch(`${origin}/api/company/billing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': process.env.CRON_SECRET || '',
        },
        body: JSON.stringify({ action: 'generate_bulk', company_id: company.company_id }),
      });
      const data = await res.json().catch(() => null);
      results.push({
        company_id: company.company_id,
        ok: res.ok,
        generated: data?.generated ?? 0,
        skipped: data?.skipped ?? {},
      });
    } catch (err) {
      results.push({ company_id: company.company_id, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({
    ok: true,
    overdueResults,
    companiesProcessed: companies.length,
    results,
  });
}