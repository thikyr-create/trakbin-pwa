"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Building2, Users, Truck, Route, CircleCheck, Loader2, RefreshCw, MapPin, Clock, Navigation } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { AssignmentEngine } from '@/lib/core/assignment/AssignmentEngine';
import { availableDrivers } from '@/lib/core/assignment/DriverAllocator';
import { availableTrucks } from '@/lib/core/assignment/TruckAllocator';
import { previewRoute, type OptimizationStop } from '@/lib/core/route-optimization';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function AssignmentsPage() {
  const { tenant, addNotification } = useCompanySession();
  const cid = tenant.companyId;

  const [buildings, setBuildings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignedBuildingIds, setAssignedBuildingIds] = useState<Set<string>>(new Set());

  const [selected, setSelected] = useState<string[]>([]);
  const [driverId, setDriverId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [saving, setSaving] = useState(false);
  const [reTruck, setReTruck] = useState<Record<string, string>>({});
  const [reDriver, setReDriver] = useState<Record<string, string>>({});

  // Client-safe live route preview (haversine, no network calls)
  const [preview, setPreview] = useState<{ ordered: OptimizationStop[]; distanceKm: number; durationMin: number }>({ ordered: [], distanceKm: 0, durationMin: 0 });

  const load = async () => {
    if (!cid) return;
    const [b, d, t, a, ab] = await Promise.all([
      supabase.from('Buildings').select('*').eq('company_id', cid).eq('status', 'active'),
      supabase.from('drivers').select('*').eq('company_id', cid),
      supabase.from('trucks').select('*').eq('company_id', cid),
      supabase.from('assignments').select('*').eq('company_id', cid).in('status', ['assigned', 'accepted', 'in_progress']),
      supabase.from('assignment_buildings').select('building_id, assignment_id'),
    ]);
    setBuildings(b.data || []); setDrivers(d.data || []); setTrucks(t.data || []); setAssignments(a.data || []);
    const openIds = new Set((a.data || []).map((x: any) => x.id));
    setAssignedBuildingIds(new Set((ab.data || []).filter((x: any) => openIds.has(x.assignment_id)).map((x: any) => x.building_id)));
  };

  useEffect(() => { load(); }, [cid]);
  useEffect(() => {
    if (!cid) return;
    const sub = supabase.channel(`assign-${cid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'assignments', filter: `company_id=eq.${cid}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [cid]);

  const eligible = useMemo(() => buildings.filter((b) => !assignedBuildingIds.has(b.custom_id)), [buildings, assignedBuildingIds]);
  const drvAvail = availableDrivers(drivers);
  const trkAvail = availableTrucks(trucks);

  // Live preview: recompute ordering + distance + duration as selection changes
  useEffect(() => {
    let active = true;
    const stops: OptimizationStop[] = eligible
      .filter((b) => selected.includes(b.custom_id))
      .map((b) => ({
        buildingId: b.custom_id,
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
      }));

    if (stops.length === 0) {
      setPreview({ ordered: [], distanceKm: 0, durationMin: 0 });
      return;
    }

    previewRoute(stops).then((r) => {
      if (active) setPreview({ ordered: r.orderedStops, distanceKm: r.distanceKm, durationMin: r.durationMinutes });
    });
    return () => { active = false; };
  }, [eligible, selected]);

  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const driver = drivers.find((d) => d.id === driverId);
  const truck = trucks.find((t) => t.id === truckId);

    const assign = async () => {
    if (!cid) return;
    setSaving(true);
    const selectedStops = preview.ordered.map((s) => ({
      building_id: s.buildingId,
      lat: s.latitude,
      lng: s.longitude,
    }));
    // Coerce to string: Supabase bigint (number) vs DOM option value (string)
    const driver = drivers.find((d) => String(d.id) === String(driverId));
    const truck = trucks.find((t) => String(t.id) === String(truckId));
    const res = await AssignmentEngine.assign({ companyId: cid, driver, truck, stops: selectedStops, assignedBy: 'dispatcher' });
    setSaving(false);
    if (!res.ok) { addNotification(res.errors?.join(' ') || 'Could not assign.', 'error'); return; }
    addNotification(`Route assigned · ${selectedStops.length} stops → ${driver?.full_name}`, 'success');
    setSelected([]); setDriverId(''); setTruckId(''); load();
  };

  return (
    <div className="space-y-4">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-emerald-200/70 bg-gradient-to-br from-emerald-700 to-emerald-800 p-6 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Route className="h-6 w-6" /></div>
          <div><p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-100/80`}>Operations centre</p><h2 className={`${display.className} text-xl font-black uppercase tracking-tight`}>Assignment Center</h2></div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* building selection */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className={`${display.className} flex items-center gap-2 text-base font-extrabold text-gray-900`}><Building2 className="h-4 w-4 text-emerald-600" /> Pending buildings</h3>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>{selected.length} selected</span>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto p-4">
            {eligible.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-gray-400">No eligible buildings — activate service requests first.</p> :
              eligible.map((b) => (
                <label key={b.custom_id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${selected.includes(b.custom_id) ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={selected.includes(b.custom_id)} onChange={() => toggle(b.custom_id)} className="h-4 w-4 accent-emerald-600" />
                  <div className="min-w-0"><p className="text-sm font-bold text-gray-900">{b.custom_id}</p><p className="truncate text-xs font-medium text-gray-500">{b.address}</p></div>
                </label>
              ))}
          </div>
        </motion.section>

        {/* driver + truck + route */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease: EASE }} className="space-y-3 rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-sm">
          <div>
            <label className={`${mono.className} mb-1.5 flex items-center gap-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}><Users className="h-3 w-3" /> Driver (available only)</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200">
              <option value="">Select driver</option>
              {drvAvail.map((d) => (<option key={d.id} value={d.id}>{d.full_name}</option>))}
            </select>
          </div>
          <div>
            <label className={`${mono.className} mb-1.5 flex items-center gap-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}><Truck className="h-3 w-3" /> Truck (available only)</label>
            <select value={truckId} onChange={(e) => setTruckId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200">
              <option value="">Select truck</option>
              {trkAvail.map((t) => (<option key={t.id} value={t.id}>{t.truck_id}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>Stops</p><p className={`${display.className} text-xl font-extrabold tabular-nums`}>{preview.ordered.length}</p></div>
            <div><p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400`}><MapPin className="h-3 w-3" /> Distance</p><p className={`${display.className} text-xl font-extrabold tabular-nums`}>{preview.distanceKm}<span className="text-xs"> km</span></p></div>
            <div><p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400`}><Clock className="h-3 w-3" /> Duration</p><p className={`${display.className} text-xl font-extrabold tabular-nums`}>{Math.floor(preview.durationMin / 60)}h {preview.durationMin % 60}m</p></div>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={assign} disabled={saving || preview.ordered.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-gray-400">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />} Assign route
          </motion.button>
        </motion.section>
      </div>

      {/* active assignments + reassign */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }} className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className={`${display.className} text-base font-extrabold text-gray-900`}>Active work orders</h3>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>{assignments.length} live</span>
        </div>
        {assignments.length === 0 ? <p className="px-5 py-10 text-center text-sm font-semibold text-gray-400">No active assignments yet.</p> : (
          <ul className="divide-y divide-gray-100">
            {assignments.map((a) => {
              const d = drivers.find((x) => x.id === a.driver_id);
              const t = trucks.find((x) => x.id === a.truck_id);
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">{d?.full_name || 'Driver'} <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">{a.status}</span></p>
                    <p className={`${mono.className} mt-0.5 text-[10px] font-semibold text-gray-400`}>{t?.truck_id || 'Truck'} · {new Date(a.assigned_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={reTruck[a.id] || ''} onChange={(e) => setReTruck((p) => ({ ...p, [a.id]: e.target.value }))} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold outline-none">
                      <option value="">Reassign truck…</option>
                      {trkAvail.map((x) => (<option key={x.id} value={x.id}>{x.truck_id}</option>))}
                    </select>
                    <button onClick={async () => { const nt = trucks.find((x) => x.id === reTruck[a.id]); if (nt) { await AssignmentEngine.reassignTruck(a.id, nt); addNotification(`Truck reassigned to ${nt.truck_id}`, 'success'); load(); } }} className="flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-gray-800"><RefreshCw className="h-3 w-3" /> Truck</button>
                    <select value={reDriver[a.id] || ''} onChange={(e) => setReDriver((p) => ({ ...p, [a.id]: e.target.value }))} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold outline-none">
                      <option value="">Reassign driver…</option>
                      {drvAvail.map((x) => (<option key={x.id} value={x.id}>{x.full_name}</option>))}
                    </select>
                    <button onClick={async () => { const nd = drivers.find((x) => x.id === reDriver[a.id]); if (nd) { await AssignmentEngine.reassignDriver(a.id, nd); addNotification(`Driver reassigned to ${nd.full_name}`, 'success'); load(); } }} className="flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-gray-800"><RefreshCw className="h-3 w-3" /> Driver</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>
    </div>
  );
}