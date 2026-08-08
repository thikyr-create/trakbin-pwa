// lib/core/communications/delivery/deliveryService.ts
// lib/core/communications/delivery/deliveryService.ts
import { createClient } from '@supabase/supabase-js';
import type { DeliveryStatus } from './deliveryStatus';
import type { DeliveryAttempt } from './deliveryAttempt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const deliveryService = {
  async record(attempt: DeliveryAttempt): Promise<void> {
    await supabase.from('email_delivery').insert([{
      provider_message_id: attempt.providerMessageId,
      event: attempt.event,
      recipient: attempt.recipient,
      status: attempt.status,
      occurred_at: attempt.occurredAt,
      raw: attempt.raw ?? null,
    }]);
  },

  async updateStatus(providerMessageId: string, status: DeliveryStatus, raw?: unknown): Promise<void> {
    await supabase.from('email_delivery')
      .update({ status, occurred_at: new Date().toISOString(), raw: raw ?? null })
      .eq('provider_message_id', providerMessageId);
  },
};