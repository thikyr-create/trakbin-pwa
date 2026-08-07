// app/api/company/payouts/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, amount, recipientId, idempotencyKey } = body;

    if (!companyId || !amount || !recipientId || !idempotencyKey) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 });
    }

    // Check idempotency
    const { data: existing } = await supabaseAdmin
      .from('payouts')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, already: true, payout_id: existing.id, status: existing.status });
    }

    // Fetch hauler balance
    const { data: hauler, error: haulerErr } = await supabaseAdmin
      .from('haulers')
      .select('available_balance')
      .eq('id', companyId)
      .single();

    if (haulerErr || !hauler) {
      return NextResponse.json({ ok: false, reason: 'hauler_not_found' }, { status: 404 });
    }

    if (hauler.available_balance < amount) {
      return NextResponse.json({ ok: false, reason: 'insufficient_available', available: hauler.available_balance });
    }

    if (amount < 1000) {
      return NextResponse.json({ ok: false, reason: 'below_minimum', minimum: 1000 });
    }

    // Fetch recipient
    const { data: recipient, error: recipErr } = await supabaseAdmin
      .from('company_recipients')
      .select('*')
      .eq('id', recipientId)
      .eq('company_id', companyId)
      .single();

    if (recipErr || !recipient) {
      return NextResponse.json({ ok: false, reason: 'recipient_not_found' }, { status: 404 });
    }

    // Create payout
    const { data: payout, error: payoutErr } = await supabaseAdmin
      .from('payouts')
      .insert([{
        company_id: companyId,
        recipient_id: recipientId,
        amount,
        status: 'pending',
        idempotency_key: idempotencyKey,
      }])
      .select('id')
      .single();

    if (payoutErr || !payout) {
      return NextResponse.json({ ok: false, reason: payoutErr?.message || 'insert_failed' }, { status: 500 });
    }

    // Reserve balance
    await supabaseAdmin
      .from('haulers')
      .update({ 
        available_balance: hauler.available_balance - amount,
        pending_balance: (hauler as any).pending_balance + amount 
      })
      .eq('id', companyId);

    return NextResponse.json({ ok: true, payout_id: payout.id, status: 'pending' });
  } catch (e: any) {
    console.error('[PayoutsAPI] POST error:', e);
    return NextResponse.json({ ok: false, reason: e?.message || 'internal_error' }, { status: 500 });
  }
}