import { NextRequest, NextResponse } from 'next/server';
import { reconcile } from '@/lib/server/payments/reconcile';

export async function POST(req: NextRequest) {
  try {
    const { eventId, payoutId } = await req.json();
    if (!eventId || !payoutId) return NextResponse.json({ ok: false, error: 'eventId_and_payoutId_required' }, { status: 400 });
    const result = await reconcile(eventId, payoutId);
    if (result && result.ok === false) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ...result, ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || 'reconcile_failed' }, { status: 400 }); }
}