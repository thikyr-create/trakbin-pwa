import { create } from 'zustand';
import type { Role } from '@/lib/auth/types';

interface AuthState {
  role: Role | null;
  account: any | null;   // the raw row (building or user) — same shape as localStorage today
  loaded: boolean;
  setSession: (role: Role, account: any) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null, account: null, loaded: false,
  setSession: (role, account) => set({ role, account, loaded: true }),
  clearSession: () => set({ role: null, account: null, loaded: true }),
}));