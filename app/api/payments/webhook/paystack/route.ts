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
  
  // Signature verification (already correct)
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  if (signature !== expected) return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });

  const event = JSON.parse(raw);

  // money-IN: charge.success
  if (event.event === 'charge.success') {
    const ref = event.data?.reference;
    if (!ref) return NextResponse.json({ ok: true });
    
    // HARDENED: Atomic optimistic lock — only one webhook wins the race
    const { data: payment, error: lockErr } = await admin()
      .from('payments')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('reference', ref)
      .eq('status', 'pending') // ← Only if still pending
      .select('id, purpose, invoice_id, building_id, amount')
      .maybeSingle();
    
    if (lockErr || !payment) {
      // Either already processed (idempotent success) or unknown payment
      const { data: existing } = await admin().from('payments').select('status').eq('reference', ref).maybeSingle();
      if (existing?.status === 'success') return NextResponse.json({ ok: true, already: true });
      return NextResponse.json({ ok: false, error: 'unknown_payment' }, { status: 404 });
    }
    
    // Verify with PSP (double-check)
    const verify = await paystackProvider.verify(ref);
    
    // HARDENED: Cross-check amount
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
    
    // Process the payment
    await handleSuccessfulPayment(verify, { 
      purpose: payment.purpose, 
      invoiceId: payment.invoice_id, 
      buildingId: payment.building_id 
    });
    
    return NextResponse.json({ ok: true });
  }

  // charge.failed: PSP rejected the payment
  if (event.event === 'charge.failed') {
    const ref = event.data?.reference;
    if (!ref) return NextResponse.json({ ok: true });
    
    await markFailed(ref);
    return NextResponse.json({ ok: true, status: 'failed' });
  }

  // money-OUT: transfer events
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