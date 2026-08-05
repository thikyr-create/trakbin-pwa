// app/api/cron/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default grace: overdue = due_date + 2 days passed
const GRACE_DAYS = 2;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1) Status maintenance — flip issued/viewed past grace to overdue
  const graceCutoff = new Date();
  graceCutoff.setDate(graceCutoff.getDate() - GRACE_DAYS);
  const cutoffIso = graceCutoff.toISOString().slice(0, 10);

  const { data: overdueRows, error: overdueError } = await supabaseAdmin
    .from('invoices')
    .update({ status: 'overdue' })
    .in('status', ['issued', 'viewed'])
    .lt('due_date', cutoffIso)
    .select('id');

  // 2) Every company with at least one active plan
  const { data: plans } = await supabaseAdmin
    .from('billing_plans')
    .select('company_id')
    .eq('status', 'active');

  const companyIds = [
    ...new Set((plans || []).map((p: any) => p.company_id).filter(Boolean)),
  ];

  // 3) Bulk generation per company via the billing API (rules live there)
  const origin = req.nextUrl.origin;
  const results: any[] = [];

  for (const cid of companyIds) {
    try {
      const res = await fetch(`${origin}/api/company/billing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_bulk', company_id: cid }),
      });
      const data = await res.json().catch(() => null);
      results.push({
        company_id: cid,
        ok: res.ok,
        generated: data?.generated ?? 0,
        skipped: data?.skipped ?? {},
      });
    } catch (err) {
      results.push({ company_id: cid, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({
    ok: true,
    overdueMarked: overdueError ? overdueError.message : (overdueRows || []).length,
    companiesProcessed: companyIds.length,
    results,
  });
}