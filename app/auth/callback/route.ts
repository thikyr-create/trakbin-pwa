import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // Supabase passes the exchange code here after the user clicks the email link
  const code = searchParams.get('code');
  
  // If you pass a ?next=/some-path in your email URLs, it redirects there. Otherwise, fallback to auth.
  const next = searchParams.get('next') ?? '/auth';

  if (code) {
    // Next.js 15/16 requires cookies() to be awaited
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // setAll called from Server Component - ignored safely
            }
          },
        },
      }
    );

    // Exchange the temporary code for a real, persistent session cookie
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Success: user is now logged in. Redirect to their dashboard or auth page.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Failed to exchange code. Send them back to the login page with an error flag.
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}