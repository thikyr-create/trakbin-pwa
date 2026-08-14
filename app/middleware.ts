// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Server-side first door: no Supabase auth cookie → no admin console.
// Role truth is still enforced by useAdminSession + every service-role route.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!pathname.startsWith('/admin/login')) {
      const hasAuthCookie = req.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
      if (!hasAuthCookie) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };