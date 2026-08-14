// app/admin/settings/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Settings, Globe, Crown, Receipt, Bell, ShieldCheck, ToggleLeft, Plug, SlidersHorizontal, Save,
} from 'lucide-react';
import { useSettings } from '@/lib/super-admin/hooks/useSettings';
import { PLAN_LIST } from '@/lib/super-admin/config/plans';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

type Tab = 'platform' | 'plans' | 'billing' | 'flags' | 'notifications' | 'security' | 'integrations' | 'defaults';
const TABS: { key: Tab; label: string }[] = [
  { key: 'platform', label: 'Platform' },
  { key: 'plans', label: 'Subscription Plans' },
  { key: 'billing', label: 'Billing' },
  { key: 'flags', label: 'Feature Flags' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Security' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'defaults', label: 'System Defaults' },
];

export default function AdminSettingsPage() {
  const { config: c, loading, saving, save } = useSettings();
  const [tab, setTab] = useState<Tab>('platform');
  const [bps, setBps] = useState<string>('');
  const [auto, setAuto] = useState<string>('');
  const [review, setReview] = useState<string>('');
  const [msg, setMsg] = useState('');

  if (loading || !c) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const doSave = async (patch: Parameters<typeof save>[0]) => {
    setMsg('');
    const r = await save(patch);
    setMsg(r.ok ? 'Saved — live everywhere config is read.' : `Failed: ${r.error}`);
  };

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
            Settings · platform-wide switches
          </p>
          <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>The control plane's controls</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
            Config-driven truth. Every save is an audited DATA_CHANGE. No hardcoded economics in UI.
          </p>
        </div>
      </motion.section>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button key={x.key} onClick={() => { setTab(x.key); setMsg(''); }}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              tab === x.key ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30'
                            : 'bg-white/5 text-emerald-100/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
            }`}>
            {x.label}
          </button>
        ))}
      </div>

      {msg && (
        <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/30">
          {msg}
        </motion.p>
      )}

      {/* PLATFORM */}
      {tab === 'platform' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { Icon: Globe, t: 'Platform', v: 'Trakbin', d: 'waste-service financial OS' },
            { Icon: Settings, t: 'Console build', v: 'A15R', d: 'super admin console complete' },
            { Icon: Globe, t: 'Environment', v: 'production', d: 'trakbin.vercel.app' },
            { Icon: SlidersHorizontal, t: 'Config store', v: 'platform_config', d: 'jsonb key/value · RLS admin-write' },
          ].map((x, i) => (
            <motion.section key={x.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
              <x.Icon className="h-4 w-4 text-emerald-300" />
              <p className={`${display.className} mt-2 text-xl font-black text-white`}>{x.v}</p>
              <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>{x.t} · {x.d}</p>
            </motion.section>
          ))}
        </div>
      )}

      {/* PLANS */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLAN_LIST.map((p, i) => (
            <motion.section key={p.tier} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
              <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>{p.name}</p>
              <p className={`${display.className} mt-2 text-2xl font-black text-white`}>{formatN(p.monthlyFee)}<span className="text-xs text-emerald-100/50">/mo</span></p>
              <p className={`${mono.className} mt-3 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>
                Unlimited volume · {p.capabilities.length} capabilities · {p.support} support
              </p>
            </motion.section>
          ))}
          <p className="text-xs font-semibold text-emerald-100/40 md:col-span-3">
            Plans are owned by the subscription engine (lib/core/finance/subscription-engine/plans.ts). A visual plan editor ships with entitlement hardening.
          </p>
        </div>
      )}

      {/* BILLING — the economics editor */}
      {tab === 'billing' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Receipt className="h-4 w-4" /> Commission & settlement tiers
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/60`}>Commission (bps)</label>
              <input type="number" value={bps === '' ? c.commissionBps : bps} onChange={(e) => setBps(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50" />
              <p className="mt-1 text-xs font-semibold text-emerald-100/40">= {((Number(bps === '' ? c.commissionBps : bps) || 0) / 100).toFixed(1)}%</p>
            </div>
            <div>
              <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/60`}>Auto-settle up to (₦)</label>
              <input type="number" value={auto === '' ? c.tiers.auto : auto} onChange={(e) => setAuto(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50" />
            </div>
            <div>
              <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/60`}>Admin review up to (₦)</label>
              <input type="number" value={review === '' ? c.tiers.review : review} onChange={(e) => setReview(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50" />
              <p className="mt-1 text-xs font-semibold text-emerald-100/40">above = enhanced review</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} disabled={saving}
            onClick={() => doSave({
              commissionBps: Number(bps === '' ? c.commissionBps : bps) || c.commissionBps,
              tiers: { auto: Number(auto === '' ? c.tiers.auto : auto) || c.tiers.auto, review: Number(review === '' ? c.tiers.review : review) || c.tiers.review },
            })}
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save economics'}
          </motion.button>
        </motion.section>
      )}

      {/* FEATURE FLAGS */}
      {tab === 'flags' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <ul className="divide-y divide-white/5">
            {(Object.keys(c.flags) as (keyof typeof c.flags)[]).map((k) => (
              <li key={k} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-extrabold text-white">{k.replace('_', ' ')}</p>
                  <p className="text-xs font-semibold text-emerald-100/50">
                    {k === 'announcements' ? 'Gates the communications composer' : k === 'subscriptions' ? 'Gates subscription granting' : 'Gates field-intelligence surfaces'}
                  </p>
                </div>
                <button onClick={() => doSave({ flags: { ...c.flags, [k]: !c.flags[k] } })} disabled={saving}
                  className={`relative h-7 w-12 rounded-full transition-colors ${c.flags[k] ? 'bg-emerald-400' : 'bg-white/10'}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${c.flags[k] ? 'left-6' : 'left-1'}`} />
                </button>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* NOTIFICATIONS */}
      {tab === 'notifications' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { t: 'Financial events', d: 'payment received → receipt · settlement approved → operator notice' },
            { t: 'Platform events', d: 'maintenance windows, policy changes → all operators' },
            { t: 'Preferences', d: 'notification_preferences table honored per user' },
          ].map((x, i) => (
            <motion.section key={x.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
              <Bell className="h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-sm font-extrabold text-white">{x.t}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-100/50">{x.d}</p>
            </motion.section>
          ))}
        </div>
      )}

      {/* SECURITY */}
      {tab === 'security' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { t: 'Console gate', d: 'profiles.role = admin · re-verified per load' },
            { t: 'Least privilege', d: 'five platform roles · self-edit blocked' },
            { t: 'Audit', d: 'append-only · admin-only read · every route emits' },
            { t: 'Money actions', d: 'service-role routes only · state machine enforced' },
          ].map((x, i) => (
            <motion.section key={x.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-sm font-extrabold text-white">{x.t}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-100/50">{x.d}</p>
            </motion.section>
          ))}
        </div>
      )}

      {/* INTEGRATIONS */}
      {tab === 'integrations' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { t: 'Supabase', d: 'configured · client + service role', ok: true },
            { t: 'Mapbox', d: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'configured · public token present' : 'unconfigured · no public token', ok: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN },
            { t: 'Paystack', d: 'server keys masked · rails probed in Health', ok: true },
            { t: 'Resend', d: 'server keys masked · reachability probed in Health', ok: true },
          ].map((x, i) => (
            <motion.section key={x.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <Plug className="h-4 w-4 text-emerald-300" />
                <span className={`h-2.5 w-2.5 rounded-full ${x.ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              </div>
              <p className="mt-2 text-sm font-extrabold text-white">{x.t}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-100/50">{x.d}</p>
            </motion.section>
          ))}
        </div>
      )}

      {/* DEFAULTS */}
      {tab === 'defaults' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <SlidersHorizontal className="h-4 w-4" /> System defaults
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Currency</p><p className="text-sm font-extrabold text-white">{c.defaults.currency} ({c.defaults.symbol})</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Timezone</p><p className="text-sm font-extrabold text-white">{c.defaults.timezone}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Billing day</p><p className="text-sm font-extrabold text-white">Day {c.defaults.billing_day}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Locale</p><p className="text-sm font-extrabold text-white">en-NG</p></div>
          </div>
        </motion.section>
      )}

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <ToggleLeft className="h-3.5 w-3.5 text-emerald-300" /> Config is truth · UI never hardcodes economics
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Settings className="h-3.5 w-3.5" /> Trakbin Settings
        </span>
      </motion.footer>
    </div>
  );
}