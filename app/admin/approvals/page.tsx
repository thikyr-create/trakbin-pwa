// app/admin/approvals/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  CheckSquare, Building2, ShieldCheck, MapPin, Crown, KeyRound,
  CircleCheck, CircleX, Loader2, Eye,
} from 'lucide-react';
import { useApprovals } from '@/lib/super-admin/hooks/useApprovals';
import { adminSupabase } from '@/lib/super-admin/supabase/client';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = 'organizations' | 'verification' | 'claims' | 'subscriptions' | 'recovery';
const TABS: { key: Tab; label: string }[] = [
  { key: 'organizations', label: 'Organization Applications' },
  { key: 'verification', label: 'Operator Verification' },
  { key: 'claims', label: 'Property Claims' },
  { key: 'subscriptions', label: 'Subscription Exceptions' },
  { key: 'recovery', label: 'Account Recovery' },
];

const pick = (row: any, keys: string[]): any => {
  for (const k of keys) if (row?.[k] != null) return row[k];
  return null;
};

export default function AdminApprovalsPage() {
  const { queues: q, loading, reload, act } = useApprovals();
  const [tab, setTab] = useState<Tab>('organizations');
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState<Record<string, boolean>>({});

  if (loading || !q) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const total = q.orgApplications.length + q.verification.length + q.propertyClaims.length +
    q.subscriptionExceptions.length + q.accountRecovery.length;

  const doAct = async (id: string, action: 'approve' | 'reject') => {
    setBusy((b) => ({ ...b, [id]: action }));
    const json = await act(id, action);
    setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
    if (json.ok) reload();
    else alert(json.error || 'Action failed');
  };

  // Q1: atomic claim activation through the production RPC
  const activateRpc = async (r: any) => {
    const companyId = r.company_id ?? Number(prompt('Operator ID to activate this claim for:') || NaN);
    if (!companyId || isNaN(companyId)) return;
    setActivating((a) => ({ ...a, [String(r.id)]: true }));
    const { data, error } = await adminSupabase.rpc('activate_service_request', {
      p_building_id: r.building_id,
      p_company_id: companyId,
    });
    setActivating((a) => ({ ...a, [String(r.id)]: false }));
    if (error) alert(error.message);
    else {
      alert(`Activated: ${(data as any)?.building_id} → org ${(data as any)?.company_id}`);
      reload();
    }
  };

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
              Approvals · platform-level decisions
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Awaiting decision</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Claim model: caretaker claims → company reviews → platform verifies → relationship activated.
            </p>
          </div>
          <p className={`${display.className} text-5xl font-black tabular-nums text-white`}>{total}</p>
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

      {/* ORGANIZATION APPLICATIONS */}
      {tab === 'organizations' && (
        <Queue icon={Building2} title="Organization applications" rows={q.orgApplications}
          empty="No organization applications awaiting review."
          render={(r: any) => ({
            head: String(pick(r, ['business_name', 'company_name', 'name']) || `Application #${pick(r, ['id'])}`),
            meta: `${pick(r, ['license_number']) ? `license ${pick(r, ['license_number'])} · ` : ''}${pick(r, ['created_at']) ? new Date(pick(r, ['created_at'])).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : ''}`,
            badge: String(pick(r, ['status']) || 'pending'),
          })} />
      )}

      {/* OPERATOR VERIFICATION — actionable */}
      {tab === 'verification' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-amber-400/30 bg-amber-400/[0.06]">
          <div className="flex items-center justify-between border-b border-amber-400/20 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80`}>
              <ShieldCheck className="h-4 w-4" /> Operator verification
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-amber-200/70`}>{q.verification.length}</span>
          </div>
          {q.verification.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-amber-100/60">No open verification requests.</p>
          ) : (
            <ul className="divide-y divide-amber-400/10">
              {q.verification.map((r: any, i: number) => (
                <motion.li key={String(pick(r, ['id']) ?? i)} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {String(pick(r, ['business_name', 'full_name', 'email']) || `Request #${String(pick(r, ['id'])).slice(0, 8)}`)}
                    </p>
                    <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-100/50`}>
                      {pick(r, ['created_at']) ? new Date(pick(r, ['created_at'])).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} disabled={!!busy[String(pick(r, ['id']))]} onClick={() => doAct(String(pick(r, ['id'])), 'approve')}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
                      {busy[String(pick(r, ['id']))] === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleCheck className="h-3.5 w-3.5" />} Approve
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} disabled={!!busy[String(pick(r, ['id']))]} onClick={() => doAct(String(pick(r, ['id'])), 'reject')}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-400/90 px-4 py-2 text-xs font-extrabold text-rose-950 hover:bg-rose-300 disabled:bg-white/10 disabled:text-white/40">
                      {busy[String(pick(r, ['id']))] === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleX className="h-3.5 w-3.5" />} Reject
                    </motion.button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      {/* PROPERTY CLAIMS — actionable via production RPC */}
      {tab === 'claims' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <MapPin className="h-4 w-4" /> Property claims
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{q.propertyClaims.length}</span>
          </div>
          {q.propertyClaims.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No property claims awaiting activation.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {q.propertyClaims.map((r: any, i: number) => (
                <motion.li key={String(pick(r, ['id']) ?? i)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="text-sm font-extrabold text-white">{String(pick(r, ['building_id']) || 'Claim')}</p>
                    <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                      {pick(r, ['request_number']) || ''}{pick(r, ['submitted_at']) ? ` · ${new Date(pick(r, ['submitted_at'])).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}` : ''}
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} disabled={!!activating[String(r.id)]} onClick={() => activateRpc(r)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
                    {activating[String(r.id)] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleCheck className="h-3.5 w-3.5" />} Activate via RPC
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      {/* SUBSCRIPTION EXCEPTIONS */}
      {tab === 'subscriptions' && (
        <Queue icon={Crown} title="Subscription exceptions" rows={q.subscriptionExceptions}
          empty="No subscription exceptions — no lapsed periods, no cancelled-while-owing."
          render={(r: any) => ({
            head: `Operator #${r.company_id}`,
            meta: `${r.plan} · ${r.status}${r.current_period_end ? ` · period ended ${new Date(r.current_period_end).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}` : ''}`,
            badge: 'exception',
          })} />
      )}

      {/* ACCOUNT RECOVERY */}
      {tab === 'recovery' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <KeyRound className="mx-auto h-8 w-8 text-emerald-300/40" />
          <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>No recovery requests</p>
          <p className="mt-1 text-sm font-medium text-emerald-100/50">Account recovery requests will queue here when the flow ships. Real empty state.</p>
        </motion.section>
      )}

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <CheckSquare className="h-3.5 w-3.5 text-emerald-300" /> Decisions server-gated · activation atomic via RPC
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <CheckSquare className="h-3.5 w-3.5" /> Trakbin Approvals
        </span>
      </motion.footer>
    </div>
  );
}

function Queue({ icon: Icon, title, rows, empty, render }: {
  icon: any; title: string; rows: any[]; empty: string;
  render: (row: any) => { head: string; meta: string; badge: string };
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          <Icon className="h-4 w-4" /> {title}
        </p>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">{empty}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((r: any, i: number) => {
            const x = render(r);
            return (
              <motion.li key={String(pick(r, ['id']) ?? i)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm font-extrabold text-white">{x.head}</p>
                  {x.meta && <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{x.meta}</p>}
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50 ring-1 ring-white/10">
                  <Eye className="h-3 w-3" /> {x.badge}
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}