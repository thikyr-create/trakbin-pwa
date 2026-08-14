// lib/super-admin/types/audit.ts
export type AuditCategory =
  | 'ADMIN_ACTION' | 'SECURITY_EVENT' | 'DATA_CHANGE'
  | 'BILLING_EVENT' | 'PERMISSION_CHANGE' | 'SYSTEM_EVENT';
export interface AuditEvent {
  id: string;
  category: AuditCategory;
  actor: string;
  action: string;
  target: string | null;
  reason: string | null;
  at: string;
}