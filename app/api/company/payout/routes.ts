// app/api/company/payouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ ok: false, reason: 'missing_company_id' }, { status: 400 });
  }

  try {
    const { data: payouts, error } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .eq('company_id', Number(companyId))
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ ok: true, payouts: payouts || [] });
  } catch (e: any) {
    console.error('[PayoutsAPI] GET error:', e);
    return NextResponse.json({ ok: false, reason: e?.message || 'fetch_failed' }, { status: 500 });
  }
}