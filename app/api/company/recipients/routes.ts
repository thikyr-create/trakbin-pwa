import { NextRequest, NextResponse } from 'next/server';
import { listRecipients, saveRecipient } from '@/lib/server/payments/payouts';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ ok: false, error: 'companyId_required' }, { status: 400 });
  try {
    const recipients = await listRecipients(Number(companyId));
    return NextResponse.json({ ok: true, recipients });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'list_failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.companyId || !b.bankCode || !b.accountLast4 || !b.accountName) {
      return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
    }
    const result = await saveRecipient({
      companyId: Number(b.companyId), bankCode: b.bankCode, bankName: b.bankName,
      accountLast4: b.accountLast4, accountName: b.accountName, country: b.country, currency: b.currency,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'save_failed' }, { status: 400 });
  }
}