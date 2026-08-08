// lib/core/communications/providers/email/resend/resendProvider.ts
import type { EmailProvider } from '../emailProvider';
import type { EmailMessage, DeliveryRecord } from '../../../models';
import { ProviderError } from '../../../errors';
import { communicationConfig } from '../../../config/communicationConfig';
import { getResendClient } from './resendClient';

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';

  async send(message: EmailMessage): Promise<DeliveryRecord> {
    const from = message.from
      ? (message.from.name ? `${message.from.name} <${message.from.email}>` : message.from.email)
      : `${communicationConfig.fromName} <${communicationConfig.fromEmail.split('<')[1]?.replace('>', '') || communicationConfig.fromEmail}>`;

    const client = getResendClient();

    // Dry-run: log and pretend success
    if (!client) {
      if (communicationConfig.debug) {
        console.log('[communications/dry-run]', { from, to: message.to, subject: message.subject });
      }
      return { id: `dry-${Date.now()}`, status: 'dry_run', sentAt: new Date().toISOString(), provider: 'resend' };
    }

    try {
      const res = await client.emails.send({
        from,
        to: message.to.map((r) => r.name ? `${r.name} <${r.email}>` : r.email),
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        headers: message.headers,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
          content_type: a.contentType,
        })),
      });

      if (res.error) throw new ProviderError(res.error.message, undefined, res.error);

      return {
        id: res.data?.id ?? `resend-${Date.now()}`,
        status: 'sent',
        sentAt: new Date().toISOString(),
        provider: 'resend',
      };
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      throw new ProviderError(err?.message || 'Resend send failed', status, err);
    }
  }
}