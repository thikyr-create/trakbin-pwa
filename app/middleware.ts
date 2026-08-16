// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiter (simple, no external deps)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

function rateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

// Money routes that need rate limiting
const MONEY_ROUTES = [
  '/api/payments',
  '/api/company/payouts',
  '/api/admin/settlements',
  '/api/company/billing',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Rate limiting for money routes
  const isMoneyRoute = MONEY_ROUTES.some((route) => pathname.startsWith(route));
  if (isMoneyRoute) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    const result = rateLimit(ip);
    
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      );
    }
  }
  
  // Admin auth gate (existing logic)
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

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/payments/:path*',
    '/api/company/payouts/:path*',
    '/api/company/billing',
    '/api/admin/settlements',
  ],
};