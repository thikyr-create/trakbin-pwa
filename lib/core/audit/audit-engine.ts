// lib/core/audit/audit-engine.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditCategory } from '@/lib/super-admin/types/audit';

export interface AuditArgs {
  category: AuditCategory;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  target?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

// Append-only event emission. Never throws into the caller's flow.
export async function emitAudit(client: SupabaseClient, args: AuditArgs) {
  return client.from('audit_events').insert({
    category: args.category,
    actor_id: args.actorId ?? null,
    actor_email: args.actorEmail ?? null,
    action: args.action,
    target: args.target ?? null,
    reason: args.reason ?? null,
    metadata: args.metadata || {},
  });
}