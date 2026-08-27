import { NextRequest, NextResponse } from 'next/server';
import { initializePayment } from '@/lib/server/payments/engine';
import { DEFAULT_PROVIDER } from '@/lib/server/payments/providers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, purpose, invoiceId, buildingId, email, method, provider } = body;
    if (!amount || amount <= 0 || !buildingId || !email || !purpose) {
      return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
    }
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'https://trakbin.vercel.app';
    const result = await initializePayment({
      amount, purpose, invoiceId, buildingId, email, method,
      provider: provider || DEFAULT_PROVIDER,
      callbackUrl: `${origin}/payments/callback`,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'initialize_failed' }, { status: 400 });
  }
}