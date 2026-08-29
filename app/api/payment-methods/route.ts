import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.buildingId || !b.instrumentType) return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
    const { data: existing } = await admin().from('payment_methods').select('id').eq('building_id', b.buildingId);
    const isDefault = !existing || existing.length === 0;
    const row: any = {
      building_id: b.buildingId, instrument_type: b.instrumentType, provider: b.provider ?? 'paystack',
      country: b.country ?? 'NG', currency: b.currency ?? 'NGN', is_default: isDefault,
      type: b.instrumentType === 'bank_account' ? 'bank' : b.instrumentType,
    };
    if (b.instrumentType === 'bank_account') {
      const full = String(b.accountNumber || '').replace(/[^\d]/g, '');
      if (!b.bankCode || !full || full.length < 8 || !b.accountName) return NextResponse.json({ ok: false, error: 'bank_details_required' }, { status: 400 });
      row.bank_code = b.bankCode; row.bank_name = b.bankName ?? null;
      row.account_number = full; row.account_last4 = full.slice(-4); row.account_name = b.accountName;
    }
    if (b.instrumentType === 'card') { row.card_last_four = b.cardLast4 ?? null; row.card_brand = b.cardBrand ?? 'card'; }

    // Structured billing address + issuer metadata (jsonb)
    if (b.metadata) row.metadata = b.metadata;

    const { error } = await admin().from('payment_methods').insert([row]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || 'save_failed' }, { status: 400 }); }
}