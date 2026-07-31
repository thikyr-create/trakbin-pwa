import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { paystackProvider } from '@/lib/server/payments/providers/paystack';
import { handleSuccessfulPayment, markFailed } from '@/lib/server/payments/engine';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'webhook_not_configured' }, { status: 500 });

  // Verify the webhook is genuinely from Paystack (HMAC-SHA512 of the raw body).
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  if (signature !== expected) return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });

  const event = JSON.parse(raw);
  if (event.event !== 'charge.success') return NextResponse.json({ ok: true, ignored: true });

  const ref = event.data?.reference;
  if (!ref) return NextResponse.json({ ok: true });

  const { data: payment } = await admin().from('payments').select('*').eq('reference', ref).maybeSingle();
  if (!payment) return NextResponse.json({ ok: false, error: 'unknown_payment' }, { status: 404 });
  if (payment.status === 'success') return NextResponse.json({ ok: true, already: true }); // idempotent ack

  // Don't trust the webhook's amount blindly — re-verify with Paystack.
  const verify = await paystackProvider.verify(ref);
  if (verify.status !== 'success') {
    await markFailed(ref);
    return NextResponse.json({ ok: true, status: 'failed' });
  }

  await handleSuccessfulPayment(verify, { purpose: payment.purpose, invoiceId: payment.invoice_id, buildingId: payment.building_id });
  return NextResponse.json({ ok: true });
}