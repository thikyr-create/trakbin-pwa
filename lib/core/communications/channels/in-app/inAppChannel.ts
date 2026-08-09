// lib/core/communications/channels/in-app/inAppChannel.ts
import { createClient } from '@supabase/supabase-js';
import type { NotificationContext } from '../../engine/notificationContext';
import type { DeliveryRecord } from '../../models';
import type { InAppNotification } from './inAppNotification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TITLES: Record<string, string> = {
  OPS_INCIDENT_REPORTED: 'Incident reported on route',
  OPS_ROUTE_ASSIGNED: 'New route assigned',
  OPS_PICKUP_COMPLETED: 'Pickup completed',
  BILLING_PAYMENT_RECEIVED: 'Payment received',
  BILLING_INVOICE_CREATED: 'New invoice issued',
};

export const inAppChannel = {
  async notify(ctx: NotificationContext): Promise<DeliveryRecord> {
    const row: InAppNotification = {
      companyId: ctx.companyId,
      recipientEmail: ctx.recipient.email,
      event: ctx.event,
      title: TITLES[ctx.event] || ctx.event,
      body: (ctx.data as any)?.summary ?? null,
    };
    const { error } = await supabase.from('notifications').insert([row]);
    if (error) {
      return { id: `inapp-failed-${Date.now()}`, status: 'failed', sentAt: new Date().toISOString(), provider: 'in_app', errorMessage: error.message };
    }
    return { id: `inapp-${Date.now()}`, status: 'delivered', sentAt: new Date().toISOString(), provider: 'in_app' };
  },

  async listUnread(companyId: number, limit = 20) {
    const { data } = await supabase.from('notifications')
      .select('*').eq('company_id', companyId).eq('read', false)
      .order('created_at', { ascending: false }).limit(limit);
    return data || [];
  },

  async markRead(id: number) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },
};