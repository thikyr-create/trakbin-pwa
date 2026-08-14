// app/admin/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  LayoutGrid, Building2, Network, CreditCard, Wallet, BookOpen,
  Crown, Eye, Mail, CheckSquare, Users, BarChart3, Activity, Shield,
  Settings, LogOut, Radio,
} from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });

export const ADMIN_NAV = [
  { key: 'overview',     label: 'Overview',            href: '/admin',                    Icon: LayoutGrid },
  { key: 'organizations',label: 'Organizations',       href: '/admin/organizations',      Icon: Building2 },
  { key: 'network',      label: 'Network',             href: '/admin/network',            Icon: Network },
  { key: 'payments',     label: 'Payments',            href: '/admin/payments',           Icon: CreditCard },
  { key: 'settlements',  label: 'Settlements',         href: '/admin/settlements',        Icon: Wallet },
  { key: 'ledger',       label: 'Financial Ledger',    href: '/admin/finance',            Icon: BookOpen }, // preserved existing page
  { key: 'subscriptions',label: 'Subscriptions',       href: '/admin/subscriptions',      Icon: Crown },
  { key: 'field',        label: 'Field Intelligence',  href: '/admin/field-intelligence', Icon: Eye },
  { key: 'comms',        label: 'Communications',      href: '/admin/communications',     Icon: Mail },
  { key: 'approvals',    label: 'Approvals',           href: '/admin/approvals',          Icon: CheckSquare },
  { key: 'users',        label: 'Users & Access',      href: '/admin/users',              Icon: Users },
  { key: 'analytics',    label: 'Analytics',           href: '/admin/analytics',          Icon: BarChart3 },
  { key: 'health',       label: 'Platform Health',     href: '/admin/health',             Icon: Activity },
  { key: 'audit',        label: 'Audit & Governance',  href: '/admin/audit',              Icon: Shield },
  { key: 'settings',     label: 'Settings',            href: '/admin/settings',           Icon: Settings },
] as const;

function isAllowed(role: string | null): boolean {
  if (role === 'admin') return true;
  if (typeof window !== 'undefined' && window.localStorage.getItem('trakbin_admin') === '1') return true;
  return false;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, loadTenantContext } = useCompanySession();

  useEffect(() => { loadTenantContext(); }, []);

  const allowed = isAllowed(tenant.role);

  useEffect(() => {
    if (tenant.loaded && !allowed) router.replace('/auth');
  }, [tenant.loaded, allowed, router]);

  if (!tenant.loaded) {
    return (
      <div className={`${body.className} flex min-h-screen items-center justify-center bg-[#0c1411]`}>
        <motion.div className="h-12 w-12 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }
  if (!allowed) return null;

  return (
    <div className={`${body.className} ${display.variable} ${mono.variable} relative min-h-screen bg-[#0c1411] text-gray-100`}>
      {/* ambient field */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.5]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a110e]/60 px-4 py-5 backdrop-blur lg:flex">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
              <span className={`${display.className} text-lg font-black text-emerald-950`}>T</span>
            </div>
            <div className="leading-none">
              <p className={`${display.className} text-sm font-black tracking-tight text-white`}>Trakbin</p>
              <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Super Admin</p>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {ADMIN_NAV.map(({ key, label, href, Icon }) => {
              const active = key === 'overview' ? pathname === '/admin' : pathname.startsWith(href);
              return (
                <Link key={key} href={href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active ? 'bg-emerald-400/10 text-emerald-200' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
                  }`}>
                  {active && <motion.span layoutId="admin-active-pill"
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-emerald-400" />}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-bold text-white">Super Admin</p>
                <p className={`${mono.className} truncate text-[9px] font-bold uppercase tracking-wider text-emerald-300/60`}>
                  {tenant.role}
                </p>
              </div>
              <button onClick={() => { window.localStorage.removeItem('trakbin_admin'); router.replace('/auth'); }}
                className="rounded-lg p-1.5 text-emerald-300/60 transition-colors hover:bg-white/10 hover:text-white">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c1411]/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                  <span className={`${display.className} text-base font-black text-emerald-950`}>T</span>
                </div>
                <span className={`${display.className} text-sm font-black text-white`}>Super Admin</span>
              </div>
              <div className="hidden lg:block" />
              <span className={`${mono.className} flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70 ring-1 ring-white/10`}>
                <Radio className="h-3 w-3" /> Live · {new Date().getFullYear()}
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}