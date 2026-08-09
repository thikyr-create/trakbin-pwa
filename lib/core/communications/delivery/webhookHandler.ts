// lib/core/communications/delivery/webhookHandler.ts
import { createHmac, timingSafeEqual } from 'crypto';
import { deliveryService } from './deliveryService';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

const STATUS_MAP: Record<string, 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | 'opened' | 'clicked'> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.failed': 'failed',
};

export const resendWebhookHandler = {
  verifySignature(raw: string, sig: string | null): boolean {
    if (!WEBHOOK_SECRET || !sig) return false;
    const expected = createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
    try { return timingSafeEqual(Buffer.from(expected), Buffer.from(sig.replace('sha256=', ''))); }
    catch { return false; }
  },

  async handle(body: any): Promise<void> {
    const mapped = STATUS_MAP[body?.type];
    if (mapped && body?.data?.email_id) {
      await deliveryService.record({
        id: body.data.message_id || body.data.email_id,
        providerMessageId: body.data.email_id,
        event: body.type,
        recipient: Array.isArray(body.data.to) ? body.data.to[0] : body.data.to,
        status: mapped,
        occurredAt: body.created_at || new Date().toISOString(),
        raw: body,
      });
    }
  },
};