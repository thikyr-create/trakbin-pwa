// lib/store/useAdminSession.ts
"use client";

import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export interface AdminSessionState {
  admin: { id: string; role: string; email: string | null } | null;
  loaded: boolean;
  loadAdminContext: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
}

/**
 * Admin-only session store. Deliberately separate from useCompanySession:
 * the company store models tenants; this models the platform control plane.
 * Non-admins are bounced to /admin/login — no company resolution, no /auth.
 */
export const useAdminSession = create<AdminSessionState>((set) => ({
  admin: null,
  loaded: false,

  loadAdminContext: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (typeof window !== 'undefined') window.location.href = '/admin/login';
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      if (typeof window !== 'undefined') window.location.href = '/admin/login';
      return;
    }

    set({ admin: { id: user.id, role: 'admin', email: user.email ?? null }, loaded: true });
  },

  signOutAdmin: async () => {
    await supabase.auth.signOut();
    set({ admin: null, loaded: false });
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
  },
}));