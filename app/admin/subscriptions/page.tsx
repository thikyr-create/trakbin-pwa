// app/admin/subscriptions/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Crown, RefreshCw, Ban, Plus, Gauge, Activity, Check } from 'lucide-react';
import { useSubscriptions } from '@/lib/super-admin/hooks/useSubscriptions';
import { PLAN_LIST, resolvePlan } from '@/lib/super-admin/config/plans';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

type Tab = 'plans' | 'active' | 'trials' | 'expiring' | 'cancelled' | 'usage' | 'events';
const TABS: { key: Tab; label: string }[] = [
  { key: 'plans', label: 'Plans' },
  { key: 'active', label: 'Active' },
  { key: 'trials', label: 'Trials' },
  { key: 'expiring', label: 'Expiring' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'usage', label: 'Usage' },
  { key: 'events', label: 'Subscription Events' },
];

const isExpiring = (periodEnd: string | null, status: string) =>
  !!periodEnd && ['active', 'trial'].includes(status) &&
  (new Date(periodEnd).getTime() - Date.now()) < 7 * 864e5;

function statusTone(s: string) {
  if (s === 'active') return 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30';
  if (s === 'trial') return 'text-blue-300 bg-blue-400/10 ring-blue-300/30';
  if (s === 'expiring') return 'text-amber-300 bg-amber-400/10 ring-amber-300/30';
  return 'text-rose-300 bg-rose-400/10 ring-rose-300/30';
}

