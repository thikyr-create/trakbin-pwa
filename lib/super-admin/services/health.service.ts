// lib/super-admin/services/health.service.ts
import { adminSupabase as supabase } from '../supabase/client';
import { runProbes, type ProbeResult } from '@/lib/core/health/probes';

export interface JobsHealth {
  emailBacklog: number;
  lastDeliveryAt: string | null;
  lastFieldRunAt: string | null;
  lastDispatchAt: string | null;
}

export interface Incident { id: string; label: string; tone: 'rose' | 'amber' }

export async function getJobsHealth(): Promise<JobsHealth> {
  const [q, d, f, a] = await Promise.all([
    supabase.from('email_queue').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
    supabase.from('email_delivery').select('created_at').order('created_at', { ascending: false }).limit(1),
    supabase.from('field_events').select('created_at').order('created_at', { ascending: false }).limit(1),
    supabase.from('assignment_events').select('created_at').order('created_at', { ascending: false }).limit(1),
  ]);
  return {
    emailBacklog: q.count || 0,
    lastDeliveryAt: d.data?.[0]?.created_at || null,
    lastFieldRunAt: f.data?.[0]?.created_at || null,
    lastDispatchAt: a.data?.[0]?.created_at || null,
  };
}

export async function getIncidents(): Promise<Incident[]> {
  const week = new Date(Date.now() - 7 * 864e5).toISOString();
  const [fp, um, fe] = await Promise.all([
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', week),
    supabase.from('psp_transfer_events').select('*', { count: 'exact', head: true }),
    supabase.from('email_delivery').select('*', { count: 'exact', head: true }).in('status', ['failed', 'bounced']).gte('created_at', week),
  ]);
  const out: Incident[] = [];
  if (fp.count) out.push({ id: 'fp', label: `${fp.count} failed payment${fp.count > 1 ? 's' : ''} in 7 days`, tone: 'rose' });
  if (um.count) out.push({ id: 'um', label: `${um.count} PSP transfer event${um.count > 1 ? 's' : ''} on record — verify reconciliation`, tone: 'amber' });
  if (fe.count) out.push({ id: 'fe', label: `${fe.count} failed email deliver${fe.count > 1 ? 'ies' : 'y'} in 7 days`, tone: 'amber' });
  return out;
}

export { runProbes, type ProbeResult };