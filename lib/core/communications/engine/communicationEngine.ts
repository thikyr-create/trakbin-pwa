// lib/core/communications/engine/communicationEngine.ts
import { emailChannel, type EmailSendRequest } from '../channels/email';
import { EMAIL_EVENTS } from '../events/emailEvents';
import { buildNotificationContext } from './notificationContext';
import { notificationResolver } from './notificationResolver';
import { notificationDispatcher } from './notificationDispatcher';
import {
  renderDriverCredentialsEmail, renderOtpEmail, renderVerificationEmail,
  renderPasswordResetEmail, renderRecoveryEmail, renderTwoFactorEmail,
  type DriverCredentialsContext, type OtpContext, type VerificationContext,
  type PasswordResetContext, type RecoveryContext, type TwoFactorContext,
} from '../templates';
import { communicationConfig } from '../config/communicationConfig';
import { CommunicationError } from '../errors';
import type { DeliveryRecord } from '../models';
import { emailPolicy } from '../policies/emailPolicy';

/**
 * The single entry point for every business email in Trakbin.
 * Never import Resend or emailChannel from a business module — go through here.
 */
export const communications = {
  async sendDriverCredentials(c: DriverCredentialsContext): Promise<DeliveryRecord> {
    const { subject, html, text } = renderDriverCredentialsEmail({
      ...c,
      loginUrl: c.loginUrl || `${communicationConfig.appBaseUrl}/auth?prefill=${encodeURIComponent(c.employeeId)}`,
    });
    return this.send({ to: { email: inferEmail(c), name: c.driverName }, subject, html, text });
  },

  async sendOtp(c: OtpContext): Promise<DeliveryRecord> {
    const { subject, html, text } = renderOtpEmail(c);
    return this.send({ to: { email: c.email }, subject, html, text });
  },

  async sendVerification(c: VerificationContext & { email: string }): Promise<DeliveryRecord> {
    const { subject, html, text } = renderVerificationEmail(c);
    return this.send({ to: { email: c.email, name: c.name }, subject, html, text });
  },

  async sendPasswordReset(c: PasswordResetContext & { email: string }): Promise<DeliveryRecord> {
    const { subject, html, text } = renderPasswordResetEmail(c);
    return this.send({ to: { email: c.email, name: c.name }, subject, html, text });
  },

  async sendRecoveryCodes(c: RecoveryContext & { email: string }): Promise<DeliveryRecord> {
    const { subject, html, text } = renderRecoveryEmail(c);
    return this.send({ to: { email: c.email, name: c.name }, subject, html, text });
  },

  async sendTwoFactorEnrolled(c: TwoFactorContext & { email: string }): Promise<DeliveryRecord> {
    const { subject, html, text } = renderTwoFactorEmail(c);
    return this.send({ to: { email: c.email, name: c.name }, subject, html, text });
  },

  async dispatch(
    event: string,
    companyId: number | null,
    recipient: { email: string; name?: string },
    data: Record<string, any> = {}
  ) {
    const resolution = notificationResolver.resolve(event);
    if (!resolution.critical && companyId) {
      const gate = await emailPolicy.gate(companyId, event);
      if (!gate.allow) return [];
    }
    const ctx = buildNotificationContext(event, companyId, recipient, data);
    return notificationDispatcher.dispatch(ctx, resolution);
  },

  /** Low-level escape hatch. Prefer the named methods above. */
  async send(req: EmailSendRequest): Promise<DeliveryRecord> {
    try {
      return await emailChannel.send(req);
    } catch (err) {
      // Never throw to the caller — email failures must not break user operations.
      console.error('[communications] send failed', { event: req.subject, err });
      return {
        id: `failed-${Date.now()}`,
        status: 'failed',
        sentAt: new Date().toISOString(),
        provider: 'resend',
        errorMessage: err instanceof Error ? err.message : 'unknown',
      };
    }
  },
};

// Events registry — so business modules can `publish(EVENTS.AUTH_OTP_REQUESTED, …)`
export const EMAIL = EMAIL_EVENTS;

function inferEmail(c: any): string {
  // The driver-credentials context is built from driver data; email lives on the driver record.
  // Caller must pass it explicitly. This helper is defensive only.
  if (typeof c.email === 'string') return c.email;
  throw new CommunicationError('Driver credentials context missing email');
}