// lib/store/useAdminSession.ts
"use client";

import { create } from 'zustand';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { emitAudit } from '@/lib/core/audit/audit-engine';

const supabase = supabaseBrowser;

export interface AdminSessionState {
  admin: { id: string; role: string; email: string | null } | null;
  loaded: boolean;
  loadAdminContext: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
}

/**
 * Admin-only session store. Deliberately separate from useCompanySession:
 * the company store models tenants; this models the platform control plane.
 * Non-admins are bounced to /admin/login â€” no company resolution, no /auth.
 * NEVER redirects when already on /admin/login (self-redirect reload loop).
 */
export const useAdminSession = create<AdminSessionState>((set) => ({
  admin: null,
  loaded: false,

  loadAdminContext: async () => {
    const onLoginRoute = typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin/login');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (!onLoginRoute && typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      if (!onLoginRoute && typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      return;
    }

    set({ admin: { id: user.id, role: 'admin', email: user.email ?? null }, loaded: true });

    // Access log â€” every admin console entry leaves a trace
    emitAudit(supabase, {
      category: 'SECURITY_EVENT',
      actorId: user.id,
      actorEmail: user.email,
      action: 'admin_console_access',
    }).catch(() => {});
  },

  signOutAdmin: async () => {
    await supabase.auth.signOut();
    set({ admin: null, loaded: false });
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
  },
}));