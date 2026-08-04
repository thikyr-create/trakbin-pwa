"use client";

import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Wrench, Truck, Users, TrendingUp, CheckCircle2, AlertTriangle, Gauge } from 'lucide-react';
import CompanyDriverIssues from './CompanyDriverIssues';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props { trucks: any[]; }

export default function MaintenancePage({ trucks }: Props) {
  const healthy = trucks.filter((t) => t.status !== 'maintenance').length;
  const inMaint = trucks.length - healthy;

  return (
    <div className="space-y-4">
      {/* header band */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-orange-200/70 bg-gradient-to-br from-orange-600 to-orange-700 p-6 text-white shadow-xl shadow-orange-900/10">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Wrench className="h-6 w-6" /></div>
            <div>
              <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-orange-100/80`}>Fleet maintenance</p>
              <h2 className={`${display.className} text-xl font-black uppercase tracking-tight sm:text-2xl`}>Keep the fleet rolling</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.16em] text-orange-100/70`}>Healthy</p>
              <p className={`${display.className} text-2xl font-extrabold tabular-nums`}>{healthy}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.16em] text-orange-100/70`}>In shop</p>
              <p className={`${display.className} text-2xl font-extrabold tabular-nums`}>{inMaint}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* trucks */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trucks.map((truck: any, i: number) => {
          const maint = truck.status === 'maintenance';
          return (
            <motion.div key={truck.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.05, ease: EASE }} whileHover={{ y: -4 }} className="relative overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
              <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${maint ? 'bg-orange-500' : 'bg-emerald-500'}`} />
              <div className="mb-3 flex items-start justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${maint ? 'bg-orange-50 text-orange-600 ring-orange-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'}`}>
                  {maint ? <Wrench className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                </span>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${maint ? 'bg-orange-50 text-orange-700 ring-orange-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}>
                  {maint ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {maint ? 'In Maintenance' : 'Healthy'}
                </span>
              </div>
              <h3 className={`${display.className} text-lg font-black uppercase tracking-tight text-gray-900`}>{truck.truck_id}</h3>
              <p className={`${mono.className} mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400`}>{truck.license_plate}</p>
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between"><span className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400`}><Users className="h-3 w-3" /> Driver</span><span className="text-xs font-bold text-gray-900">{truck.driver_name || 'Unassigned'}</span></div>
                <div className="flex items-center justify-between"><span className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400`}><Gauge className="h-3 w-3" /> Type</span><span className="text-xs font-bold text-gray-900">{truck.truck_type || 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400`}><TrendingUp className="h-3 w-3" /> Next inspection</span><span className="text-xs font-bold text-orange-600">15 days</span></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* driver-reported breakdowns / incidents */}
      <CompanyDriverIssues />
    </div>
  );
}