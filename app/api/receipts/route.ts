import { NextRequest, NextResponse } from 'next/server';
import { resolveReceipt, projectReceipt, ownsReceipt, type ReceiptView } from '@/lib/server/payments/receipts';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const view = (sp.get('view') || 'customer') as ReceiptView;
  const owner = sp.get('owner');
  if (view !== 'admin' && !owner) return NextResponse.json({ ok: false, error: 'owner_required' }, { status: 400 });

  const r = await resolveReceipt({ number: sp.get('number') || undefined, tx: sp.get('tx') || undefined, invoice: sp.get('invoice') || undefined });
  if (!r) return NextResponse.json({ ok: false, error: 'receipt_not_found' }, { status: 404 });
  if (!ownsReceipt(r, view, owner)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  return NextResponse.json({ ok: true, receipt: projectReceipt(r, view) });
}