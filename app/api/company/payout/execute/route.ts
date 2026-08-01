import { NextRequest, NextResponse } from 'next/server';
import { executePayout } from '@/lib/server/payments/payouts';

export async function POST(req: NextRequest) {
  try {
    const { payoutId } = await req.json();
    if (!payoutId) return NextResponse.json({ ok: false, error: 'payoutId_required' }, { status: 400 });
    const result = await executePayout(payoutId);
    if (result && result.ok === false) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ...result, ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'execute_failed' }, { status: 400 });
  }
}