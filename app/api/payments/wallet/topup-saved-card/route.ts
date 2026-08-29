// app/api/wallet/topup-saved-card/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { buildingId, amount, authorizationCode, email } = await req.json();
    
    if (!buildingId || !amount || !authorizationCode || !email) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    }

    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ ok: false, error: 'paystack_not_configured' }, { status: 500 });
    }

    // 1. Charge the saved authorization code
    const reference = `topup_saved_${buildingId}_${Date.now()}`;
    const chargeRes = await fetch('https://api.paystack.co/transaction/charge_authorization', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount, // in kobo (already converted by client)
        authorization_code: authorizationCode,
        reference,
      }),
    });

    const chargeData = await chargeRes.json();

    if (!chargeData.status) {
      return NextResponse.json({ 
        ok: false, 
        error: chargeData.message || 'charge_failed',
        code: chargeData.data?.gateway_response || 'unknown'
      });
    }

    // 2. Verify the transaction
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const verifyData = await verifyRes.json();

    if (verifyData.data.status !== 'success') {
      return NextResponse.json({ ok: false, error: 'payment_not_confirmed' });
    }

    // 3. Credit the wallet (mirror the verify/route.ts logic)
    const amountNaira = amount / 100;
    
    // Insert wallet transaction
    const { error: txError } = await admin()
      .from('wallet_transactions')
      .insert({
        building_id: buildingId,
        amount: amountNaira,
        type: 'topup',
        status: 'completed',
        reference,
        description: `Wallet top-up via saved card`,
      });

    if (txError) {
      return NextResponse.json({ ok: false, error: 'wallet_tx_failed: ' + txError.message });
    }

    // 4. Update wallet balance
    const { data: wallet } = await admin()
      .from('wallets')
      .select('balance')
      .eq('building_id', buildingId)
      .maybeSingle();

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + amountNaira;

    if (wallet) {
      await admin()
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('building_id', buildingId);
    } else {
      await admin()
        .from('wallets')
        .insert({
          building_id: buildingId,
          balance: newBalance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ 
      ok: true, 
      reference,
      amount: amountNaira,
      newBalance 
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'topup_failed' }, { status: 400 });
  }
}