export default function AdminSubscriptionsPage() {
  const { subs, events, usage, orgs, loading, reload, grant, renew, cancel } = useSubscriptions();
  const [tab, setTab] = useState<Tab>('plans');
  const [gOrg, setGOrg] = useState<number | ''>('');
  const [gPlan, setGPlan] = useState('starter');
  const [gStatus, setGStatus] = useState<'active' | 'trial'>('trial');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const active = subs.filter((s) => s.status === 'active');
  const trials = subs.filter((s) => s.status === 'trial');
  const expiring = subs.filter((s) => isExpiring(s.periodEnd, s.status));
  const cancelled = subs.filter((s) => s.status === 'cancelled');
  const mrr = active.reduce((s, x) => s + x.monthlyFee, 0);

  const doGrant = async () => {
    if (gOrg === '') return;
    setBusy(true);
    try { await grant(Number(gOrg), gPlan, gStatus); await reload(); }
    catch (e: any) { alert(e.message); }
    finally { setBusy(false); }
  };

  const list = tab === 'active' ? active : tab === 'trials' ? trials : tab === 'expiring' ? expiring : tab === 'cancelled' ? cancelled : [];

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
              Subscriptions · the commercial relationship
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Operator → Trakbin</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Platform revenue ledger. Never mixed with customer waste payments. Volume is never capped.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>MRR</p><p className={`${display.className} mt-1 text-3xl font-black text-emerald-300`}>{formatN(mrr)}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Active</p><p className={`${display.className} mt-1 text-3xl font-black text-white`}>{active.length}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Expiring</p><p className={`${display.className} mt-1 text-3xl font-black ${expiring.length ? 'text-amber-300' : 'text-white'}`}>{expiring.length}</p></div>
          </div>
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
          </button>
        ))}
      </div>

      {/* GRANT BAR */}
      {tab !== 'plans' && tab !== 'events' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-wrap items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <select value={gOrg} onChange={(e) => setGOrg(e.target.value === '' ? '' : Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50">
            <option value="">Select organization…</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={gPlan} onChange={(e) => setGPlan(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50">
            {PLAN_LIST.map((p) => <option key={p.tier} value={p.tier}>{p.name} · {formatN(p.monthlyFee)}/mo</option>)}
          </select>
          <select value={gStatus} onChange={(e) => setGStatus(e.target.value as 'active' | 'trial')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50">
            <option value="trial">Trial</option>
            <option value="active">Active</option>
          </select>
          <motion.button whileTap={{ scale: 0.97 }} onClick={doGrant} disabled={busy || gOrg === ''}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
            <Plus className="h-3.5 w-3.5" /> {busy ? 'Granting…' : 'Grant subscription'}
          </motion.button>
        </motion.div>
      )}

      {/* PLANS — capabilities + support, never volume */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLAN_LIST.map((p, i) => (
            <motion.section key={p.tier} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease: EASE }}
              className={`rounded-[24px] border p-6 ${p.tier === 'professional' ? 'border-emerald-400/40 bg-emerald-400/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
              <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>{p.name}</p>
              <p className={`${display.className} mt-2 text-3xl font-black text-white`}>{formatN(p.monthlyFee)}<span className="text-sm text-emerald-100/50">/mo</span></p>
              <p className={`${mono.className} mt-4 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>
                Unlimited properties · users · drivers · zones
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.capabilities.map((c) => (
                  <span key={c} className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-300/30">
                    <Check className="h-2.5 w-2.5" /> {c.replace('_', ' ')}
                  </span>
                ))}
              </div>
              <p className={`${mono.className} mt-4 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>{p.support} support</p>
            </motion.section>
          ))}
        </div>
      )}

      {/* STATUS LISTS */}
      {(['active', 'trials', 'expiring', 'cancelled'] as Tab[]).includes(tab) && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          {list.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">
              No {tab} subscriptions. Grant one above — it's real, not a mockup.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {list.map((s, i) => {
                const exp = isExpiring(s.periodEnd, s.status);
                const shown = exp ? 'expiring' : s.status;
                return (
                  <motion.li key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-white">{s.orgName}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${statusTone(shown)}`}>{shown}</span>
                        <span className={`${mono.className} rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/60`}>{resolvePlan(s.plan).name}</span>
                      </div>
                      <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                        {formatN(s.monthlyFee)}/mo · {s.periodEnd ? `period ends ${new Date(s.periodEnd).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}` : 'no period'}
                      </p>
                    </div>
                    {s.status !== 'cancelled' && (
                      <div className="flex items-center gap-2">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { await renew(s.id, s.companyId); reload(); }}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-400/10 px-3 py-2 text-xs font-extrabold text-emerald-200 ring-1 ring-emerald-300/30 hover:bg-emerald-400/20">
                          <RefreshCw className="h-3 w-3" /> Renew
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { await cancel(s.id, s.companyId); reload(); }}
                          className="flex items-center gap-1.5 rounded-xl bg-rose-400/10 px-3 py-2 text-xs font-extrabold text-rose-200 ring-1 ring-rose-300/30 hover:bg-rose-400/20">
                          <Ban className="h-3 w-3" /> Cancel
                        </motion.button>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.section>
      )}

      {/* USAGE — pure telemetry, no caps */}
      {tab === 'usage' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          {usage.length === 0 ? <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No subscriptions to measure usage for.</p> : (
            <ul className="divide-y divide-white/5">
              {usage.map((u: any, i) => {
                const plan = resolvePlan(u.plan);
                return (
                  <motion.li key={u.companyId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                    className="px-6 py-4">
                    <p className="text-sm font-extrabold text-white">Operator #{u.companyId} <span className={`${mono.className} ml-2 text-[10px] font-bold uppercase text-emerald-100/40`}>{plan.name}</span></p>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(['properties', 'users', 'drivers', 'zones'] as const).map((k) => (
                        <div key={k} className="rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
                          <p className={`${mono.className} text-[8px] font-bold uppercase tracking-wider text-emerald-100/40`}>{k}</p>
                          <p className="text-sm font-extrabold text-white">{u.usage[k]}</p>
                        </div>
                      ))}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.section>
      )}

      {/* EVENTS */}
      {tab === 'events' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <Activity className="h-4 w-4" /> Event stream
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{events.length}</span>
          </div>
          {events.length === 0 ? <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No subscription events yet. Grant, renew or cancel to emit the first.</p> : (
            <ul className="divide-y divide-white/5">
              {events.map((e, i) => (
                <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-2 px-6 py-3.5">
                  <span className={`${mono.className} rounded bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300`}>{e.type}</span>
                  <span className="text-xs font-semibold text-emerald-100/60">org #{e.company_id}</span>
                  <span className={`${mono.className} text-[10px] font-bold text-emerald-100/40`}>{new Date(e.created_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Gauge className="h-3.5 w-3.5 text-emerald-300" /> Entitlements resolve via canOrganizationAccess — volume is never capped
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Crown className="h-3.5 w-3.5" /> Trakbin Subscriptions
        </span>
      </motion.footer>
    </div>
  );
}