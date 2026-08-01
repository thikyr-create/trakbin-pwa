import { NextRequest, NextResponse } from 'next/server';
import { listPayouts } from '@/lib/server/payments/payouts';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ ok: false, error: 'companyId_required' }, { status: 400 });
  try {
    const payouts = await listPayouts(Number(companyId));
    return NextResponse.json({ ok: true, payouts });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'list_failed' }, { status: 500 });
  }
}