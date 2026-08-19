// lib/supabaseClient.ts
// Single browser Supabase client. One GoTrue instance = one auth state =
// no token-refresh races, no 429 floods, no cross-component session corruption.
import { createBrowserClient } from '@supabase/ssr';

function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton: every "use client" file imports this. Server routes (app/api/*)
// keep their own service-role admin clients — they don't touch browser storage.
let cached: ReturnType<typeof makeClient> | null = null;
export function getSupabaseBrowser() {
  if (typeof window === 'undefined') return null; // SSR guard
  if (!cached) cached = makeClient();
  return cached;
}