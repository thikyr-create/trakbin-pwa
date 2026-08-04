"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Building2, Users, Truck, Inbox, Activity, AlertTriangle, ArrowUpRight, Wallet } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { formatNaira } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props {
  trucks: any[]; drivers: any[]; buildings: any[]; collections: any[]; issues: any[];
  setActivePage: (p: any) => void;
}

export default function OverviewPage({ trucks, drivers, buildings, collections, issues, setActivePage }: Props) {
  const { serviceRequests, earnings } = useCompanySession();

  const onRoad = trucks.filter((t) => t.status === 'on_route' || t.status === 'active').length;
  const now = new Date();
  const collectionsThisMonth = useMemo(() => collections.filter((c) => {
    const d = new Date(c.collection_date); return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }), [collections, now.getMonth(), now.getFullYear()]);
  const openIssues = issues.filter((i) => !['resolved', 'closed'].includes((i.status || '').toLowerCase()));

  const cards = [
    { Icon: Building2, label: 'Buildings served', value: buildings.length, page: 'buildings', tone: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
    { Icon: Users, label: 'Crew', value: drivers.length, page: 'drivers', tone: 'text-sky-600 bg-sky-50 ring-sky-100' },
    { Icon: Truck, label: 'Fleet on road', value: onRoad, page: 'fleet', tone: 'text-violet-600 bg-violet-50 ring-violet-100', live: onRoad > 0 },
    { Icon: Inbox, label: 'Pending requests', value: serviceRequests.length, page: 'service-requests', tone: 'text-amber-600 bg-amber-50 ring-amber-100', pulse: serviceRequests.length > 0 },
        { Icon: Activity, label: 'Collections this month', value: collectionsThisMonth.length, page: 'analytics', tone: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
    { Icon: AlertTriangle, label: 'Open issues', value: openIssues.length, page: 'issues', tone: 'text-rose-600 bg-rose-50 ring-rose-100', pulse: openIssues.length > 0 },
  ];

  return (
    <div className="space-y-4">
      {/* clickable live metric cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c, i) => (
          <motion.button key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }} onClick={() => setActivePage(c.page)} className="group relative overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${c.tone}`}><c.Icon className="h-5 w-5" /></span>
              <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500" />
            </div>
            <p className={`${display.className} mt-3 text-3xl font-extrabold tabular-nums text-gray-900`}>{c.value}</p>
            <p className={`${mono.className} mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400`}>
              {c.live && <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />}
              {c.pulse && <motion.span className="h-1.5 w-1.5 rounded-full bg-amber-500" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />}
              {c.label}
            </p>
          </motion.button>
        ))}
      </div>

      {/* treasury strip */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-emerald-200/70 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200"><Wallet className="h-5 w-5" /></span>
          <div>
            <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/70`}>Available to withdraw</p>
            <p className={`${display.className} text-2xl font-extrabold tabular-nums text-emerald-900`}>{formatNaira(earnings?.available ?? 0)}</p>
          </div>
        </div>
        <button onClick={() => setActivePage('earnings')} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700">Open treasury <ArrowUpRight className="h-4 w-4" /></button>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* recent collections */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease: EASE }} className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className={`${display.className} text-base font-extrabold tracking-tight text-gray-900`}>Recent collections</h3>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>{collectionsThisMonth.length} this month</span>
          </div>
          {collections.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm font-semibold text-gray-400">No collections logged yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {collections.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div><p className="text-sm font-bold text-gray-900">{c.building_id}</p><p className={`${mono.className} text-[10px] font-semibold text-gray-400`}>{new Date(c.collection_date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p></div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">{c.status || 'completed'}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* open issues */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }} className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className={`${display.className} text-base font-extrabold tracking-tight text-gray-900`}>Open issues</h3>
            <button onClick={() => setActivePage('issues')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View all</button>
          </div>
          {openIssues.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm font-semibold text-gray-400">No open issues.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {openIssues.slice(0, 6).map((it) => (
                <li key={it.id} className="flex items-center justify-between px-5 py-3">
                  <div><p className="text-sm font-bold text-gray-900">{it.issue_type}</p><p className={`${mono.className} text-[10px] font-semibold text-gray-400`}>{it.building_id}</p></div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">{it.status || 'open'}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}