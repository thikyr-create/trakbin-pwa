import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Real Supabase Auth adapter. Stage C Part 2 will route new signups + logins
// through this; Part 1 uses it only for OTP / password recovery.
export const supabaseAuth = {
  client: supabase,

  async getSession() { const { data } = await supabase.auth.getSession(); return data.session; },
  async signOut() { return supabase.auth.signOut(); },

  async signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },
  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  // email OTP (no password) — used for recovery
  async requestOtp(email: string) { return supabase.auth.signInWithOtp({ email }); },
  async verifyOtp(email: string, token: string) {
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  },
  async updatePassword(newPassword: string) {
    return supabase.auth.updateUser({ password: newPassword });
  },
};