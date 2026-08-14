// app/admin/users/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Users, Shield, KeyRound, Building2, Ban, Fingerprint, ScrollText, Check,
} from 'lucide-react';
import { useUsers } from '@/lib/super-admin/hooks/useUsers';
import { PLATFORM_ROLES, capabilitiesFor } from '@/lib/super-admin/config/permissions';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = 'all' | 'roles' | 'organizations' | 'suspended' | 'auth' | 'logs';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Users' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'organizations', label: 'Organizations' },
  { key: 'suspended', label: 'Suspended Users' },
  { key: 'auth', label: 'Authentication' },
  { key: 'logs', label: 'Access Logs' },
];

const pick = (row: any, keys: string[]): any => {
  for (const k of keys) if (row?.[k] != null) return row[k];
  return null;
};

export default function AdminUsersPage() {
  const { users, logs, loading, myId, reload, setRole } = useUsers();
  const [tab, setTab] = useState<Tab>('all');
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const platformAdmins = users.filter((u) => u.platformRole != null || u.tenantRole === 'admin');
  const suspended = users.filter((u) => ['suspended', true].includes((u as any).suspended));
  const byOrg = new Map<number, number>();
  users.forEach((u) => { if (u.companyId != null) byOrg.set(u.companyId, (byOrg.get(u.companyId) || 0) + 1); });

  const changeRole = async (userId: string, role: string) => {
    setBusy((b) => ({ ...b, [userId]: true }));
    const json = await setRole(userId, role === '' ? null : role);
    setBusy((b) => ({ ...b, [userId]: false }));
    if (json.ok) reload();
    else alert(json.error || 'Role change failed');
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
              Users & access · platform identity
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Least privilege</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Tenant roles run tenants. Platform roles run Trakbin. Nobody gets SUPER_ADMIN by default.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Users</p><p className={`${display.className} mt-1 text-3xl font-black text-white`}>{users.length}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Platform admins</p><p className={`${display.className} mt-1 text-3xl font-black text-emerald-300`}>{platformAdmins.length}</p></div>
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

      {/* ALL USERS */}
      {tab === 'all' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <ul className="divide-y divide-white/5">
            {users.map((u, i) => (
              <motion.li key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-white">{u.email || u.id.slice(0, 8)}</p>
                  <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                    tenant: {u.tenantRole || '—'}{u.companyId != null && ` · org #${u.companyId}`}{u.accountType && ` · ${u.accountType}`}
                    {u.id === myId && ' · you'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>platform:</span>
                  <select value={u.platformRole || ''} disabled={busy[u.id] || u.id === myId}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-400/50 disabled:opacity-40">
                    <option value="">none</option>
                    {PLATFORM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* ROLES & PERMISSIONS MATRIX */}
      {tab === 'roles' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_ROLES.map((r, i) => (
            <motion.section key={r} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }}
              className={`rounded-[24px] border p-6 ${r === 'SUPER_ADMIN' ? 'border-amber-400/40 bg-amber-400/[0.05]' : 'border-white/10 bg-white/[0.03]'}`}>
              <p className={`${mono.className} flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] ${r === 'SUPER_ADMIN' ? 'text-amber-300' : 'text-emerald-300/70'}`}>
                <Shield className="h-3.5 w-3.5" /> {r}
              </p>
              <p className={`${display.className} mt-2 text-xl font-black text-white`}>{users.filter((u) => u.platformRole === r).length} holder{users.filter((u) => u.platformRole === r).length === 1 ? '' : 's'}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {capabilitiesFor(r).map((c) => (
                  <span key={c} className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-300/30">
                    <Check className="h-2.5 w-2.5" /> {c.replace(/:/g, ' ')}
                  </span>
                ))}
              </div>
            </motion.section>
          ))}
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: EASE }}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Doctrine</p>
            <ul className="mt-3 space-y-2 text-xs font-semibold text-emerald-100/60">
              <li>· Tenant roles never confer platform power.</li>
              <li>· Platform roles never confer tenant access.</li>
              <li>· You cannot change your own platform role.</li>
              <li>· Every role change is an auditable event.</li>
            </ul>
          </motion.section>
        </div>
      )}

      {/* ORGANIZATIONS */}
      {tab === 'organizations' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          {byOrg.size === 0 ? <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No users attached to organizations.</p> : (
            <ul className="divide-y divide-white/5">
              {[...byOrg.entries()].sort((a, b) => b[1] - a[1]).map(([orgId, count], i) => (
                <motion.li key={orgId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                  className="flex items-center justify-between px-6 py-4">
                  <span className="flex items-center gap-2 text-sm font-extrabold text-white"><Building2 className="h-4 w-4 text-emerald-300" /> Organization #{orgId}</span>
                  <span className={`${mono.className} text-xs font-bold text-emerald-300`}>{count} user{count === 1 ? '' : 's'}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      {/* SUSPENDED */}
      {tab === 'suspended' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <Ban className="mx-auto h-8 w-8 text-emerald-300/40" />
          <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>{suspended.length} suspended</p>
          <p className="mt-1 text-sm font-medium text-emerald-100/50">Suspension lands with the account-action engine. Real state.</p>
        </motion.section>
      )}

      {/* AUTHENTICATION */}
      {tab === 'auth' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { Icon: Fingerprint, title: 'Identity', lines: ['Supabase Auth · hashed credentials', 'Email confirmation enforced', 'DRV- employee-ID flow for drivers'] },
            { Icon: KeyRound, title: 'Sessions', lines: ['Real GoTrue sessions everywhere', 'Synthetic identities for caretakers', 'Admin console re-verifies role per load'] },
            { Icon: Shield, title: 'Policy', lines: ['Least privilege by config', 'Self-role-edit blocked server-side', 'Role grants via service-role route only'] },
          ].map((c, i) => (
            <motion.section key={c.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease: EASE }}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
              <p className={`${mono.className} flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
                <c.Icon className="h-3.5 w-3.5" /> {c.title}
              </p>
              <ul className="mt-3 space-y-2 text-xs font-semibold text-emerald-100/60">
                {c.lines.map((l) => <li key={l}>· {l}</li>)}
              </ul>
            </motion.section>
          ))}
        </div>
      )}

      {/* ACCESS LOGS */}
      {tab === 'logs' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <ScrollText className="h-4 w-4" /> Access logs
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{logs.length}</span>
          </div>
          {logs.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No audit events yet — the audit engine starts emitting in A14R.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {logs.map((l, i) => (
                <motion.li key={String(pick(l, ['id']) ?? i)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-2 px-6 py-3.5">
                  <span className="text-xs font-bold text-white">{String(pick(l, ['action', 'event_type', 'type']) || 'event')}</span>
                  <span className="text-xs font-semibold text-emerald-100/50">{String(pick(l, ['actor', 'user_id', 'actor_email']) || '')}</span>
                  <span className={`${mono.className} text-[10px] font-bold text-emerald-100/40`}>
                    {pick(l, ['created_at', 'timestamp']) ? new Date(pick(l, ['created_at', 'timestamp'])).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Users className="h-3.5 w-3.5 text-emerald-300" /> Platform identity ≠ company HR
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Users className="h-3.5 w-3.5" /> Trakbin Access
        </span>
      </motion.footer>
    </div>
  );
}