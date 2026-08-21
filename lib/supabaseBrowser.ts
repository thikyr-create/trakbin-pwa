// lib/supabaseBrowser.ts
// Environment-aware Supabase singleton.
//
// BROWSER: one cached GoTrue client = one auth state manager =
// no token-refresh races, no 429 floods, no session corruption.
//
// SERVER (API routes, crons): stateless client — no storage, no
// auto-refresh — so Node never touches browser-only APIs.
// Server code that needs elevated privileges keeps its own
// service-role clients (app/api/**, lib/server/**).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let cached: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  // SERVER: stateless, short-lived, safe in Node
  if (typeof window === 'undefined') {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  // BROWSER: cached singleton — exactly one GoTrue instance per tab
  if (!cached) {
    cached = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return cached;
}

/** Module-scope convenience. Evaluated once per runtime (server bundle gets
 *  the stateless client, browser bundle gets the cached singleton). */
export const supabaseBrowser = getSupabaseBrowser();