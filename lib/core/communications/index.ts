// lib/core/communications/index.ts
export { communications, EMAIL } from './engine/communicationEngine';
export { emailChannel } from './channels';
export { ResendProvider } from './providers';
export type { EmailProvider } from './providers';
export * from './templates';
export * from './events/emailEvents';
export * from './models';
export * from './errors';
export { communicationConfig } from './config/communicationConfig';
export { notificationResolver } from './engine/notificationResolver';
export { notificationDispatcher } from './engine/notificationDispatcher';
export { buildNotificationContext, type NotificationContext } from './engine/notificationContext';
export { inAppChannel } from './channels/in-app';
export { pushChannel } from './channels/push';
export { resendAttachments, resendDomains } from './providers/email/resend';
export { emailWorker } from './queue/emailWorker';
export { resendWebhookHandler } from './delivery/webhookHandler';
export { billingNotificationPolicy } from './policies/billingNotificationPolicy';