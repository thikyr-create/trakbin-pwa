// lib/core/communications/engine/notificationDispatcher.ts
import type { NotificationContext } from './notificationContext';
import type { NotificationResolution } from './notificationResolver';
import { emailChannel } from '../channels/email';
import { inAppChannel } from '../channels/in-app';
import { pushChannel } from '../channels/push';
import * as templates from '../templates';
import type { DeliveryRecord } from '../models';

const RENDERERS: Record<string, (data: any) => { subject: string; html: string; text?: string }> = {
  driverCredentials: templates.renderDriverCredentialsEmail,
  otp: templates.renderOtpEmail,
  verification: templates.renderVerificationEmail,
  password: templates.renderPasswordResetEmail,
  recovery: templates.renderRecoveryEmail,
  twoFactor: templates.renderTwoFactorEmail,
  invoice: templates.renderInvoiceEmail,
  payment: templates.renderPaymentReceivedEmail,
  billingReminder: templates.renderBillingReminderEmail,
  routeAssignment: templates.renderRouteAssignmentEmail,
  incident: templates.renderIncidentReportedEmail,
  receipt: templates.renderReceiptEmail,
  driverAssignment: templates.renderDriverAssignmentEmail,
  pickup: templates.renderPickupCompletedEmail,
  accountChange: templates.renderAccountChangeEmail,
  accountDeactivated: templates.renderAccountDeactivatedEmail,
  reportReady: templates.renderReportReadyEmail,
};

export const notificationDispatcher = {
  async dispatch(ctx: NotificationContext, res: NotificationResolution): Promise<DeliveryRecord[]> {
    const results: DeliveryRecord[] = [];
    for (const channel of res.channels) {
      if (channel === 'email') {
        const render = res.templateKey ? RENDERERS[res.templateKey] : null;
        if (!render) continue; // no template registered → skip email
        const { subject, html, text } = render({ ...ctx.data, email: ctx.recipient.email, name: ctx.recipient.name });
        results.push(await emailChannel.send({ to: ctx.recipient, subject, html, text }));
      } else if (channel === 'in_app') {
        results.push(await inAppChannel.notify(ctx));
      } else if (channel === 'push') {
        try { await pushChannel.notify(ctx); } catch { /* sanctioned empty channel */ }
      }
    }
    return results;
  },
};