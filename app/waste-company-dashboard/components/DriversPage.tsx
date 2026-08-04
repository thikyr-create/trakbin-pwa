"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Users, Plus, Search, X, Phone, Mail, AlertTriangle } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props { drivers: any[]; search: string; setSearch: (v: string) => void; setShowDriverModal: (b: boolean) => void; onSelectDriver: (d: any) => void; }

export default function DriversPage({ drivers, search, setSearch, setShowDriverModal, onSelectDriver }: Props) {
  const { tenant } = useCompanySession();
  const [openIssues, setOpenIssues] = useState<Record<string, number>>({});

  useEffect(() => {
    const cid = tenant.companyId; if (!cid) return;
    supabase.from('driver_issues').select('employee_id, status').eq('company_id', cid).neq('status', 'resolved').then(({ data }) => {
      const m: Record<string, number> = {};
      (data || []).forEach((i: any) => { const k = i.employee_id || ''; m[k] = (m[k] || 0) + 1; });
      setOpenIssues(m);
    });
  }, [tenant.companyId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search drivers by name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-3">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>{drivers.length} drivers</p>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowDriverModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700"><Plus size={16} /> Add driver</motion.button>
        </div>
      </div>

      {drivers.length === 0 ? (
        <div className="rounded-[20px] border border-gray-200 bg-white p-12 text-center"><Users className="mx-auto mb-3 h-10 w-10 text-gray-300" /><p className="text-sm font-bold text-gray-500">No drivers yet — add your first.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((d: any, i: number) => {
            const n = openIssues[d.employee_id] || 0;
            return (
              <motion.button key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => onSelectDriver(d)} className="relative overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-lg">
                <div className="mb-3 flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"><span className={`${display.className} text-lg font-black`}>{(d.full_name || 'D').charAt(0).toUpperCase()}</span></span>
                  {n > 0
                    ? <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200"><AlertTriangle className="h-3 w-3" /> {n} open</span>
                    : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">On shift</span>}
                </div>
                <h3 className={`${display.className} text-lg font-black tracking-tight text-gray-900`}>{d.full_name}</h3>
                <p className={`${mono.className} mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400`}>ID · {d.employee_id}</p>
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-gray-600"><Phone size={12} className="text-gray-400" /> {d.phone || 'N/A'}</p>
                  <p className="flex items-center gap-2 truncate text-xs font-semibold text-gray-600"><Mail size={12} className="text-gray-400" /> {d.email || 'N/A'}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}