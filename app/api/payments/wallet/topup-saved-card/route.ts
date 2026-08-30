// app/api/wallet/topup-saved-card/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { creditWalletForTopup } from '@/lib/server/payments/ledger';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { buildingId, amount, authorizationCode, email } = await req.json();
    if (!buildingId || !amount || !authorizationCode || !email)
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    if (!PAYSTACK_SECRET)
      return NextResponse.json({ ok: false, error: 'paystack_not_configured' }, { status: 500 });

    const reference = `topup_saved_${buildingId}_${Date.now()}`;

    const chargeRes = await fetch('https://api.paystack.co/transaction/charge_authorization', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount, authorization_code: authorizationCode, reference }),
    });
    const chargeData = await chargeRes.json();
    if (!chargeData.status || chargeData.data?.status !== 'success')
      return NextResponse.json({ ok: false, error: chargeData.message || 'charge_failed' });

    const amountNaira = Math.round(amount / 100);
    const topup = await creditWalletForTopup(buildingId, amountNaira, reference, 'paystack');

    await admin().from('payments').insert({
      provider: 'paystack', reference, building_id: buildingId, payer_email: email,
      purpose: 'topup', method: 'card', channel: 'card',
      amount: amountNaira, currency: 'NGN', status: 'success',
      ledger_topup_tx: topup?.transaction_id ?? null,
    });

    return NextResponse.json({ ok: true, reference, amount: amountNaira });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'topup_failed' }, { status: 400 });
  }
}