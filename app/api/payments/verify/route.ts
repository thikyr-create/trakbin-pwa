// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProvider } from '@/lib/server/payments/providers';
import { handleSuccessfulPayment, markFailed } from '@/lib/server/payments/engine';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function processVerification(reference: string, providerName?: string) {
  if (!reference) return NextResponse.json({ ok: false, error: 'reference_required' }, { status: 400 });

  const { data: payment } = await admin()
    .from('payments')
    .select('*')
    .eq('reference', reference)
    .maybeSingle();

  if (!payment) return NextResponse.json({ ok: false, error: 'unknown_payment' }, { status: 404 });

  if (payment.status === 'success') {
    return NextResponse.json({ already: true, ok: true, purpose: payment.purpose, amount: payment.amount, reference });
  }

  const provider = getProvider(providerName || payment.provider);
  const verify = await provider.verify(reference);

  if (verify.amount !== payment.amount) {
    await markFailed(reference);
    return NextResponse.json({ ok: false, error: 'amount_mismatch', purpose: payment.purpose, amount: payment.amount }, { status: 400 });
  }

  if (verify.status !== 'success') {
    await markFailed(reference);
    return NextResponse.json({ ok: false, status: verify.status, purpose: payment.purpose, amount: payment.amount });
  }

  const result = await handleSuccessfulPayment(verify, {
    purpose: payment.purpose,
    invoiceId: payment.invoice_id,
    buildingId: payment.building_id,
  });

  // ── CAPTURE AUTHORIZATION CODE (recurring charges) ──
  const raw = verify as any;
  if (raw.authorization?.authorization_code && payment.building_id) {
    const authCode = raw.authorization.authorization_code;
    const reusable = raw.authorization.reusable ?? false;
    const brand = raw.authorization.brand || raw.metadata?.brand || 'Card';
    const last4 = raw.authorization.last4 || raw.metadata?.last4 || '';

    const { data: existing } = await admin()
      .from('payment_methods')
      .select('id')
      .eq('building_id', payment.building_id)
      .eq('card_last_four', last4)
      .maybeSingle();

    if (existing) {
      await admin().from('payment_methods')
        .update({ authorization_code: authCode, authorization_reusable: reusable, card_brand: brand })
        .eq('id', existing.id);
    } else {
      await admin().from('payment_methods').insert({
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

  return NextResponse.json({ ...result, ok: true, purpose: payment.purpose, amount: payment.amount, reference });
}

export async function POST(req: NextRequest) {
  try {
    const { reference, provider } = await req.json();
    return await processVerification(reference, provider);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'verify_failed' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get('reference');
    const provider = req.nextUrl.searchParams.get('provider') ?? undefined;
    return await processVerification(reference ?? '', provider);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'verify_failed' }, { status: 400 });
  }
}