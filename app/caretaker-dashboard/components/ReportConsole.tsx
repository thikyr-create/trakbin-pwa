"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { createClient } from '@supabase/supabase-js';
import {
  AlertTriangle, CalendarX, Camera, Video, Image as ImageIcon, MapPin, Navigation,
  X, CheckCircle2, Clock, Send, ChevronRight, Radio, ShieldCheck, Paperclip, Loader2,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BUCKET = 'trakbin-issue-media';

type Kind = 'dump' | 'miss';
type MediaItem = { id: string; blob: Blob; url: string; kind: 'image' | 'video'; uploadedUrl?: string; failed?: boolean };
type Toast = { msg: string; tone: 'ok' | 'err' | 'info' } | null;

const TYPE_META: Record<string, { label: string; chip: string; rail: string; Icon: typeof AlertTriangle }> = {
  illegal_dumping: { label: 'Illegal dumping', chip: 'bg-amber-50 text-amber-700 ring-amber-200', rail: 'bg-amber-400', Icon: AlertTriangle },
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

function compressImage(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);
    const img = new Image();
    const obj = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(obj);
      let { width, height } = img;
      if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(obj); resolve(file); };
    img.src = obj;
  });
}

export default function ReportConsole() {
  const { building, issues, fetchIssues, activeAssignment, schedule, companyProfile } = useCaretakerSession();

  const [kind, setKind] = useState<Kind | null>(null);
  const [dumpLocation, setDumpLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [dumpNote, setDumpNote] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [missedDate, setMissedDate] = useState('');
  const [missWindow, setMissWindow] = useState('');
  const [missNote, setMissNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);

  // the building's scheduled window, shown ONLY as a placeholder hint (never as data)
  const scheduledWindow = activeAssignment?.time_window || schedule?.time_window || '';

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { const urls = media.map((m) => m.url); return () => { urls.forEach((u) => URL.revokeObjectURL(u)); }; }, [media]);

  if (!building) return null;

  const provider = companyProfile?.business_name || 'your waste provider';
  const todayISO = new Date().toISOString().slice(0, 10);
  const reports = (issues || []).filter((it: any) => it.issue_type === 'illegal_dumping' || it.issue_type === 'missed_collection');
  const openCount = reports.filter((it: any) => !['resolved', 'closed'].includes((it.status || '').toLowerCase())).length;

  const canDump = dumpLocation.trim().length > 0 && !submitting;
  const canMiss = !!missedDate && !submitting;

  const addFiles = async (files: FileList | null, force?: 'image' | 'video') => {
    if (!files) return;
    const incoming = Array.from(files);
    const room = 4 - media.length;
    if (room <= 0) { setToast({ msg: 'Up to 4 attachments per report', tone: 'info' }); return; }
    const next: MediaItem[] = [];
    for (const f of incoming.slice(0, room)) {
      const isVideo = force === 'video' || f.type.startsWith('video/');
      const blob = isVideo ? f : await compressImage(f);
      next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, blob, url: URL.createObjectURL(blob), kind: isVideo ? 'video' : 'image' });
    }
    setMedia((m) => [...m, ...next]);
  };
  const removeMedia = (id: string) => setMedia((m) => { const t = m.find((x) => x.id === id); if (t) URL.revokeObjectURL(t.url); return m.filter((x) => x.id !== id); });

  const useMyLocation = () => {
    if (!navigator.geolocation) { setToast({ msg: 'Location isn’t available — type it instead', tone: 'info' }); return; }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setDumpLocation((prev) => prev.trim() || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setLocBusy(false); setToast({ msg: 'Location captured', tone: 'ok' });
      },
      () => { setLocBusy(false); setToast({ msg: 'Couldn’t read location — type the spot instead', tone: 'info' }); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const uploadAll = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const m of media) {
      const ext = m.kind === 'video' ? 'mp4' : 'jpg';
      const path = `issues/${building.custom_id}/${Date.now()}-${m.id}.${ext}`;
      try {
        const { error } = await supabase.storage.from(BUCKET).upload(path, m.blob, { contentType: m.kind === 'video' ? 'video/mp4' : 'image/jpeg', upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        m.uploadedUrl = data.publicUrl; urls.push(data.publicUrl);
      } catch { m.failed = true; }
    }
    setMedia([...media]);
    return urls;
  };

  const saveReport = async (core: any, perColumn: Record<string, any>) => {
    const issue_number = `ENV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
    const payload = { ...core, issue_number, building_id: building.custom_id, reported_by: building.custom_id, company_id: building.company_id || null };
    const { data, error } = await supabase.from('environmental_issues').insert([payload]).select('id').single();
    if (error || !data) throw error || new Error('no_id');
    const id = data.id;
    const touch = async (patch: Record<string, any>) => { try { await supabase.from('environmental_issues').update(patch).eq('id', id); } catch {} };
    await touch({ status: 'open' });
    for (const k of Object.keys(perColumn)) await touch({ [k]: perColumn[k] });
    try { await supabase.from('environmental_issue_history').insert([{ issue_id: id, action: 'REPORT_CREATED', performed_by: 'caretaker', metadata: { type: core.issue_type } }]); } catch {}
    return id;
  };

  const reset = () => { media.forEach((m) => URL.revokeObjectURL(m.url)); setMedia([]); setDumpLocation(''); setCoords(null); setDumpNote(''); setMissedDate(''); setMissWindow(''); setMissNote(''); setKind(null); };

  const submitDump = async () => {
    if (!canDump) return;
    setSubmitting(true); setToast({ msg: media.length ? 'Uploading media…' : 'Submitting…', tone: 'info' });
    try {
      const urls = await uploadAll();
      const failed = media.filter((m) => m.failed).length;
      const imgN = media.filter((m) => m.kind === 'image').length;
      const vidN = media.filter((m) => m.kind === 'video').length;
      const lines = ['Illegal dumping reported.', `Location: ${dumpLocation.trim()}`];
      if (coords) lines.push(`Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      if (dumpNote.trim()) lines.push(`Note: ${dumpNote.trim()}`);
      lines.push(`Attachments: ${media.length} (${imgN} photo${imgN === 1 ? '' : 's'}, ${vidN} video${vidN === 1 ? '' : 's'})${urls.length ? '' : ' — captured but not yet uploaded'}`);
      if (urls.length) lines.push(`Media: ${urls.join(', ')}`);
      const perColumn: Record<string, any> = { location: dumpLocation.trim() };
      if (coords) { perColumn.latitude = coords.lat; perColumn.longitude = coords.lng; }
      if (urls[0]) perColumn.photo_url = urls[0];
      if (urls.length) perColumn.media = urls;
      await saveReport({ issue_type: 'illegal_dumping', description: lines.join('\n') }, perColumn);
      await fetchIssues();
      setToast({ msg: failed ? 'Reported — some media couldn’t upload' : 'Dumping reported. Thank you.', tone: 'ok' });
      reset();
    } catch { setToast({ msg: 'Couldn’t submit — please try again', tone: 'err' }); }
    finally { setSubmitting(false); }
  };

  const submitMiss = async () => {
    if (!canMiss) return;
    setSubmitting(true); setToast({ msg: 'Submitting…', tone: 'info' });
    try {
      const wd = new Date(missedDate + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'long' });
      const win = missWindow.trim() || scheduledWindow || '';
      const lines = ['Missed collection reported.', `Date missed: ${missedDate} (${wd})`];
      if (win) lines.push(`Time window: ${win}`);
      if (missNote.trim()) lines.push(`Note: ${missNote.trim()}`);
      await saveReport({ issue_type: 'missed_collection', description: lines.join('\n') }, { missed_date: missedDate, missed_window: win || null });
      await fetchIssues();
      setToast({ msg: 'Missed collection reported. We’ll follow up.', tone: 'ok' });
      reset();
    } catch { setToast({ msg: 'Couldn’t submit — please try again', tone: 'err' }); }
    finally { setSubmitting(false); }
  };

  const pinned = coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : null;

  return (
    <div className={`${body.className} space-y-4`}>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.96 }} className={`fixed left-1/2 top-20 z-[1200] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-xl ring-1 ${toast.tone === 'ok' ? 'bg-emerald-600 text-white ring-emerald-400/40' : toast.tone === 'err' ? 'bg-rose-600 text-white ring-rose-400/40' : 'bg-gray-900 text-white ring-white/10'}`}>
            {toast.tone === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
            {toast.tone === 'ok' && <CheckCircle2 className="h-4 w-4" />}
            {toast.tone === 'err' && <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* civic hero */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative overflow-hidden rounded-[26px] border border-amber-300/30 bg-gradient-to-br from-[#2a1605] via-[#3a1d06] to-[#1c0f04] p-7 text-amber-50 shadow-xl shadow-amber-950/30 sm:p-9">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 18% 120%, rgba(251,191,36,0.5) 0 1px, transparent 1px 22px), repeating-radial-gradient(circle at 90% -10%, rgba(251,191,36,0.35) 0 1px, transparent 1px 30px)' }} />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <motion.div aria-hidden className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full border border-amber-300/20" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300/80">Community watch · {provider}</p>
            <h2 className={`${display.className} mt-2 text-3xl font-extrabold leading-[1.02] tracking-tight sm:text-[40px]`}>Report a problem</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-amber-100/75">Two things, two quick paths. Tell us about illegal dumping or a collection that never happened — we route it straight to your hauler.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 ring-1 ring-white/10">
            <span className="relative flex h-2 w-2">{openCount > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />}<span className={`relative inline-flex h-2 w-2 rounded-full ${openCount > 0 ? 'bg-amber-300' : 'bg-emerald-300'}`} /></span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-100/80">{openCount > 0 ? `${openCount} open near you` : 'all clear'}</span>
          </div>
        </div>
      </motion.section>

      {/* chooser */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {([
          { id: 'dump' as Kind, Icon: AlertTriangle, title: 'Illegal dumping', sub: 'Photograph the site', ring: 'ring-amber-300', bg: 'bg-amber-50', tx: 'text-amber-700', solid: 'bg-amber-500', glow: 'bg-amber-200/60', ringSoft: 'ring-amber-100' },
          { id: 'miss' as Kind, Icon: CalendarX, title: 'Missed collection', sub: 'The truck didn’t come', ring: 'ring-rose-300', bg: 'bg-rose-50', tx: 'text-rose-700', solid: 'bg-rose-500', glow: 'bg-rose-200/60', ringSoft: 'ring-rose-100' },
        ]).map((c, i) => {
          const sel = kind === c.id;
          return (
            <motion.button key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }} whileTap={{ scale: 0.98 }} onClick={() => setKind(sel ? null : c.id)} className={`group relative overflow-hidden rounded-[22px] border-2 p-5 text-left transition-all ${sel ? `border-transparent ${c.bg} ring-2 ${c.ring}` : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}>
              <div aria-hidden className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${sel ? c.glow : 'bg-gray-100'}`} />
              <div className="relative flex items-start justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-transform group-hover:scale-105 ${sel ? `${c.solid} text-white ring-transparent` : `${c.bg} ${c.tx} ${c.ringSoft}`}`}><c.Icon className="h-6 w-6" /></span>
                {sel && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`flex h-6 w-6 items-center justify-center rounded-full ${c.solid} text-white`}><CheckCircle2 className="h-4 w-4" /></motion.span>}
              </div>
              <p className="relative mt-4 text-base font-extrabold text-gray-900">{c.title}</p>
              <p className="relative mt-0.5 text-sm font-semibold text-gray-500">{c.sub}</p>
              <p className="relative mt-3 flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">{sel ? 'fill the form below' : 'tap to start'} <ChevronRight className={`h-3 w-3 transition-transform ${sel ? 'rotate-90' : ''}`} /></p>
            </motion.button>
          );
        })}
      </div>

      {/* composers */}
      <AnimatePresence initial={false}>
        {kind === 'dump' && (
          <motion.section key="dump" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
            <div className="relative overflow-hidden rounded-[24px] border border-amber-200/70 bg-white p-6 shadow-sm sm:p-7">
              <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-amber-600">Illegal dumping</p>
              <h3 className={`${display.className} mt-1 text-xl font-extrabold tracking-tight text-gray-900`}>Where is the dump?</h3>
              <p className="mt-1 text-sm font-medium text-gray-500">That’s all we need to start. Add a photo or video if you can — it helps a lot.</p>

              <div className="mt-5">
                <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><MapPin className="h-3 w-3" /> Location of the dump</label>
                <div className="flex gap-2">
                  <input value={dumpLocation} onChange={(e) => setDumpLocation(e.target.value)} placeholder="e.g. behind 12 Oka St, by the transformer" className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={useMyLocation} disabled={locBusy} className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-gray-900 px-3.5 py-3 text-xs font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-60">{locBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}<span className="hidden sm:inline">Use my location</span></motion.button>
                </div>
                {pinned ? (
                  <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> GPS pinned · {pinned}</p>
                ) : null}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Note <span className="text-gray-300">(optional)</span></label>
                <textarea value={dumpNote} onChange={(e) => setDumpNote(e.target.value)} rows={2} placeholder="What’s dumped, how long it’s been there…" className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
              </div>

              <div className="mt-5">
                <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><Camera className="h-3 w-3" /> Photo / video of the dump <span className="text-gray-300">(optional · up to 4)</span></label>
                <div className="flex flex-wrap gap-2">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => photoRef.current?.click()} className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-amber-200 transition-colors hover:bg-amber-600"><Camera className="h-4 w-4" /> Photo</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => videoRef.current?.click()} className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-gray-800"><Video className="h-4 w-4" /> Video</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => galleryRef.current?.click()} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"><ImageIcon className="h-4 w-4" /> Gallery</motion.button>
                </div>
                <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addFiles(e.target.files, 'image'); e.target.value = ''; }} />
                <input ref={videoRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => { addFiles(e.target.files, 'video'); e.target.value = ''; }} />
                <input ref={galleryRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />

                {media.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {media.map((m) => (
                      <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                        {m.kind === 'image'
                          ? <img src={m.url} alt="" className="h-full w-full object-cover" />
                          : <video src={m.url} className="h-full w-full object-cover" muted />}
                        {m.kind === 'video' && (
                          <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white"><Video className="h-2.5 w-2.5" /> clip</span>
                        )}
                        {m.failed && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[9px] font-bold text-amber-200">upload failed</span>
                        )}
                        <button onClick={() => removeMedia(m.id)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <motion.button whileTap={canDump ? { scale: 0.98 } : undefined} onClick={submitDump} disabled={!canDump} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-amber-200 transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" /> Submit dumping report</>}</motion.button>
            </div>
          </motion.section>
        )}

        {kind === 'miss' && (
          <motion.section key="miss" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
            <div className="relative overflow-hidden rounded-[24px] border border-rose-200/70 bg-white p-6 shadow-sm sm:p-7">
              <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-400 to-rose-600" />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-rose-600">Missed collection</p>
              <h3 className={`${display.className} mt-1 text-xl font-extrabold tracking-tight text-gray-900`}>Which pickup was missed?</h3>
              <p className="mt-1 text-sm font-medium text-gray-500">Enter the date the truck didn’t show and the window you expected it. No photo needed.</p>

              {/* manual inputs — the caretaker's own data, never a preset */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><CalendarX className="h-3 w-3" /> Date missed <span className="text-rose-500">*</span></label>
                  <input type="date" value={missedDate} max={todayISO} onChange={(e) => setMissedDate(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><Clock className="h-3 w-3" /> Time window <span className="text-gray-300">(optional)</span></label>
                  <input type="text" value={missWindow} onChange={(e) => setMissWindow(e.target.value)} placeholder={scheduledWindow || 'e.g. 08:00 AM – 11:00 AM'} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Note <span className="text-gray-300">(optional)</span></label>
                <textarea value={missNote} onChange={(e) => setMissNote(e.target.value)} rows={2} placeholder="Bins still full, no notice left, etc." className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
              </div>

              <motion.button whileTap={canMiss ? { scale: 0.98 } : undefined} onClick={submitMiss} disabled={!canMiss} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-rose-200 transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" /> Report missed collection</>}</motion.button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* history — only the two report types */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-100"><ShieldCheck className="h-4 w-4" /></span> Your reports</h3>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{reports.length} filed</span>
        </div>

        {reports.length === 0 ? (
          <div className="relative px-6 py-14 text-center">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><CheckCircle2 className="h-7 w-7 text-gray-300" /></div>
            <p className="relative mt-4 text-sm font-bold text-gray-700">No reports yet</p>
            <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">When you flag illegal dumping or a missed collection, it shows up here with its status.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reports.map((it: any, i: number) => {
              const meta = TYPE_META[it.issue_type] || TYPE_META.illegal_dumping;
              const urls: string[] = Array.isArray(it.media) ? it.media : it.photo_url ? [it.photo_url] : [];
              const attachMatch = String(it.description || '').match(/Attachments:\s*(\d+)/);
              const attachN = attachMatch ? Number(attachMatch[1]) : 0;
              const locMatch = String(it.description || '').match(/Location:\s*([^\n]+)/);
              const missMatch = String(it.description || '').match(/Date missed:\s*([^\n]+)/);
              const st = (it.status || 'open').toLowerCase();
              const stChip = st.includes('resolv') || st.includes('clos') ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : st.includes('progress') || st.includes('review') ? 'bg-sky-50 text-sky-700 ring-sky-200' : 'bg-amber-50 text-amber-700 ring-amber-200';
              return (
                <motion.li key={it.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} className="relative overflow-hidden px-6 py-5">
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${meta.rail}`} />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.chip}`}><meta.Icon className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-gray-900">{meta.label}<span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${stChip}`}>{it.status || 'open'}</span></p>
                        <p className="font-mono mt-0.5 text-[11px] font-semibold text-gray-400">{it.issue_number} · {relTime(it.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {it.issue_type === 'illegal_dumping' && locMatch ? (
                    <p className="mt-3 flex items-start gap-1.5 pl-[52px] text-xs font-semibold text-gray-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {locMatch[1].trim()}</p>
                  ) : null}
                  {it.issue_type === 'missed_collection' && missMatch ? (
                    <p className="mt-3 flex items-start gap-1.5 pl-[52px] text-xs font-semibold text-gray-600"><CalendarX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" /> {missMatch[1].trim()}</p>
                  ) : null}

                  {urls.length > 0 ? (
                    <div className="mt-3 flex gap-2 pl-[52px]">
                      {urls.slice(0, 4).map((u, k) => (
                        <a key={k} href={u} target="_blank" rel="noreferrer" className="h-14 w-14 overflow-hidden rounded-lg ring-1 ring-gray-200 transition-transform hover:scale-105">
                          <img src={u} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {urls.length === 0 && attachN > 0 ? (
                    <p className="mt-2 flex items-center gap-1.5 pl-[52px] font-mono text-[11px] font-semibold text-gray-400"><Paperclip className="h-3 w-3" /> {attachN} attached on device</p>
                  ) : null}
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>
    </div>
  );
}