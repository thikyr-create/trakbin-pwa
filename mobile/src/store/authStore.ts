import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, API_BASE } from '../services/supabase';

export type Role = 'driver' | 'caretaker';
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface DriverProfile {
  id: number;
  employee_id: string;
  full_name: string;
  company_id: number | null;
  company_name: string | null;
  status: string;
}

interface AuthState {
  status: AuthStatus;
  role: Role | null;
  driver: DriverProfile | null;
  busy: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  loginDriver: (employeeId: string, password: string) => Promise<boolean>;
  loginCaretaker: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const ROLE_KEY = 'trakbin_role';
const DRIVER_KEY = 'trakbin_driver';

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  role: null,
  driver: null,
  busy: false,
  error: null,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const role = (await AsyncStorage.getItem(ROLE_KEY)) as Role | null;
      if (data.session && role) {
        const raw = await AsyncStorage.getItem(DRIVER_KEY);
        set({ status: 'signedIn', role, driver: raw ? (JSON.parse(raw) as DriverProfile) : null });
        return;
      }
      set({ status: 'signedOut' });
    } catch {
      set({ status: 'signedOut' });
    }
  },

  loginDriver: async (employeeId, password) => {
    set({ busy: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/auth/driver-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeId.trim(), password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        const msg =
          json?.error === 'invalid_credentials' ? 'Invalid Operations ID or password.'
          : json?.error === 'driver_not_migrated' ? 'Account not activated yet. Contact your operator.'
          : json?.error === 'no_auth_account' ? 'No linked account found. Contact your operator.'
          : 'Sign-in failed. Check your connection and try again.';
        set({ busy: false, error: msg });
        return false;
      }
      const { error } = await supabase.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });
      if (error) throw error;
      const d = json.driver;
      const profile: DriverProfile = {
        id: d.id, employee_id: d.employee_id, full_name: d.full_name,
        company_id: d.company_id ?? null, company_name: d.company_name ?? null, status: d.status,
      };
      await AsyncStorage.setItem(ROLE_KEY, 'driver');
      await AsyncStorage.setItem(DRIVER_KEY, JSON.stringify(profile));
      set({ status: 'signedIn', role: 'driver', driver: profile, busy: false, error: null });
      return true;
    } catch {
      set({ busy: false, error: 'Sign-in failed. Check your connection and try again.' });
      return false;
    }
  },

  loginCaretaker: async (buildingId, passcode) => {
  set({ busy: true, error: null });
  try {
    const res = await fetch(`${API_BASE}/api/auth/caretaker-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingId: buildingId.trim(), passcode }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      const msg =
        json?.error === 'invalid_credentials' ? 'Invalid Building ID or passcode.'
        : json?.error === 'auth_creation_failed' ? 'Account setup failed. Contact your waste provider.'
        : 'Sign-in failed. Check your connection and try again.';
      set({ busy: false, error: msg });
      return false;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: json.email,
      password: json.password,
    });
    if (error || !data.session) {
      set({ busy: false, error: 'Session creation failed.' });
      return false;
    }
    await AsyncStorage.setItem(ROLE_KEY, 'caretaker');
    await AsyncStorage.removeItem(DRIVER_KEY);
    set({ status: 'signedIn', role: 'caretaker', driver: null, busy: false, error: null });
    return true;
  } catch {
    set({ busy: false, error: 'Sign-in failed. Check your connection and try again.' });
    return false;
  }
},
  signOut: async () => {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove([ROLE_KEY, DRIVER_KEY]);
    set({ status: 'signedOut', role: null, driver: null, error: null });
  },
}));