import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  // Each Promise.all entry is a full Supabase response envelope — read .data off it.
  const [settings, payments, invoices, payoutsPaid, settlements] = await Promise.all([
    admin().from('platform_settings').select('platform_revenue, commission_bps').maybeSingle(),
    admin().from('payments').select('status, amount'),
    admin().from('invoices').select('status, amount'),
    admin().from('payouts').select('amount').eq('status', 'paid'),
    admin().from('ledger_transactions').select('gross, created_at').eq('type', 'settlement').order('created_at', { ascending: true }),
  ]);

  const pay = payments.data || [];
  const success = pay.filter((p) => p.status === 'success');
  const failed = pay.filter((p) => p.status === 'failed');
  const refunded = pay.filter((p) => p.status === 'refunded');
  const totalCollections = success.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const outstanding = (invoices.data || []).filter((i) => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const withdrawn = (payoutsPaid.data || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const refundedTotal = refunded.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  // 12-month collection series for the area chart
  const now = new Date();
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-NG', { month: 'short' }), total: 0 };
  });
  const idx = new Map(buckets.map((b) => [b.key, b]));
  (settlements.data || []).forEach((s) => {
    const d = new Date(s.created_at); if (isNaN(d.getTime())) return;
    const b = idx.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    if (b) b.total += Number(s.gross) || 0;
  });

  // THE FIX: settings is an envelope, so the columns are on settings.data
  const sRow = settings.data;

  return NextResponse.json({
    ok: true,
    platformRevenue: sRow?.platform_revenue ?? 0,
    commissionBps: sRow?.commission_bps ?? 1000,
    totalCollections, outstanding, withdrawn, refundedTotal,
    counts: { success: success.length, failed: failed.length, refunded: refunded.length, total: pay.length },
    series: buckets,
  });
}