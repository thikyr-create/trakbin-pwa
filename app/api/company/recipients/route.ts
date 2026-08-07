// app/api/company/recipients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ ok: false, reason: 'missing_company_id' }, { status: 400 });
  }

  try {
    const { data: recipients, error } = await supabaseAdmin
      .from('company_recipients')
      .select('*')
      .eq('company_id', Number(companyId))
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, recipients: recipients || [] });
  } catch (e: any) {
    console.error('[RecipientsAPI] GET error:', e);
    return NextResponse.json({ ok: false, reason: e?.message || 'fetch_failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, bankCode, bankName, accountNumber, accountLast4, accountName, country, currency } = body;

    if (!companyId || !bankCode || !accountNumber || !accountName) {
      return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
    }

    const { data: recipient, error } = await supabaseAdmin
      .from('company_recipients')
      .insert([{
        company_id: companyId,
        bank_code: bankCode,
        bank_name: bankName || null,
        account_number: accountNumber,
        account_last4: accountLast4 || accountNumber.slice(-4),
        account_name: accountName,
        country: country || 'NG',
        currency: currency || 'NGN',
      }])
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, recipient_id: recipient.id });
  } catch (e: any) {
    console.error('[RecipientsAPI] POST error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'insert_failed' }, { status: 500 });
  }
}