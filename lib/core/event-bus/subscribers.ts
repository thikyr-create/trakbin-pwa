// lib/core/event-bus/subscribers.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { subscribe } from './platform-bus';
import { TOPICS } from './topics';

let registered = false;

// Side effects live HERE, not in the publishers:
// subscription/settlement/org events fan out to in-app notifications for the org's users.
export function ensurePlatformSubscribers(client: SupabaseClient) {
  if (registered) return;
  registered = true;

  const notifyOrg = async (companyId: number, title: string, body: string) => {
    try {
      const { data: profiles } = await client.from('profiles').select('id').eq('company_id', companyId);
      if (!profiles?.length) return;
      await client
        .from('notifications')
        .insert(profiles.map((p: any) => ({ user_id: p.id, title, body, read: false })));
    } catch {
      /* a subscriber never breaks the publisher */
    }
  };

  subscribe(TOPICS.SUBSCRIPTION_CREATED, (p) => notifyOrg(p.companyId, 'Subscription activated', `Your ${p.plan ?? ''} subscription is live. Unlimited volume, capabilities per plan.`));
  subscribe(TOPICS.SUBSCRIPTION_RENEWED, (p) => notifyOrg(p.companyId, 'Subscription renewed', 'Your subscription was renewed for another 30 days.'));
  subscribe(TOPICS.SUBSCRIPTION_CANCELLED, (p) => notifyOrg(p.companyId, 'Subscription cancelled', 'Your subscription was cancelled. Contact the platform team to reactivate.'));
  subscribe(TOPICS.SUBSCRIPTION_EXPIRING, (p) => notifyOrg(p.companyId, 'Subscription expiring', 'Your subscription expires within 7 days. Renew to avoid interruption.'));
  subscribe(TOPICS.SETTLEMENT_COMPLETE, (p) => notifyOrg(p.companyId, 'Settlement completed', `A settlement of ₦${Number(p.amount || 0).toLocaleString('en-NG')} was completed to your account.`));
}