// lib/supabaseBrowser.ts
// SINGLE browser Supabase client.
// One GoTrue instance = one auth state manager = no token-refresh races,
// no 429 floods, no cross-component session corruption.
// CLIENT-SIDE ONLY. Server code (app/api/**, lib/server/**) keeps its own
// service-role clients — they never touch browser storage.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return cached;
}

export const supabaseBrowser = getSupabaseBrowser();