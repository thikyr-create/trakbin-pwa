// app/api/admin/billing/actions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProvider, DEFAULT_PROVIDER } from '@/lib/server/payments/providers';
import { handleSuccessfulPayment, markFailed } from '@/lib/server/payments/engine';
import { generatePlatformInvoices, markPlatformInvoicePaid } from '@/lib/core/finance/platform-billing/platform-invoice-generator';
import { addCredit } from '@/lib/core/finance/platform-billing/credit-manager';
import { sweepOverduePlatformInvoices } from '@/lib/core/finance/platform-billing/platform-overdue-manager';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 403 });

    const body = await req.json();

    switch (body.action) {
      case 'overdue_sweep':
        return NextResponse.json({ ok: true, swept: await sweepOverduePlatformInvoices() });

      case 'run_platform_invoicing':
        return NextResponse.json({ ok: true, created: await generatePlatformInvoices(user.id) });

      case 'mark_platform_paid':
        return NextResponse.json(await markPlatformInvoicePaid(body.invoiceId, user.id));

      case 'verify_payment': {
        // Re-verify against the provider (source of truth), then dispatch through your engine
        const { data: p } = await admin.from('payments').select('*').eq('id', body.paymentId).maybeSingle();
        if (!p) return NextResponse.json({ ok: false, error: 'payment_not_found' });
        if (!p.reference) return NextResponse.json({ ok: false, error: 'no_provider_reference' });

        const provider = getProvider((p.provider as any) || DEFAULT_PROVIDER);
        const verify = await provider.verify(p.reference);
        if (verify.status === 'success') {
          const result = await handleSuccessfulPayment(verify, {
            purpose: p.purpose, invoiceId: p.invoice_id, buildingId: p.building_id,
          });
          // result already contains { ok: true, ... } from engine — spread first, status last
          return NextResponse.json({ ...result, status: 'success' });
        } else if (verify.status === 'failed') {
          await markFailed(p.reference);
          return NextResponse.json({ ok: true, status: 'failed' });
        }
        return NextResponse.json({ ok: true, status: verify.status || 'unknown' });
      }

      case 'add_credit':
        return NextResponse.json(await addCredit(
          { companyId: Number(body.companyId), amount: Number(body.amount), reason: body.reason },
          { id: user.id, email: user.email }
        ));

      default:
        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}