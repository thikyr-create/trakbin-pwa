// app/waste-company-dashboard/components/IssuesPage.tsx
"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  TriangleAlert, CalendarX, MapPin, Clock, CircleCheck, ShieldCheck,
  Building2, Hash, Inbox, ArrowUpRight,
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabase = supabaseBrowser;
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type FilterId = 'all' | 'dump' | 'miss' | 'other';
const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'dump', label: 'Dumping' }, { id: 'miss', label: 'Missed' }, { id: 'other', label: 'Other' },
];

// Lifecycle: pending/open → acknowledged → resolving → resolved
const NEXT: Record<string, string> = { pending: 'acknowledged', open: 'acknowledged', acknowledged: 'resolving', resolving: 'resolved' };
const ACTION_LABEL: Record<string, string> = { acknowledged: 'Acknowledge', resolving: 'Start resolving', resolved: 'Mark resolved' };

const TYPE: Record<string, { label: string; chip: string; rail: string; Icon: typeof TriangleAlert }> = {
  illegal_dumping: { label: 'Illegal dumping', chip: 'bg-amber-50 text-amber-700 ring-amber-200', rail: 'bg-amber-400', Icon: TriangleAlert },
  missed_collection: { label: 'Missed collection', chip: 'bg-rose-50 text-rose-700 ring-rose-200', rail: 'bg-rose-400', Icon: CalendarX },
};

