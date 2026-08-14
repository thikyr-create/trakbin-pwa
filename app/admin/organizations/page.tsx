// app/admin/organizations/page.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Building2, Truck, Users, MapPin, ChevronDown, ChevronRight, Search,
  ShieldCheck, Crown, Receipt, Wallet, Activity, Store,
} from 'lucide-react';
import { useOrganizations } from '@/lib/super-admin/hooks/useOrganizations';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

type Tab = 'all' | 'operators' | 'properties' | 'agencies' | 'verification';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Organizations' },
  { key: 'operators', label: 'Waste Operators' },
  { key: 'properties', label: 'Properties / Estates' },
  { key: 'agencies', label: 'Waste Agencies' },
  { key: 'verification', label: 'Verification' },
];

function A7Tag() {
  return <span className={`${mono.className} ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-100/50`}>A7R</span>;
}

export default function AdminOrganizationsPage() {
  const { orgs, properties, verifications, loading, openId, profile, toggle } = useOrganizations();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const q = search.toLowerCase();
  const filteredOrgs = orgs.filter((o) => !q || o.name.toLowerCase().includes(q));
  const filteredProps = properties.filter((p) => !q || p.custom_id.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q) || (p.estate || '').toLowerCase().includes(q) || (p.operator || '').toLowerCase().includes(q));

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
              Organizations · who uses Trakbin
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Platform organizations</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Identity, access, usage and billing per organization. Operations stay inside each company's own dashboard.
            </p>
          </div>
          <p className={`${display.className} text-5xl font-black tabular-nums text-white`}>{orgs.length}</p>
        </div>
      </motion.section>

      {/* TABS + SEARCH */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              tab === t.key ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30'
                            : 'bg-white/5 text-emerald-100/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
        <div className="relative ml-auto min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/40" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-emerald-100/40 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20" />
        </div>
      </div>

      {/* ORGS (all + operators) */}
      {(tab === 'all' || tab === 'operators') && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          {filteredOrgs.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No organizations match.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {filteredOrgs.map((o, i) => (
                <motion.li key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}>
                  <button onClick={() => toggle(o.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-white/[0.02]">
                    <div className="flex min-w-0 items-center gap-3">
                      {openId === o.id ? <ChevronDown className="h-4 w-4 shrink-0 text-emerald-300" /> : <ChevronRight className="h-4 w-4 shrink-0 text-emerald-300/50" />}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-white">{o.name}</p>
                        <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                          {o.kind.replace('_', ' ')} · #{o.id}{o.contactPhone && ` · ${o.contactPhone}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-right">
                      <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Properties</p><p className="text-sm font-extrabold text-white">{o.properties}</p></div>
                      <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Drivers</p><p className="text-sm font-extrabold text-white">{o.drivers}</p></div>
                      <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Trucks</p><p className="text-sm font-extrabold text-white">{o.trucks}</p></div>
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-300/30">{o.status}</span>
                    </div>
                  </button>

                  {/* PLATFORM PROFILE */}
                  <AnimatePresence>
                    {openId === o.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/5 bg-black/20 px-6 py-5">
                        {!profile ? (
                          <div className="flex items-center justify-center py-6">
                            <motion.div className="h-6 w-6 rounded-full border-b-2 border-emerald-400" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><ShieldCheck className="h-3 w-3" /> Status</p>
                              <p className="mt-1 text-sm font-extrabold text-emerald-300">{profile.status}</p>
                            </div>
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><Crown className="h-3 w-3" /> Plan<A7Tag /></p>
                              <p className="mt-1 text-sm font-extrabold text-white">—</p>
                            </div>
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><Crown className="h-3 w-3" /> Subscription<A7Tag /></p>
                              <p className="mt-1 text-sm font-extrabold text-white">—</p>
                            </div>
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><Users className="h-3 w-3" /> Users</p>
                              <p className="mt-1 text-sm font-extrabold text-white">{profile.users}</p>
                            </div>
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><Receipt className="h-3 w-3" /> Monthly fee<A7Tag /></p>
                              <p className="mt-1 text-sm font-extrabold text-white">{formatN(0)}</p>
                            </div>
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><Wallet className="h-3 w-3" /> Gross collected</p>
                              <p className="mt-1 text-sm font-extrabold text-white">{formatN(profile.grossCollected)}</p>
                            </div>
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><Wallet className="h-3 w-3" /> Net payable</p>
                              <p className="mt-1 text-sm font-extrabold text-emerald-300">{formatN(profile.netPayable)}</p>
                            </div>
                            <div>
                              <p className={`${mono.className} flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}><Activity className="h-3 w-3" /> Last activity</p>
                              <p className="mt-1 text-sm font-extrabold text-white">
                                {profile.lastActivityAt ? new Date(profile.lastActivityAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : '—'}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      {/* PROPERTIES */}
      {tab === 'properties' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <MapPin className="h-4 w-4" /> Properties on platform
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{filteredProps.length}</span>
          </div>
          {filteredProps.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No properties match.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {filteredProps.map((p, i) => (
                <motion.li key={p.custom_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-white">{p.custom_id}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-emerald-100/50">{p.address}{p.estate && ` · ${p.estate}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-300">{p.operator}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      p.payment_status === 'paid' ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-300/30'
                      : p.payment_status === 'overdue' ? 'bg-rose-400/10 text-rose-300 ring-rose-300/30'
                      : 'bg-amber-400/10 text-amber-300 ring-amber-300/30'
                    }`}>{p.payment_status}</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50 ring-1 ring-white/10">{p.status}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      {/* AGENCIES */}
      {tab === 'agencies' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <Store className="mx-auto h-8 w-8 text-emerald-300/40" />
          <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>No waste agencies yet</p>
          <p className="mt-1 text-sm font-medium text-emerald-100/50">The agency organization type lands when the model is introduced. Real empty state.</p>
        </motion.section>
      )}

      {/* VERIFICATION */}
      {tab === 'verification' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <ShieldCheck className="h-4 w-4" /> Verification queue
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{verifications.length}</span>
          </div>
          {verifications.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No verification requests in the queue.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {verifications.map((v: any, i) => {
                const status = v.status ?? v.state ?? v.verification_status ?? 'pending';
                const label = v.email ?? v.business_name ?? v.full_name ?? (v.company_id != null ? `Org #${v.company_id}` : String(v.id || '').slice(0, 8));
                const at = v.created_at ?? v.submitted_at ?? null;
                return (
                  <motion.li key={String(v.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="text-sm font-extrabold text-white">{label}</p>
                      {at && <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{new Date(at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p>}
                    </div>
                    <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30">{String(status)}</span>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.section>
      )}

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Building2 className="h-3.5 w-3.5 text-emerald-300" /> Platform profiles · operations stay in company dashboards
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Building2 className="h-3.5 w-3.5" /> Trakbin Organizations
        </span>
      </motion.footer>
    </div>
  );
}