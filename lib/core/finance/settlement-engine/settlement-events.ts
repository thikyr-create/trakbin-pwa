// lib/core/finance/settlement-engine/settlement-events.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { emitAudit } from '@/lib/core/audit/audit-engine';

export async function emitSettlementEvent(
  client: SupabaseClient,
  args: { actorId?: string | null; actorEmail?: string | null; action: string; companyId: number; amount?: number; metadata?: Record<string, unknown> }
) {
  return emitAudit(client, {
    category: 'BILLING_EVENT',
    actorId: args.actorId, actorEmail: args.actorEmail,
    action: args.action,
    target: `org:${args.companyId}`,
    metadata: { companyId: args.companyId, amount: args.amount ?? null, ...(args.metadata || {}) },
  });
}