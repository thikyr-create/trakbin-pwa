"use client";

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { TriangleAlert, Truck, MapPin, Upload, Loader2, CircleCheck, Navigation, Wrench, ShieldAlert, TrafficCone, Cog, CircleHelp } from 'lucide-react';

const supabase = supabaseBrowser;
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TYPES = [
  { id: 'breakdown', label: 'Truck breakdown', Icon: Wrench },
  { id: 'accident', label: 'Accident', Icon: ShieldAlert },
  { id: 'route_blocked', label: 'Route blocked', Icon: TrafficCone },
  { id: 'vehicle_fault', label: 'Vehicle fault', Icon: Cog },
  { id: 'other', label: 'Other', Icon: CircleHelp },
];

const STATUS_CHIP: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 ring-amber-200',
  acknowledged: 'bg-sky-50 text-sky-700 ring-sky-200',
  resolving: 'bg-violet-50 text-violet-700 ring-violet-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export default function DriverIssuesCard() {
  const [driver, setDriver] = useState<any>(null);
  const [issueType, setIssueType] = useState('breakdown');
  const [truckId, setTruckId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [myIssues, setMyIssues] = useState<any[]>([]);

  useEffect(() => {
    const s = localStorage.getItem('trakbin_driver');
    if (s) { const d = JSON.parse(s); setDriver(d); setTruckId(d.truck_id || ''); load(d.id); }
  }, []);

  const load = async (driverId: string) => {
    const { data } = await supabase.from('driver_issues').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
    setMyIssues(data || []);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setMessage('GPS not supported.'); return; }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        setCoords({ lat, lon });
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const d = await r.json(); if (d.display_name) setLocation(d.display_name);
        } catch {}
        setLocBusy(false);
      },
      () => { setLocBusy(false); setMessage('Could not read location — type it instead.'); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const submit = async (files: FileList | null) => {
    if (!driver) { setMessage('Not signed in as a driver.'); return; }
    setSaving(true); setMessage('');
    try {
      let urls: string[] = [];
      if (files && files.length) {
        for (const f of Array.from(files)) {
          const path = `driver-${driver.id}/${Date.now()}-${f.name}`;
          const { error } = await supabase.storage.from('trakbin-driver-issues').upload(path, f, { upsert: false });
          if (!error) { const { data } = supabase.storage.from('trakbin-driver-issues').getPublicUrl(path); urls.push(data.publicUrl); }
        }
      }
      const issue_number = `DI-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from('driver_issues').insert([{
                issue_number, driver_id: String(driver.id), employee_id: driver.employee_id, driver_name: driver.full_name,
        company_id: driver.company_id, truck_id: truckId || null, issue_type: issueType,
        description, location: location || null, latitude: coords?.lat ?? null, longitude: coords?.lon ?? null,
        media: urls, status: 'open',
      }]);
      if (error) throw error;
      setMessage('✅ Issue reported to your company.');
      setDescription(''); setLocation(''); setCoords(null);
      load(driver.id);
    } catch (e: any) { setMessage('❌ ' + (e?.message || 'Failed to report.')); }
    finally { setSaving(false); }
  };

  return (
    <div className={`${body.className} space-y-4`}>
      {/* report form */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600/80">Report an issue</p>
          <h3 className={`${display.className} mt-1 text-xl font-extrabold tracking-tight text-gray-900`}>Something wrong on the road?</h3>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TYPES.map((t) => {
            const sel = issueType === t.id;
            return (
              <button key={t.id} onClick={() => setIssueType(t.id)} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${sel ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <t.Icon className={`h-5 w-5 ${sel ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className="text-[11px] font-bold text-gray-800">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input value={truckId} onChange={(e) => setTruckId(e.target.value)} placeholder="Truck ID (e.g. TRK-1234)" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the issue…" className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (or use GPS)" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <button type="button" onClick={useMyLocation} disabled={locBusy} className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-3 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-60">
              {locBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />} GPS
            </button>
          </div>
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 ${uploading ? 'opacity-60' : ''}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Add photo (optional)
            <input id="drv-issue-photo" type="file" multiple accept="image/*" className="hidden" />
          </label>
          <motion.button whileTap={{ scale: 0.98 }} disabled={saving} onClick={() => { const el = document.getElementById('drv-issue-photo') as HTMLInputElement; submit(el?.files || null); }} className="w-full rounded-xl bg-emerald-600 py-3 font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-gray-400">
            {saving ? 'Reporting…' : 'Report issue'}
          </motion.button>
          {message && <p className={`text-xs font-semibold ${message.includes('❌') ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>}
        </div>
      </motion.section>

      {/* my reports */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>My reports</h3>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{myIssues.length} total</span>
        </div>
        {myIssues.length === 0 ? (
          <div className="px-6 py-12 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-gray-300" /><p className="mt-3 text-sm font-bold text-gray-700">No issues reported</p><p className="mt-1 text-xs text-gray-400">When you report a breakdown or incident, it shows up here with its status.</p></div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myIssues.map((it) => (
              <li key={it.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">{TYPES.find((t) => t.id === it.issue_type)?.label || it.issue_type}
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${STATUS_CHIP[it.status] || STATUS_CHIP.open}`}>{it.status}</span>
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-500">{it.description}</p>
                    <p className="font-mono mt-0.5 text-[10px] font-semibold text-gray-400">{it.issue_number}{it.truck_id ? ` · ${it.truck_id}` : ''} · {new Date(it.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p>
                  </div>
                  {it.status === 'resolved' && <CircleCheck className="h-5 w-5 shrink-0 text-emerald-500" />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    </div>
  );
}