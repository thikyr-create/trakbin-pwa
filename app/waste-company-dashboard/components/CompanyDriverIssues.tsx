"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { Wrench, ShieldAlert, TrafficCone, Cog, CircleHelp, CircleCheck } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });

const TYPE_ICON: Record<string, any> = { breakdown: Wrench, accident: ShieldAlert, route_blocked: TrafficCone, vehicle_fault: Cog, other: CircleHelp };
const STATUS_CHIP: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 ring-amber-200',
  acknowledged: 'bg-sky-50 text-sky-700 ring-sky-200',
  resolving: 'bg-violet-50 text-violet-700 ring-violet-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
const NEXT: Record<string, string> = { open: 'acknowledged', acknowledged: 'resolving', resolving: 'resolved' };

export default function CompanyDriverIssues() {
  const { tenant, addNotification } = useCompanySession();
  const [issues, setIssues] = useState<any[]>([]);

  const load = async () => {
    const cid = tenant.companyId; if (!cid) return;
    const { data } = await supabase.from('driver_issues').select('*').eq('company_id', cid).order('created_at', { ascending: false });
    setIssues(data || []);
  };
  useEffect(() => { if (tenant.loaded) load(); }, [tenant.loaded, tenant.companyId]);

  const advance = async (it: any) => {
    const next = NEXT[it.status]; if (!next) return;
    const patch: any = { status: next };
    if (next === 'resolved') patch.resolved_at = new Date().toISOString();
    await supabase.from('driver_issues').update(patch).eq('id', it.id);
    addNotification(`Issue ${it.issue_number} → ${next}.`, 'success');
    load();
  };

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Driver issues</h3>
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{issues.filter((i) => i.status !== 'resolved').length} open</span>
      </div>
      {issues.length === 0 ? (
        <div className="px-6 py-12 text-center"><Wrench className="mx-auto h-7 w-7 text-gray-300" /><p className="mt-3 text-sm font-bold text-gray-700">No driver issues</p><p className="mt-1 text-xs text-gray-400">Breakdowns and incidents reported by your drivers appear here.</p></div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {issues.map((it) => {
            const Icon = TYPE_ICON[it.issue_type] || CircleHelp;
            return (
              <li key={it.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"><Icon className="h-5 w-5" /></span>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-gray-900">{it.driver_name}
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${STATUS_CHIP[it.status] || STATUS_CHIP.open}`}>{it.status}</span>
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-gray-600">{it.description}</p>
                      <p className="font-mono mt-0.5 text-[10px] font-semibold text-gray-400">{it.issue_number}{it.truck_id ? ` · ${it.truck_id}` : ''}{it.location ? ` · ${it.location}` : ''}</p>
                    </div>
                  </div>
                  {it.status !== 'resolved'
                    ? <button onClick={() => advance(it)} className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Mark {NEXT[it.status]}</button>
                    : <CircleCheck className="h-5 w-5 shrink-0 text-emerald-500" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}