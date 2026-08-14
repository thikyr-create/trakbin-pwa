// lib/super-admin/services/approval.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export interface ApprovalQueues {
  orgApplications: any[];
  verification: any[];
  propertyClaims: any[];
  subscriptionExceptions: any[];
  accountRecovery: any[];
}

const pick = (row: any, keys: string[]): any => {
  for (const k of keys) if (row?.[k] != null) return row[k];
  return null;
};

export async function getApprovalQueues(): Promise<ApprovalQueues> {
  const [h, v, sr, subs, inv] = await Promise.all([
    supabase.from('haulers').select('*'),
    supabase.from('verifications').select('*').limit(100),
    supabase.from('service_requests').select('*').eq('status', 'pending').order('submitted_at', { ascending: true }),
    supabase.from('subscriptions').select('*'),
    supabase.from('invoices').select('company_id, status'),
  ]);

  const orgApplications = (h.data || []).filter((x: any) =>
    ['pending', 'pending_approval', 'unverified'].includes(String(pick(x, ['status', 'verification_status']))));

  const verification = (v.data || []).filter((x: any) =>
    !['approved', 'rejected', 'completed'].includes(String(pick(x, ['status', 'state']))));

  const propertyClaims = sr.data || [];

  const now = Date.now();
  const lapsed = (subs.data || []).filter((s: any) =>
    ['active', 'trial'].includes(s.status) && s.current_period_end &&
    new Date(s.current_period_end).getTime() < now);
  const owing = new Set((inv.data || []).filter((i: any) => i.status === 'overdue').map((i: any) => Number(i.company_id)));
  const cancelledOwing = (subs.data || []).filter((s: any) => s.status === 'cancelled' && owing.has(Number(s.company_id)));

  return {
    orgApplications,
    verification,
    propertyClaims,
    subscriptionExceptions: [...lapsed, ...cancelledOwing],
    accountRecovery: [],
  };
}

export async function actVerification(id: string, action: 'approve' | 'reject') {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin/approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ id, action }),
  });
  return res.json();
}