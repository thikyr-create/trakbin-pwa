// mobile/store/authStore.ts
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { driverLogin, caretakerLogin, detectRole, signOut } from '../services/auth';

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  role: 'driver' | 'caretaker' | null;
  driver: any | null;
  building: any | null;
  notice: string;
  initialize: () => Promise<void>;
  loginDriver: (id: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  loginCaretaker: (id: string, passcode: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  role: null,
  driver: null,
  building: null,
  notice: '',

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { set({ status: 'signedOut' }); return; }
    const res = await detectRole();
    if (!res.role) {
      await signOut();
      set({ status: 'signedOut', notice: res.unsupported === 'company' ? 'Company accounts use the web dashboard.' : '' });
      return;
    }
    set({ status: 'signedIn', role: res.role, driver: res.driver ?? null, building: res.building ?? null });
  },

  loginDriver: async (id, password) => {
    const r = await driverLogin(id, password);
    if (!r.ok) return r;
    const res = await detectRole();
    set({ status: 'signedIn', role: 'driver', driver: res.driver ?? null, building: null });
    return { ok: true };
  },

  loginCaretaker: async (id, passcode) => {
    const r = await caretakerLogin(id, passcode);
    if (!r.ok) return r;
    const res = await detectRole();
    set({ status: 'signedIn', role: 'caretaker', building: res.building ?? null, driver: null });
    return { ok: true };
  },

  logout: async () => {
    await signOut();
    set({ status: 'signedOut', role: null, driver: null, building: null, notice: '' });
  },
}));