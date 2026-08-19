// app/api/company/payouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ ok: false, reason: 'missing_companyId' }, { status: 400 });
    }

    // No PostgREST embed — join client-side to avoid FK dependency
    const [{ data: payouts, error }, { data: recipients }] = await Promise.all([
      supabaseAdmin
        .from('payouts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('company_recipients')
        .select('*')
        .eq('company_id', companyId),
    ]);

    if (error) throw error;

    const recipMap = new Map((recipients || []).map((r: any) => [r.id, r]));
    const joined = (payouts || []).map((p: any) => ({
      ...p,
      company_recipients: recipMap.get(p.recipient_id) ?? null,
    }));

    return NextResponse.json({ ok: true, payouts: joined });
  } catch (e: any) {
    console.error('[PayoutsAPI] GET error:', e);
    return NextResponse.json({ ok: false, reason: e?.message || 'internal_error' }, { status: 500 });
  }
}