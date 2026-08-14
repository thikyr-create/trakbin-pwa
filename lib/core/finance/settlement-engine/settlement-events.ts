// lib/core/finance/settlement-engine/settlement-events.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { emitAudit } from '@/lib/core/audit/audit-engine';
import { publish } from '@/lib/core/event-bus/platform-bus';
import { ensurePlatformSubscribers } from '@/lib/core/event-bus/subscribers';

export async function emitSettlementEvent(
  client: SupabaseClient,
  args: { actorId?: string | null; actorEmail?: string | null; action: string; companyId: number; amount?: number; metadata?: Record<string, unknown> }
) {
  ensurePlatformSubscribers(client);

  // 1. The record (audit)
  await emitAudit(client, {
    category: 'BILLING_EVENT',
    actorId: args.actorId, actorEmail: args.actorEmail,
    action: args.action,
    target: `org:${args.companyId}`,
    metadata: { companyId: args.companyId, amount: args.amount ?? null, ...(args.metadata || {}) },
  });

  // 2. The reaction (bus) — subscribers notify, extend freely later
  if (args.action.startsWith('settlement.') || args.action.startsWith('subscription.')) {
    await publish(args.action, { companyId: args.companyId, amount: args.amount, ...(args.metadata || {}) });
  }
}