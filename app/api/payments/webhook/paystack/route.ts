// app/api/payments/webhook/paystack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { paystackProvider } from '@/lib/server/payments/providers/paystack';
import { handleSuccessfulPayment, markFailed } from '@/lib/server/payments/engine';
import { finalizeByReference } from '@/lib/server/payments/payouts';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'webhook_not_configured' }, { status: 500 });
  
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  if (signature !== expected) return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });

  const event = JSON.parse(raw);

  if (event.event === 'charge.success') {
    const ref = event.data?.reference;
    if (!ref) return NextResponse.json({ ok: true });
    
    const { data: payment, error: lockErr } = await admin()
      .from('payments')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('reference', ref)
      .eq('status', 'pending')
      .select('id, purpose, invoice_id, building_id, amount, provider')
      .maybeSingle();
    
    if (lockErr || !payment) {
      const { data: existing } = await admin().from('payments').select('status').eq('reference', ref).maybeSingle();
      if (existing?.status === 'success') return NextResponse.json({ ok: true, already: true });
      return NextResponse.json({ ok: false, error: 'unknown_payment' }, { status: 404 });
    }
    
    const verify = await paystackProvider.verify(ref);
    
    if (verify.amount !== payment.amount) {
      await admin().from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', ref);
      await markFailed(ref);
      return NextResponse.json({ ok: false, error: 'amount_mismatch' }, { status: 400 });
    }
    
    if (verify.status !== 'success') {
      await admin().from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', ref);
      await markFailed(ref);
      return NextResponse.json({ ok: true, status: 'failed' });
    }
    
    await handleSuccessfulPayment(verify, { 
      purpose: payment.purpose, 
      invoiceId: payment.invoice_id, 
      buildingId: payment.building_id 
    });

    // ── CAPTURE AUTHORIZATION CODE (same as verify route) ──
    // NEW (reads the nested Paystack payload):
const payload: any = (verify as any).raw ?? verify;
const auth = payload?.authorization;
if (auth?.authorization_code && payment.building_id) {
  const authCode = auth.authorization_code;
  const reusable = auth.reusable ?? false;
  const brand = auth.brand || payload?.metadata?.brand || 'Card';
  const last4 = auth.last4 || payload?.metadata?.last4 || '';

      const { data: existing } = await admin()
        .from('payment_methods')
        .select('id')
        .eq('building_id', payment.building_id)
        .eq('card_last_four', last4)
        .maybeSingle();

      if (existing) {
        await admin()
          .from('payment_methods')
          .update({ authorization_code: authCode, authorization_reusable: reusable, card_brand: brand })
          .eq('id', existing.id);
      } else {
        await admin()
          .from('payment_methods')
          .insert({
            building_id: payment.building_id,
            instrument_type: 'card',
            type: 'card',
            provider: payment.provider || 'paystack',
            card_brand: brand,
            card_last_four: last4,
            authorization_code: authCode,
            authorization_reusable: reusable,
            is_default: false,
            country: 'NG',
            currency: 'NGN',
          });
      }
    }
    // ─────────────────────────────────────────────────────────

    return NextResponse.json({ ok: true });
  }

  if (event.event === 'charge.failed') {
    const ref = event.data?.reference;
    if (!ref) return NextResponse.json({ ok: true });
    await markFailed(ref);
    return NextResponse.json({ ok: true, status: 'failed' });
  }

  if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
    const code = event.data?.transfer_code;
    if (!code) return NextResponse.json({ ok: true });
    const fee = event.data?.fees != null ? Math.round(event.data.fees / 100) : null;
    const amount = event.data?.amount != null ? Math.round(event.data.amount / 100) : null;
    const currency = event.data?.currency ?? null;
    const outcome: 'paid' | 'failed' | 'reversed' =
      event.event === 'transfer.success' ? 'paid' : event.event === 'transfer.reversed' ? 'reversed' : 'failed';
    const res = await finalizeByReference(code, outcome, { pspFee: fee, amount, currency, raw: event.data });
    return NextResponse.json(res);
  }

  return NextResponse.json({ ok: true, ignored: true });
}