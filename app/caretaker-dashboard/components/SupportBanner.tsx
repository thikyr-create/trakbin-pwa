"use client";

import { motion } from 'framer-motion';
import {
  Phone, MessageCircle, Mail, MapPin, Headphones, ShieldCheck,
  Clock, Radio, ArrowUpRight, Building2, LifeBuoy,
} from 'lucide-react';
import { useCaretakerSession, type CaretakerContact } from '@/lib/store/useCaretakerSession';

const digitsOnly = (v: string) => v.replace(/[^\d]/g, '');
const telHref = (v: string) => `tel:${v.replace(/[^\d+]/g, '')}`;
const waHref = (v: string) => `https://wa.me/${digitsOnly(v)}`;
const mailHref = (v: string) => `mailto:${v}`;

function hrefFor(c: CaretakerContact): string | null {
  switch (c.type) {
    case 'call':
    case 'emergency':
    case 'office':
      return telHref(c.value);
    case 'whatsapp':
      return waHref(c.value);
    case 'email':
      return mailHref(c.value);
    default:
      return /\S+@\S+\.\S+/.test(c.value) ? mailHref(c.value) : telHref(c.value);
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

export default function SupportBanner() {
  const { activeAssignment, companyProfile, companyContacts } = useCaretakerSession();
  const isActive = !!activeAssignment && !!companyProfile;
  const name = companyProfile?.business_name || 'Your waste provider';
  const zone = activeAssignment?.zone_id;

  // ── PRE-ACTIVATION: a living status panel, never a dead button ──────────
  if (!isActive) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-[22px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20"
      >
        {/* ambient contour field */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'repeating-radial-gradient(circle at 88% -10%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
              </span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                Awaiting activation
              </span>
            </div>
            <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-[28px]">
              We&rsquo;re matching you with a hauler
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">
              Your building is registered and queued. Once a waste company in your zone accepts the request, their contact line appears here automatically — no saving, no searching.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <Clock className="h-4 w-4 text-emerald-200" />
              <span className="text-xs font-semibold text-emerald-50">Estimated activation</span>
              <span className="font-mono text-xs font-bold text-white">~6 hrs</span>
            </div>
          </div>

          {/* mini onboarding spine */}
          <ol className="relative shrink-0 space-y-4 pl-1 lg:w-72">
            <span aria-hidden className="absolute left-[11px] top-2 bottom-2 w-px bg-white/15" />
            {ONBOARD_STEPS.map((label, i) => {
              const done = i === 0;
              const current = i === 1;
              return (
                <li key={label} className="relative flex items-center gap-3">
                  <span
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-emerald-950 ${
                      done ? 'bg-emerald-400' : current ? 'bg-amber-300' : 'bg-white/15'
                    }`}
                  >
                    {current && (
                      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-300/60" />
                    )}
                    <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-950' : current ? 'bg-amber-900' : 'bg-white/40'}`} />
                  </span>
                  <span className={`text-sm font-semibold ${done || current ? 'text-white' : 'text-emerald-100/45'}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </motion.section>
    );
  }

  // ── ACTIVE: the live, multi-number contact console ─────────────────────
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden rounded-[22px] border border-emerald-200/70 bg-emerald-950 text-white shadow-xl shadow-emerald-950/20"
    >
      {/* ambient layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

      <div className="relative z-10 p-7">
        {/* identity row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <Building2 className="h-7 w-7 text-emerald-100" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 ring-1 ring-emerald-300/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                    Support online
                  </span>
                </span>
                {zone && (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/50">
                    · Zone {zone}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                Your waste service provider
              </p>
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-[26px]">
                {name}
              </h2>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span className="text-xs font-semibold text-emerald-50">Verified operator</span>
          </div>
        </div>

        {/* contact actions — one per number, referenced from the live profile */}
        <div className="mt-7">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/60">
            <Headphones className="h-3.5 w-3.5" /> Reach your hauler
          </p>

          {companyContacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-5 text-sm text-emerald-100/70">
              Your provider hasn&rsquo;t published a contact line yet. It will appear here the moment they do.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {companyContacts.map((c, i) => {
                const { Icon, tone, ring } = META[c.type] || META.call;
                const href = hrefFor(c);
                return (
                  <motion.a
                    key={`${c.type}-${i}`}
                    href={href || undefined}
                    target={c.type === 'whatsapp' ? '_blank' : undefined}
                    rel="noreferrer"
                    whileTap={{ scale: 0.97 }}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3.5 text-left ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${ring}`}
                  >
                    {/* hover sheen */}
                    <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-50 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 transition-colors group-hover:bg-emerald-100 ${tone}`}>
                      <Icon className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <span className="relative min-w-0 flex-1">
                      <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        {c.label}
                      </span>
                      <span className="block truncate text-[15px] font-bold tabular-nums text-gray-900">
                        {c.value}
                      </span>
                    </span>
                    <ArrowUpRight className={`relative h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${tone}`} />
                  </motion.a>
                );
              })}
            </div>
          )}
        </div>

        {/* reassurance strip */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-emerald-100/70">
          <span className="inline-flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-300" /> Updated live from provider profile
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-300" /> Avg response &lt; 4 hrs
          </span>
        </div>
      </div>
    </motion.section>
  );
}