// lib/core/finance/settlement-engine/settlement-events.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { emitAudit } from '@/lib/core/audit/audit-engine';
import { BillingPublisher } from '@/lib/core/event-bus/publishers/BillingPublisher';
import type { PlatformEventType } from '@/lib/core/event-bus/events';

// Map action strings → first-class platform events
const ACTION_TO_EVENT: Record<string, PlatformEventType> = {
  'settlement.requested': 'SETTLEMENT_REQUESTED',
  'settlement.approve': 'SETTLEMENT_APPROVED',
  'settlement.reject': 'SETTLEMENT_REJECTED',
  'settlement.complete': 'SETTLEMENT_COMPLETED',
  'subscription.created': 'SUBSCRIPTION_CREATED',
  'subscription.created_trial': 'SUBSCRIPTION_CREATED',
  'subscription.activated': 'SUBSCRIPTION_CREATED',
  'subscription.renewed': 'SUBSCRIPTION_RENEWED',
  'subscription.cancelled': 'SUBSCRIPTION_CANCELLED',
  'subscription.expiring': 'SUBSCRIPTION_EXPIRING',
};

export async function emitSettlementEvent(
  client: SupabaseClient,
  args: { actorId?: string | null; actorEmail?: string | null; action: string; companyId: number; amount?: number; metadata?: Record<string, unknown> }
) {
  // 1. The record (audit)
  await emitAudit(client, {
    category: 'BILLING_EVENT',
    actorId: args.actorId, actorEmail: args.actorEmail,
    action: args.action,
    target: `org:${args.companyId}`,
    metadata: { companyId: args.companyId, amount: args.amount ?? null, ...(args.metadata || {}) },
  });

  // 2. The reaction (real event bus)
  const event = ACTION_TO_EVENT[args.action];
  if (event) {
    BillingPublisher.publish(event, {
      companyId: args.companyId, amount: args.amount ?? null, ...(args.metadata || {}),
    });
  }
}