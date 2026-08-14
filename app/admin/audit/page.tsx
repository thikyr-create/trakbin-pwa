// app/admin/audit/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Shield, ScrollText, Fingerprint, Database, Receipt, KeyRound, Cog, UserCheck,
} from 'lucide-react';
import { useAudit } from '@/lib/super-admin/hooks/useAudit';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = 'all' | 'ADMIN_ACTION' | 'SECURITY_EVENT' | 'DATA_CHANGE' | 'BILLING_EVENT' | 'PERMISSION_CHANGE' | 'SYSTEM_EVENT';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Audit Logs' },
  { key: 'ADMIN_ACTION', label: 'Admin Actions' },
  { key: 'SECURITY_EVENT', label: 'Security Events' },
  { key: 'DATA_CHANGE', label: 'Data Changes' },
  { key: 'BILLING_EVENT', label: 'Billing Events' },
  { key: 'PERMISSION_CHANGE', label: 'Permission Changes' },
  { key: 'SYSTEM_EVENT', label: 'System Events' },
];

const CATEGORY_ICON: Record<string, any> = {
  ADMIN_ACTION: UserCheck, SECURITY_EVENT: Fingerprint, DATA_CHANGE: Database,
  BILLING_EVENT: Receipt, PERMISSION_CHANGE: KeyRound, SYSTEM_EVENT: Cog,
};

const CATEGORY_TONE: Record<string, string> = {
  ADMIN_ACTION: 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30',
  SECURITY_EVENT: 'text-amber-300 bg-amber-400/10 ring-amber-300/30',
  DATA_CHANGE: 'text-blue-300 bg-blue-400/10 ring-blue-300/30',
  BILLING_EVENT: 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30',
  PERMISSION_CHANGE: 'text-rose-300 bg-rose-400/10 ring-rose-300/30',
  SYSTEM_EVENT: 'text-emerald-100/60 bg-white/5 ring-white/10',
};

export default function AdminAuditPage() {
  const { events, loading } = useAudit();
  const [tab, setTab] = useState<Tab>('all');

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const filtered = tab === 'all' ? events : events.filter((e) => e.category === tab);
  const countFor = (k: Tab) => k === 'all' ? events.length : events.filter((e) => e.category === k).length;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10 flex items-end justify-between gap-6">
          <div>
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
              Audit & governance · the record
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Everything leaves a trace</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Append-only. Admin-only read. Every sensitive route emits. No silent operations.
            </p>
          </div>
          <p className={`${display.className} text-5xl font-black tabular-nums text-white`}>{events.length}</p>
        </div>
      </motion.section>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button key={x.key} onClick={() => setTab(x.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              tab === x.key ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30'
                            : 'bg-white/5 text-emerald-100/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
            }`}>
            {x.label}
            <span className={`${mono.className} ml-1.5 ${tab === x.key ? 'text-emerald-900' : 'text-emerald-300/60'}`}>{countFor(x.key)}</span>
          </button>
        ))}
      </div>

      {/* EVENT STREAM */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ScrollText className="mx-auto h-8 w-8 text-emerald-300/40" />
            <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>No {tab === 'all' ? '' : TABS.find((t) => t.key === tab)?.label.toLowerCase() + ' '}events yet</p>
            <p className="mt-1 text-sm font-medium text-emerald-100/50">
              Act anywhere in the console — settlements, approvals, role changes, announcements, logins — and the record grows.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((e, i) => {
              const Icon = CATEGORY_ICON[e.category] || ScrollText;
              return (
                <motion.li key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-emerald-300 ring-1 ring-white/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-white">{e.action}</p>
                      <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                        {e.actor_email || e.actor_id?.slice(0, 8) || 'system'}{e.target && ` · → ${e.target}`}{e.reason && ` · ${e.reason}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${CATEGORY_TONE[e.category] || CATEGORY_TONE.SYSTEM_EVENT}`}>
                      {e.category}
                    </span>
                    <span className={`${mono.className} text-[10px] font-bold text-emerald-100/40`}>
                      {new Date(e.created_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>

      {/* GOVERNANCE DOCTRINE */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
        className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          <Shield className="h-4 w-4" /> Governance doctrine
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            { t: 'Append-only', d: 'Events are never updated or deleted by application code.' },
            { t: 'Admin-only read', d: 'RLS exposes the record to admins exclusively.' },
            { t: 'Every route emits', d: 'Settlements, approvals, roles, comms, console access.' },
            { t: 'Actor attribution', d: 'Every event names who, what, target, and why.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/5">
              <p className="text-sm font-extrabold text-white">{x.t}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-100/50">{x.d}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Shield className="h-3.5 w-3.5 text-amber-300" /> If it isn't in the audit log, it didn't happen
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Shield className="h-3.5 w-3.5" /> Trakbin Governance
        </span>
      </motion.footer>
    </div>
  );
}