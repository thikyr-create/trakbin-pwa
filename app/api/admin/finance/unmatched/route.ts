import { NextResponse } from 'next/server';
import { listUnmatched } from '@/lib/server/payments/reconcile';

export async function GET() {
  try { return NextResponse.json({ ok: true, events: await listUnmatched() }); }
  catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || 'list_failed' }, { status: 500 }); }
}