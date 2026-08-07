// app/api/company/payouts/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payoutId } = body;

    if (!payoutId) {
      return NextResponse.json({ ok: false, reason: 'missing_payout_id' }, { status: 400 });
    }

    const { data: payout, error } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (error || !payout) {
      return NextResponse.json({ ok: false, reason: 'payout_not_found' }, { status: 404 });
    }

    if (payout.status === 'paid') {
      return NextResponse.json({ ok: true, already: true, status: 'paid' });
    }

    // Mark as paid
    const { error: updateErr } = await supabaseAdmin
      .from('payouts')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payoutId);

    if (updateErr) {
      return NextResponse.json({ ok: false, reason: updateErr.message }, { status: 500 });
    }

    // Update hauler balances
    const { data: hauler } = await supabaseAdmin
      .from('haulers')
      .select('pending_balance, withdrawn_total')
      .eq('id', payout.company_id)
      .single();

    if (hauler) {
      await supabaseAdmin
        .from('haulers')
        .update({
          pending_balance: (hauler.pending_balance || 0) - payout.amount,
          withdrawn_total: (hauler.withdrawn_total || 0) + payout.amount,
        })
        .eq('id', payout.company_id);
    }

    return NextResponse.json({ ok: true, status: 'paid' });
  } catch (e: any) {
    console.error('[PayoutsAPI] Execute error:', e);
    return NextResponse.json({ ok: false, reason: e?.message || 'internal_error' }, { status: 500 });
  }
}