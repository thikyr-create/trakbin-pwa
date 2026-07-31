"use client";

import { motion, type Variants } from 'framer-motion';
import { Phone, MessageCircle, Mail, MapPin, Headphones, ShieldCheck, Clock, Radio, ArrowUpRight, Building2, LifeBuoy, CalendarClock } from 'lucide-react';
import { useCaretakerSession, type CaretakerContact } from '@/lib/store/useCaretakerSession';
import { zoneLabel } from '@/lib/utils/schedule';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const digitsOnly = (v: string) => v.replace(/[^\d]/g, '');
const telHref = (v: string) => `tel:${v.replace(/[^\d+]/g, '')}`;
const waHref = (v: string) => `https://wa.me/${digitsOnly(v)}`;
const mailHref = (v: string) => `mailto:${v}`;
function hrefFor(c: CaretakerContact): string | null {
  switch (c.type) {
    case 'call': case 'emergency': case 'office': return telHref(c.value);
    case 'whatsapp': return waHref(c.value);
    case 'email': return mailHref(c.value);
    default: return /\S+@\S+\.\S+/.test(c.value) ? mailHref(c.value) : telHref(c.value);
  }
}
const META: Record<CaretakerContact['type'], { Icon: typeof Phone; tone: string; ring: string }> = {
  call: { Icon: Phone, tone: 'text-emerald-700', ring: 'group-hover:ring-emerald-300' },
  whatsapp: { Icon: MessageCircle, tone: 'text-emerald-700', ring: 'group-hover:ring-emerald-300' },
  emergency: { Icon: LifeBuoy, tone: 'text-amber-700', ring: 'group-hover:ring-amber-300' },
  office: { Icon: MapPin, tone: 'text-emerald-700', ring: 'group-hover:ring-emerald-300' },
  email: { Icon: Mail, tone: 'text-emerald-700', ring: 'group-hover:ring-emerald-300' },
};
const ONBOARD_STEPS = ['Request sent', 'Under review', 'Provider assigned'];
const contactContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const contactItem: Variants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } };

export default function SupportBanner() {
  const { activeAssignment, companyProfile, companyContacts } = useCaretakerSession();
  const isActive = !!activeAssignment && !!companyProfile;
  const name = companyProfile?.business_name || 'Your waste provider';
  const zone = zoneLabel(activeAssignment?.zone_id);
  const days: string[] = Array.isArray(activeAssignment?.pickup_days) ? activeAssignment.pickup_days : [];
  const window = activeAssignment?.time_window;
  const activeSince = activeAssignment?.activated_at ? new Date(activeAssignment.activated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  if (!isActive) {
    return (
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative mb-8 overflow-hidden rounded-[22px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" /></span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">Awaiting activation</span>
            </div>
            <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-[28px]">We&rsquo;re matching you with a hauler</h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">Your building is registered and queued. Once a waste company in your zone accepts the request, their contact line appears here automatically — no saving, no searching.</p>
            <p className="mt-4 text-xs font-medium text-emerald-200/70">Most buildings are activated within a day of a provider accepting the request.</p>
          </div>
          <ol className="relative shrink-0 space-y-4 pl-1 lg:w-72">
            <span aria-hidden className="absolute left-[11px] top-2 bottom-2 w-px bg-white/15" />
            {ONBOARD_STEPS.map((label, i) => {
              const done = i === 0; const current = i === 1;
              return (
                <motion.li key={label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.15 + i * 0.08, ease: EASE }} className="relative flex items-center gap-3">
                  <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-emerald-950 ${done ? 'bg-emerald-400' : current ? 'bg-amber-300' : 'bg-white/15'}`}>
                    {current && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-300/60" />}
                    <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-950' : current ? 'bg-amber-900' : 'bg-white/40'}`} />
                  </span>
                  <span className={`text-sm font-semibold ${done || current ? 'text-white' : 'text-emerald-100/45'}`}>{label}</span>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative mb-8 overflow-hidden rounded-[22px] border border-emerald-200/70 bg-emerald-950 text-white shadow-xl shadow-emerald-950/20">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="relative z-10 p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm"><Building2 className="h-7 w-7 text-emerald-100" /></div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 ring-1 ring-emerald-300/30">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" /></span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Support online</span>
                </span>
                {zone && <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/50">· {zone}</span>}
              </div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">Your waste service provider</p>
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-[26px]">{name}</h2>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 sm:flex"><ShieldCheck className="h-4 w-4 text-emerald-300" /><span className="text-xs font-semibold text-emerald-50">Verified operator</span></div>
        </div>

        {(days.length > 0 || window) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4, delay: 0.1, ease: EASE }} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60"><CalendarClock className="h-3.5 w-3.5" /> Collection days</p>
              <p className="text-sm font-bold text-white">{days.length ? days.join(' · ') : 'As scheduled'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60"><Clock className="h-3.5 w-3.5" /> Time window</p>
              <p className="text-sm font-bold text-white">{window || 'Provider window'}</p>
            </div>
          </motion.div>
        )}

        <div className="mt-7">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/60"><Headphones className="h-3.5 w-3.5" /> Reach your hauler</p>
          {companyContacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-5 text-sm text-emerald-100/70">Your provider hasn&rsquo;t published a contact line yet. It will appear here the moment they do.</div>
          ) : (
            <motion.div variants={contactContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {companyContacts.map((c, i) => {
                const { Icon, tone, ring } = META[c.type] || META.call;
                const href = hrefFor(c);
                return (
                  <motion.a key={`${c.type}-${i}`} variants={contactItem} href={href || undefined} target={c.type === 'whatsapp' ? '_blank' : undefined} rel="noreferrer" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3.5 text-left ring-1 ring-transparent transition-shadow duration-200 hover:shadow-lg hover:shadow-black/20 ${ring}`}>
                    <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-50 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 transition-colors group-hover:bg-emerald-100 ${tone}`}><Icon className="h-5 w-5" strokeWidth={2.25} /></span>
                    <span className="relative min-w-0 flex-1">
                      <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{c.label}</span>
                      <span className="block truncate text-[15px] font-bold tabular-nums text-gray-900">{c.value}</span>
                    </span>
                    <ArrowUpRight className={`relative h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${tone}`} />
                  </motion.a>
                );
              })}
            </motion.div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-emerald-100/70">
          <span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-emerald-300" /> Updated live from provider profile</span>
          {activeSince && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-300" /> Active since {activeSince}</span>}
        </div>
      </div>
    </motion.section>
  );
}