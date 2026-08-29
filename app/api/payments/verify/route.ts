// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProvider } from '@/lib/server/payments/providers';
import { handleSuccessfulPayment, markFailed } from '@/lib/server/payments/engine';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { reference, provider: providerName } = await req.json();
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
      buildingId: payment.building_id 
    });

    // ── CAPTURE AUTHORIZATION CODE (for recurring charges) ──
    // Access the raw Paystack response data
    const rawVerify = verify as any;
    if (rawVerify.authorization?.authorization_code && payment.building_id) {
      const authCode = rawVerify.authorization.authorization_code;
      const reusable = rawVerify.authorization.reusable ?? false;
      const brand = rawVerify.authorization.brand || rawVerify.metadata?.brand || 'Card';
      const last4 = rawVerify.authorization.last4 || rawVerify.metadata?.last4 || '';

      // Check if we already have a saved card for this building
      const { data: existing } = await admin()
        .from('payment_methods')
        .select('id')
        .eq('building_id', payment.building_id)
        .eq('card_last_four', last4)
        .maybeSingle();

      if (existing) {
        // Update existing card with authorization code
        await admin()
          .from('payment_methods')
          .update({ 
            authorization_code: authCode,
            authorization_reusable: reusable,
            card_brand: brand,
          })
          .eq('id', existing.id);
      } else {
        // Create new payment method record
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
    // ──────────────────────────────────────────────────────────
    
    return NextResponse.json({ ...result, ok: true, purpose: payment.purpose, amount: payment.amount, reference });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'verify_failed' }, { status: 400 });
  }
}