function relTime(iso?: string) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function IssuesPage({ issues }: { issues: any[] }) {
  const { addNotification } = useCompanySession();
  const [filter, setFilter] = useState<FilterId>('all');
  const [items, setItems] = useState<any[]>(issues || []);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { setItems(issues || []); }, [issues]);
  const all = items;

  const advance = async (it: any) => {
    const next = NEXT[(it.status || 'open').toLowerCase()];
    if (!next) return;
    setBusyId(it.id);
    const patch: any = { status: next };
    if (next === 'resolved') patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from('environmental_issues').update(patch).eq('id', it.id);
    setBusyId(null);
    if (error) { addNotification('Update failed: ' + error.message, 'error'); return; }
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...patch } : x)));
    addNotification(`Issue ${it.issue_number || ''} → ${next}. Caretaker notified.`, 'success');
  };

  const list = useMemo(() => all.filter((it) => {
    if (filter === 'all') return true;
    if (filter === 'dump') return it.issue_type === 'illegal_dumping';
    if (filter === 'miss') return it.issue_type === 'missed_collection';
    return it.issue_type !== 'illegal_dumping' && it.issue_type !== 'missed_collection';
  }), [all, filter]);

  const open = all.filter((it) => !['resolved', 'closed'].includes((it.status || '').toLowerCase())).length;
  const dumpN = all.filter((it) => it.issue_type === 'illegal_dumping').length;
  const missN = all.filter((it) => it.issue_type === 'missed_collection').length;

  return (
    <div className={`${body.className} space-y-4`}>
      {/* header strip */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-50 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600/80">Field reports</p>
            <h2 className={`${display.className} mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl`}>Issues from your buildings</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">Reports filed by caretakers of the buildings you serve — routed here because you activated them.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            <span className="relative flex h-2 w-2">{open > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />}<span className={`relative inline-flex h-2 w-2 rounded-full ${open > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} /></span>
            {open > 0 ? `${open} need attention` : 'all clear'}
          </div>
        </div>

        {/* mini stats */}
        <div className="relative z-10 mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Open', value: open, accent: 'text-amber-600' },
            { label: 'Dumping', value: dumpN, accent: 'text-amber-600' },
            { label: 'Missed', value: missN, accent: 'text-rose-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{s.label}</p>
              <p className={`${display.className} mt-0.5 text-2xl font-extrabold tabular-nums ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <motion.button key={f.id} whileTap={{ scale: 0.96 }} onClick={() => setFilter(f.id)} className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${active ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>{f.label}</motion.button>
          );
        })}
      </div>

      {/* list */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="relative px-6 py-16 text-center">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><Inbox className="h-7 w-7 text-gray-300" /></div>
            <p className="relative mt-4 text-sm font-bold text-gray-700">{filter === 'all' ? 'No reports yet' : 'No reports of this type'}</p>
            <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">When a caretaker of one of your buildings flags dumping or a missed collection, it lands here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {list.map((it: any, i: number) => {
              const meta = TYPE[it.issue_type] || { label: it.issue_type || 'Issue', chip: 'bg-gray-100 text-gray-600 ring-gray-200', rail: 'bg-gray-300', Icon: TriangleAlert };
              const urls: string[] = Array.isArray(it.media) ? it.media : it.photo_url ? [it.photo_url] : [];
              const locMatch = String(it.description || '').match(/Location:\s*([^\n]+)/);
              const missMatch = String(it.description || '').match(/Date missed:\s*([^\n]+)/);
              const winMatch = String(it.description || '').match(/Time window:\s*([^\n]+)/);
              const st = (it.status || 'open').toLowerCase();
              const resolved = st.includes('resolv') || st.includes('clos');
              const inProgress = st.includes('progress') || st.includes('review') || st === 'acknowledged' || st === 'resolving';
              const stChip = resolved ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : inProgress ? 'bg-sky-50 text-sky-700 ring-sky-200' : 'bg-amber-50 text-amber-700 ring-amber-200';
              const stLabel = resolved ? 'Resolved' : inProgress ? 'In progress' : 'Open';
              const next = NEXT[st];
              return (
                <motion.li key={it.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} className="relative overflow-hidden px-6 py-5">
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${meta.rail}`} />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.chip}`}><meta.Icon className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-gray-900">
                          {meta.label}
                          <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${stChip}`}>{stLabel}</span>
                        </p>
                        <p className="font-mono mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-gray-400">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {it.building_id}</span>
                          <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {it.issue_number}</span>
                          <span>· {relTime(it.created_at)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400"><Clock className="h-3 w-3" /> {relTime(it.created_at)}</span>
                      {next ? (
                        <button
                          onClick={() => advance(it)}
                          disabled={busyId === it.id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:bg-gray-300"
                        >
                          {busyId === it.id ? 'Saving…' : ACTION_LABEL[next]}
                        </button>
                      ) : (
                        <CircleCheck className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  {it.issue_type === 'illegal_dumping' && locMatch ? (
                    <p className="mt-3 flex items-start gap-1.5 pl-[52px] text-xs font-semibold text-gray-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {locMatch[1].trim()}</p>
                  ) : null}
                  {it.issue_type === 'missed_collection' && missMatch ? (
                    <p className="mt-3 flex flex-wrap items-start gap-x-3 gap-y-1 pl-[52px] text-xs font-semibold text-gray-600">
                      <span className="flex items-center gap-1.5"><CalendarX className="h-3.5 w-3.5 shrink-0 text-rose-500" /> {missMatch[1].trim()}</span>
                      {winMatch ? <span className="flex items-center gap-1.5 text-gray-500"><Clock className="h-3.5 w-3.5" /> {winMatch[1].trim()}</span> : null}
                    </p>
                  ) : null}

                  {urls.length > 0 ? (
                    <div className="mt-3 flex gap-2 pl-[52px]">
                      {urls.slice(0, 4).map((u, k) => (
                        <a key={k} href={u} target="_blank" rel="noreferrer" className="group relative h-16 w-16 overflow-hidden rounded-lg ring-1 ring-gray-200 transition-transform hover:scale-105">
                          <img src={u} alt="" className="h-full w-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30"><ArrowUpRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" /></span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>

      <p className="flex items-center gap-2 px-1 text-xs font-medium text-gray-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Scoped to buildings you activated · reports from other companies’ buildings never appear here</p>
    </div>
  );
}