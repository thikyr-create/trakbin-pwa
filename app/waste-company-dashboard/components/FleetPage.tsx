"use client";

import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Truck, Plus, Search, X, Users, Gauge } from 'lucide-react';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props { trucks: any[]; search: string; setSearch: (v: string) => void; setShowTruckModal: (b: boolean) => void; onSelectTruck: (t: any) => void; }

export default function FleetPage({ trucks, search, setSearch, setShowTruckModal, onSelectTruck }: Props) {
  const badge = (s: string) =>
    s === 'active' ? { label: 'ON ROUTE', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' } :
    s === 'maintenance' ? { label: 'MAINTENANCE', cls: 'bg-orange-50 text-orange-700 ring-orange-200' } :
    s === 'assigned' ? { label: 'ASSIGNED', cls: 'bg-sky-50 text-sky-700 ring-sky-200' } :
    { label: 'IDLE', cls: 'bg-gray-100 text-gray-600 ring-gray-200' };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search trucks by ID, plate, or driver…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-3">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>{trucks.length} trucks</p>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowTruckModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700"><Plus size={16} /> Add truck</motion.button>
        </div>
      </div>

      {trucks.length === 0 ? (
        <div className="rounded-[20px] border border-gray-200 bg-white p-12 text-center"><Truck className="mx-auto mb-3 h-10 w-10 text-gray-300" /><p className="text-sm font-bold text-gray-500">No trucks yet — add your first.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trucks.map((t: any, i: number) => {
            const b = badge(t.status);
            return (
              <motion.button key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => onSelectTruck(t)} className="relative overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-lg">
                <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${t.status === 'maintenance' ? 'bg-orange-500' : t.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div className="mb-3 flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Truck className="h-5 w-5" /></span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${b.cls}`}>{b.label}</span>
                </div>
                <h3 className={`${display.className} text-lg font-black uppercase tracking-tight text-gray-900`}>{t.truck_id}</h3>
                <p className={`${mono.className} mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400`}>{t.license_plate}</p>
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between"><span className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400`}><Users className="h-3 w-3" /> Driver</span><span className="text-xs font-bold text-gray-900">{t.driver_name || 'Unassigned'}</span></div>
                  <div className="flex items-center justify-between"><span className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400`}><Gauge className="h-3 w-3" /> Type</span><span className="text-xs font-bold text-gray-900">{t.truck_type || 'N/A'}</span></div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}