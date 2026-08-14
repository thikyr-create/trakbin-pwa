// lib/core/finance/subscription-engine/expiration-manager.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { emitSubscriptionEvent } from './subscription-events';
import { publish } from '@/lib/core/event-bus/platform-bus';
import { TOPICS } from '@/lib/core/event-bus/topics';
import { ensurePlatformSubscribers } from '@/lib/core/event-bus/subscribers';

// Flips active/trial → expiring when the period ends within 7 days, and emits.
export async function detectExpiringSubscriptions(client: SupabaseClient): Promise<number> {
  ensurePlatformSubscribers(client);
  const nowIso = new Date().toISOString();
  const soonIso = new Date(Date.now() + 7 * 864e5).toISOString();

  const { data } = await client
    .from('subscriptions')
    .select('id, company_id, current_period_end')
    .in('status', ['active', 'trial'])
    .gte('current_period_end', nowIso)
    .lte('current_period_end', soonIso);

  let flipped = 0;
  for (const s of data || []) {
    const { error } = await client.from('subscriptions').update({ status: 'expiring' }).eq('id', s.id);
    if (error) continue;
    flipped++;
    await emitSubscriptionEvent(client, { subscriptionId: s.id, companyId: s.company_id, type: 'expiring' }).catch(() => {});
    await publish(TOPICS.SUBSCRIPTION_EXPIRING, { companyId: s.company_id });
  }
  return flipped;
}