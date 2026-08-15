// lib/core/finance/platform-billing/platform-overdue-manager.ts
import { createClient } from '@supabase/supabase-js';
import { BillingPublisher } from '@/lib/core/event-bus';

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Platform invoices (operator → Trakbin): unpaid past due → overdue.
export async function sweepOverduePlatformInvoices(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin()
    .from('platform_invoices')
    .select('id, company_id, amount, period')
    .eq('status', 'unpaid')
    .lt('due_date', today);
  if (!data?.length) return 0;

  const { error } = await admin().from('platform_invoices').update({ status: 'overdue' }).in('id', (data as any[]).map((d) => d.id));
  if (error) return 0;

  for (const inv of data as any[]) {
    BillingPublisher.publish('PLATFORM_INVOICE_OVERDUE', {
      companyId: inv.company_id, amount: inv.amount, invoiceId: inv.id, period: inv.period,
    });
  }
  return (data as any[]).length;
}