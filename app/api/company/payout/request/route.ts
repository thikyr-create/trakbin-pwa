import { NextRequest, NextResponse } from 'next/server';
import { requestPayout } from '@/lib/server/payments/payouts';

export async function POST(req: NextRequest) {
  try {
    const { companyId, amount, recipientId, idempotencyKey } = await req.json();
    if (!companyId || !amount || amount <= 0 || !recipientId || !idempotencyKey) {
      return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
    }
    const result = await requestPayout({ companyId: Number(companyId), amount, recipientId, idempotencyKey });
    if (result && result.ok === false) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ...result, ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'request_failed' }, { status: 400 });
  }
}