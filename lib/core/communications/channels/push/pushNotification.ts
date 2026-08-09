// lib/core/communications/channels/push/pushNotification.ts
export interface PushNotification {
  token: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}