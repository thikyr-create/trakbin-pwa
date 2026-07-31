import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProvider } from '@/lib/server/payments/providers';
import { handleSuccessfulPayment, markFailed } from '@/lib/server/payments/engine';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { reference, provider: providerName } = await req.json();
    if (!reference) return NextResponse.json({ ok: false, error: 'reference_required' }, { status: 400 });

    const { data: payment } = await admin().from('payments').select('*').eq('reference', reference).maybeSingle();
    if (!payment) return NextResponse.json({ ok: false, error: 'unknown_payment' }, { status: 404 });
    if (payment.status === 'success') return NextResponse.json({ ok: true, already: true, purpose: payment.purpose });

    const provider = getProvider(providerName || payment.provider);
    const verify = await provider.verify(reference);
    if (verify.status !== 'success') {
      await markFailed(reference);
      return NextResponse.json({ ok: false, status: verify.status });
    }
    const result = await handleSuccessfulPayment(verify, { purpose: payment.purpose, invoiceId: payment.invoice_id, buildingId: payment.building_id });
        return NextResponse.json({ ...result, ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'verify_failed' }, { status: 400 });
  }
}