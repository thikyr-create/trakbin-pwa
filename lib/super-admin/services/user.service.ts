// lib/super-admin/services/user.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export interface PlatformUserRow {
  id: string;
  email: string | null;
  tenantRole: string | null;
  platformRole: string | null;
  companyId: number | null;
  accountType: string | null;
}

export async function listPlatformUsers(): Promise<PlatformUserRow[]> {
  const [p, u] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('users').select('auth_id, email, account_type'),
  ]);
  const byAuth = new Map((u.data || []).map((x: any) => [x.auth_id, x]));
  return (p.data || []).map((x: any) => {
    const legacy = byAuth.get(x.id);
    return {
      id: x.id,
      email: legacy?.email || null,
      tenantRole: x.role || null,
      platformRole: x.platform_role || null,
      companyId: x.company_id != null ? Number(x.company_id) : null,
      accountType: legacy?.account_type || null,
    };
  });
}

export async function getAccessLogs(): Promise<any[]> {
  try {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    return data || [];
  } catch {
    const { data } = await supabase.from('audit_logs').select('*').limit(50);
    return data || [];
  }
}

export async function setPlatformRole(userId: string, platformRole: string | null) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ userId, platformRole }),
  });
  return res.json();
}