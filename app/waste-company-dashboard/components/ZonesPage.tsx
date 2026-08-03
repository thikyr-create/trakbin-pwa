"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { MapPin, Plus, Trash2, Globe, Loader2, CheckCircle2, Building2, Radius } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200';

export default function ZonesPage() {
  const { tenant } = useCompanySession();
  const cid = tenant.companyId;

  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [zoneName, setZoneName] = useState('');
  const [centerLat, setCenterLat] = useState('');
  const [centerLng, setCenterLng] = useState('');
  const [radiusKm, setRadiusKm] = useState('');
  const [estates, setEstates] = useState('');
  const [streets, setStreets] = useState('');
  const [addresses, setAddresses] = useState('');

  const load = async () => {
    if (!cid) return;
    setLoading(true);
    const { data } = await supabase.from('company_zones').select('*').eq('company_id', cid).order('created_at', { ascending: false });
    setZones(data || []);
    setLoading(false);
  };
  useEffect(() => { if (tenant.loaded) load(); }, [tenant.loaded, cid]);

  const addZone = async (e: React.FormEvent) => {
    e.preventDefault(); if (!cid) return;
    setSaving(true); setMessage('');
    const { error } = await supabase.from('company_zones').insert([{
      company_id: cid, zone_name: zoneName,
      center_lat: parseFloat(centerLat) || null, center_lng: parseFloat(centerLng) || null,
      radius_km: parseFloat(radiusKm) || null,
      estates: splitList(estates), streets: splitList(streets), addresses: splitList(addresses),
      is_active: true,
    }]);
    if (error) setMessage('❌ ' + error.message);
    else {
      setMessage('✅ Zone added — caretakers in these estates/streets will be routed to you.');
      setZoneName(''); setCenterLat(''); setCenterLng(''); setRadiusKm(''); setEstates(''); setStreets(''); setAddresses('');
      load();
    }
    setSaving(false);
  };

  const removeZone = async (id: string) => {
    await supabase.from('company_zones').delete().eq('id', id);
    load();
  };

  return (
    <div className={`${body.className} space-y-4`}>
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-50 blur-2xl" />
        <div className="relative z-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600/80">Coverage</p>
          <h2 className={`${display.className} mt-1 text-2xl font-extrabold tracking-tight text-gray-900`}>Where you operate</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">Caretakers whose estate, street or address falls inside a zone you declare are routed to you for approval.</p>
        </div>

        <form onSubmit={addZone} className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Zone name</label>
            <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} required placeholder="e.g. Lekki Phase 1" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Estates (comma separated)</label>
            <input value={estates} onChange={(e) => setEstates(e.target.value)} placeholder="Independence Estate, Peace Court" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Streets (comma separated)</label>
            <input value={streets} onChange={(e) => setStreets(e.target.value)} placeholder="Nsugbe Road, 1st Avenue" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Specific addresses (comma separated, optional)</label>
            <input value={addresses} onChange={(e) => setAddresses(e.target.value)} placeholder="House 12 Nsugbe Road, ..." className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <div>
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Center lat</label>
              <input value={centerLat} onChange={(e) => setCenterLat(e.target.value)} placeholder="6.4541" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Center lng</label>
              <input value={centerLng} onChange={(e) => setCenterLng(e.target.value)} placeholder="3.3900" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Radius km</label>
              <input value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} placeholder="2" className={inputCls} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:shadow-none">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add zone</>}
            </button>
            {message && <p className={`mt-2 text-sm font-medium ${message.includes('❌') ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>}
          </div>
        </form>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Your zones</h3>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{zones.length} active</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
        ) : zones.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Globe className="mx-auto h-7 w-7 text-gray-300" />
            <p className="mt-3 text-sm font-bold text-gray-700">No zones yet</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-gray-400">Add the estates, streets and radius you cover so matching caretakers are routed to you.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {zones.map((z) => (
              <li key={z.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><MapPin className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">{z.zone_name}</p>
                      <p className="font-mono mt-0.5 text-[11px] font-semibold text-gray-400">
                        {z.center_lat != null && z.center_lng != null ? `${Number(z.center_lat).toFixed(4)}, ${Number(z.center_lng).toFixed(4)} · ${z.radius_km ?? '—'} km` : 'no radius set'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeZone(z.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete zone"><Trash2 className="h-4 w-4" /></button>
                </div>
                {((z.estates || []).length > 0 || (z.streets || []).length > 0 || (z.addresses || []).length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-[52px]">
                    {(z.estates || []).map((e: string) => (<span key={`e-${e}`} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200"><Building2 className="mr-1 inline h-2.5 w-2.5" />{e}</span>))}
                    {(z.streets || []).map((s: string) => (<span key={`s-${s}`} className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200">{s}</span>))}
                    {(z.addresses || []).map((a: string) => (<span key={`a-${a}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 ring-1 ring-gray-200">{a}</span>))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    </div>
  );
}