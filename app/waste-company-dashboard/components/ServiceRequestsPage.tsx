"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Inbox, MapPin, Building2, CircleCheck, X, Loader2, Globe, CalendarClock } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ServiceRequestsPage() {
  const { tenant, serviceRequests, activateService, addNotification } = useCompanySession();
  const [zones, setZones] = useState<any[]>([]);
  const [reviewing, setReviewing] = useState<any>(null);
  const [zoneId, setZoneId] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [days, setDays] = useState<string[]>(['Mon']);
  const [timeWindow, setTimeWindow] = useState('08:00 AM – 11:00 AM');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cid = tenant.companyId; if (!cid) return;
    supabase.from('company_zones').select('*').eq('company_id', cid).eq('is_active', true).then(({ data }) => setZones(data || []));
  }, [tenant.companyId]);

  const toggleDay = (d: string) => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const approve = async () => {
    if (!reviewing) return;
    if (!zoneId) { addNotification('Select one of your zones first.', 'warning'); return; }
    if (days.length === 0) { addNotification('Pick at least one pickup day.', 'warning'); return; }
    setSaving(true);
    await activateService(reviewing.id, zoneId, { frequency, days, timeWindow });
    setSaving(false); setReviewing(null);
  };

  return (
    <div className="space-y-4">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className={`${display.className} flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900`}><Inbox className="h-5 w-5 text-emerald-600" /> Onboarding queue</h3>
          <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>{serviceRequests.length} pending</span>
        </div>

        {serviceRequests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Inbox className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-bold text-gray-700">No pending service requests</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-gray-400">When a caretaker in one of your zones registers, the request lands here for approval.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {serviceRequests.map((r: any, i: number) => (
              <motion.li key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Building2 className="h-5 w-5" /></span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">{r.building_id}
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${r.status === 'auto_assigned' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>{r.status === 'auto_assigned' ? 'matched to you' : 'pending'}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {r.buildings?.address || 'Address on file'}</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setReviewing(r); setZoneId(zones[0]?.id || ''); }} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700">Review & activate</motion.button>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* approval sheet */}
      <AnimatePresence>
        {reviewing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !saving && setReviewing(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} onClick={(e) => e.stopPropagation()} className={`${body.className} w-full max-w-md rounded-t-[24px] bg-white p-6 shadow-2xl sm:rounded-[24px]`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Activate {reviewing.building_id}</h3>
                <button onClick={() => setReviewing(null)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"><X size={18} /></button>
              </div>

              {zones.length === 0 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">You have no active zones yet — add one under Zones before activating buildings.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`${mono.className} mb-1.5 flex items-center gap-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}><Globe className="h-3 w-3" /> Zone</label>
                    <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200">
                      {zones.map((z) => (<option key={z.id} value={z.id}>{z.zone_name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}>Frequency</label>
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200">
                      <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="twice">Twice weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}>Pickup days</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => (
                        <button key={d} onClick={() => toggleDay(d)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${days.includes(d) ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`${mono.className} mb-1.5 flex items-center gap-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}><CalendarClock className="h-3 w-3" /> Time window</label>
                    <input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={approve} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-gray-400">
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CircleCheck className="h-5 w-5" />} Activate service
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}