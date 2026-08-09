// lib/core/communications/channels/in-app/inAppNotification.ts
export interface InAppNotification {
  companyId: number | null;
  recipientEmail?: string | null;
  event: string;
  title: string;
  body?: string | null;
}