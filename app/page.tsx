// app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ROLE_HOME } from '@/lib/auth/permissions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // No session → auth page
        router.replace('/auth');
        return;
      }

      // Determine role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role;
      
      if (role && ROLE_HOME[role as keyof typeof ROLE_HOME]) {
        router.replace(ROLE_HOME[role as keyof typeof ROLE_HOME]);
      } else {
        // Fallback to auth if role unknown
        router.replace('/auth');
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-bold">Loading…</p>
      </div>
    </div>
  );
}