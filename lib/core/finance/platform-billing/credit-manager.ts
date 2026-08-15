// lib/core/finance/platform-billing/credit-manager.ts
import { createClient } from '@supabase/supabase-js';
import { BillingPublisher } from '@/lib/core/event-bus';

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin adjustment credits — append-only ledger via RPC (idempotency key enforced).
export async function addCredit(
  args: { companyId: number; amount: number; reason?: string },
  actor?: { id: string; email?: string | null }
) {
  if (!(args.amount > 0)) return { ok: false, error: 'amount_must_be_positive' };

  const idempotencyKey = `credit-${args.companyId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await admin().rpc('record_adjustment_credit', {
    p_company_id: args.companyId,
    p_amount: args.amount,
    p_reason: args.reason || null,
    p_idempotency_key: idempotencyKey,
    p_actor_id: actor?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };

  BillingPublisher.publish('ADJUSTMENT_CREDIT_ADDED', {
    companyId: args.companyId, amount: args.amount, transactionId: (data as any)?.transaction_id,
  });
  return { ok: true, transactionId: (data as any)?.transaction_id };
}