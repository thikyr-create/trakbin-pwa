import { NextRequest, NextResponse } from 'next/server';
import { chargeLinkedBank } from '@/lib/server/payments/engine';

export async function POST(req: NextRequest) {
  try {
    const { buildingId, methodId, amount, email } = await req.json();
    if (!buildingId || !methodId || !amount || amount <= 0 || !email) {
      return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
    }
    const result = await chargeLinkedBank({ buildingId, methodId, amount, email });
    return NextResponse.json({ ...result, ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'fund_failed' }, { status: 400 });
  }
}