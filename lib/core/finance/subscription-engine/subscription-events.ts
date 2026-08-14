// lib/core/finance/subscription-engine/subscription-events.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type SubscriptionEventType =
  | 'created' | 'activated' | 'renewed' | 'expiring' | 'cancelled' | 'upgraded' | 'downgraded';

export async function emitSubscriptionEvent(
  client: SupabaseClient,
  args: { subscriptionId: string; companyId: number; type: SubscriptionEventType; metadata?: Record<string, unknown> }
) {
  return client.from('subscription_events').insert({
    subscription_id: args.subscriptionId,
    company_id: args.companyId,
    type: args.type,
    metadata: args.metadata || {},
  });
}