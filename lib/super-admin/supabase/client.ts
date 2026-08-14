// lib/super-admin/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Single client for the whole console (Q4 will fold this into the platform singleton)
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);