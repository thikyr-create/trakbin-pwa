// lib/core/communications/engine/notificationResolver.ts
import { EMAIL_EVENTS } from '../events/emailEvents';

export type ChannelName = 'email' | 'in_app' | 'push';

export interface NotificationResolution {
  channels: ChannelName[];
  critical: boolean;            // critical bypasses company opt-out
  templateKey: string | null;   // which renderer the email channel uses
}

const CRITICAL = new Set<string>([
  EMAIL_EVENTS.AUTH_OTP_REQUESTED,
  EMAIL_EVENTS.AUTH_PASSWORD_RESET_REQUESTED,
  EMAIL_EVENTS.AUTH_ACCOUNT_RECOVERY_REQUESTED,
  EMAIL_EVENTS.AUTH_2FA_ENROLLED,
  EMAIL_EVENTS.AUTH_SECURITY_ALERT,
  EMAIL_EVENTS.AUTH_DRIVER_CREDENTIALS_SENT,
]);

const IN_APP_EVENTS = new Set<string>([
  EMAIL_EVENTS.OPS_INCIDENT_REPORTED,
  EMAIL_EVENTS.OPS_ROUTE_ASSIGNED,
  EMAIL_EVENTS.OPS_PICKUP_COMPLETED,
  EMAIL_EVENTS.BILLING_PAYMENT_RECEIVED,
  EMAIL_EVENTS.BILLING_INVOICE_CREATED,
]);

const TEMPLATE_KEYS: Record<string, string> = {
  [EMAIL_EVENTS.AUTH_DRIVER_CREDENTIALS_SENT]: 'driverCredentials',
  [EMAIL_EVENTS.AUTH_OTP_REQUESTED]: 'otp',
  [EMAIL_EVENTS.AUTH_EMAIL_VERIFICATION_REQUESTED]: 'verification',
  [EMAIL_EVENTS.AUTH_PASSWORD_RESET_REQUESTED]: 'password',
  [EMAIL_EVENTS.AUTH_ACCOUNT_RECOVERY_REQUESTED]: 'recovery',
  [EMAIL_EVENTS.AUTH_2FA_ENROLLED]: 'twoFactor',
  [EMAIL_EVENTS.BILLING_INVOICE_CREATED]: 'invoice',
  [EMAIL_EVENTS.BILLING_PAYMENT_RECEIVED]: 'payment',
  [EMAIL_EVENTS.BILLING_REMINDER_DUE]: 'billingReminder',
  [EMAIL_EVENTS.OPS_ROUTE_ASSIGNED]: 'routeAssignment',
  [EMAIL_EVENTS.OPS_INCIDENT_REPORTED]: 'incident',
};

export const notificationResolver = {
  resolve(event: string): NotificationResolution {
    return {
      channels: IN_APP_EVENTS.has(event) ? ['email', 'in_app'] : ['email'],
      critical: CRITICAL.has(event),
      templateKey: TEMPLATE_KEYS[event] ?? null,
    };
  },
};