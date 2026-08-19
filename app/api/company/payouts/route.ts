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

    const { data: payouts, error } = await supabaseAdmin
      .from('payouts')
      .select('*, company_recipients(*)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ ok: true, payouts: payouts || [] });
  } catch (e: any) {
    console.error('[PayoutsAPI] GET error:', e);
    return NextResponse.json({ ok: false, reason: e?.message || 'internal_error' }, { status: 500 });
  }
}