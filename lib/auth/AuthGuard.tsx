"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { authEngine } from './authEngine';
import { ROLE_HOME } from './permissions';
import type { Role } from './types';

export default function AuthGuard({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const { role, loaded } = useAuthStore();

  useEffect(() => { authEngine.restoreSession(); }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!role) { router.replace('/auth'); return; }
    if (roles && roles.length > 0 && !roles.includes(role)) { router.replace(ROLE_HOME[role]); return; }
  }, [loaded, role, roles, router]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Checking session…</p>
        </div>
      </div>
    );
  }
  if (!role) return null;
  if (roles && roles.length > 0 && !roles.includes(role)) return null;
  return <>{children}</>;
}