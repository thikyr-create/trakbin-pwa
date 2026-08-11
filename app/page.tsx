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
        router.replace('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role;
      
      if (role && ROLE_HOME[role as keyof typeof ROLE_HOME]) {
        router.replace(ROLE_HOME[role as keyof typeof ROLE_HOME]);
      } else {
        router.replace('/auth');
      }
    })();
  }, [router]);

  // THIS IS THE MAGIC FOR CAPACITOR:
  // Renders absolutely nothing. No spinner, no layout, just a blank screen 
  // for the ~50ms it takes the JS to redirect to the correct dashboard.
  return null; 
}