// lib/core/finance/platform-billing/platform-invoice-generator.ts
import { createClient } from '@supabase/supabase-js';
import { resolvePlan } from '../subscription-engine/plan-resolver';
import { BillingPublisher } from '@/lib/core/event-bus';

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Trakbin bills OPERATORS for platform use — one invoice per active subscription per period.
// Idempotent per (subscription, period). Building invoices stay operator-side.
export async function generatePlatformInvoices(actorId?: string | null): Promise<number> {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dueIso = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

  const { data: subs } = await admin().from('subscriptions').select('id, company_id, plan').eq('status', 'active');
  if (!subs?.length) return 0;

  const { data: existing } = await admin().from('platform_invoices').select('subscription_id').eq('period', period);
  const have = new Set((existing || []).map((e: any) => e.subscription_id));

  const rows = (subs as any[])
    .filter((s) => !have.has(s.id))
    .map((s) => ({
      company_id: s.company_id,
      subscription_id: s.id,
      period,
      amount: resolvePlan(s.plan).monthlyFee,
      status: 'unpaid',
      due_date: dueIso,
    }));

  if (!rows.length) return 0;
  const { error } = await admin().from('platform_invoices').insert(rows);
  if (error) throw new Error(error.message);

  for (const r of rows) {
    BillingPublisher.publish('PLATFORM_INVOICE_CREATED', {
      companyId: r.company_id, amount: r.amount, invoiceId: null, period: r.period,
    });
  }
  return rows.length;
}

export async function markPlatformInvoicePaid(invoiceId: string, actorId?: string | null) {
  const { data: inv } = await admin().from('platform_invoices').select('*').eq('id', invoiceId).maybeSingle();
  if (!inv) return { ok: false, error: 'platform_invoice_not_found' };
  if (inv.status === 'paid') return { ok: false, error: 'already_paid' };

  const { error } = await admin().from('platform_invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoiceId);
  if (error) return { ok: false, error: error.message };

  BillingPublisher.publish('PLATFORM_INVOICE_PAID', {
    companyId: inv.company_id, amount: inv.amount, invoiceId: inv.id,
  });
  return { ok: true };
}