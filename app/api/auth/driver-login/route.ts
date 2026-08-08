// app/api/auth/driver-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { employeeId, password } = await req.json();
    if (!employeeId || !password) {
      return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
    }

    const { data: driver, error: drvErr } = await admin
      .from('drivers')
      .select('*')
      .eq('employee_id', employeeId.trim())
      .maybeSingle();

    if (drvErr || !driver) {
      return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
    }
    if (!driver.user_id) {
      return NextResponse.json({ ok: false, error: 'driver_not_migrated' }, { status: 401 });
    }

    // Prefer admin lookup; fall back to drivers.email so login never
    // depends on the service-role admin endpoint being reachable.
    let email: string | null = null;
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(driver.user_id);
      email = authUser?.user?.email ?? null;
    } catch { /* service key may be absent in some environments */ }
    if (!email) email = driver.email ?? null;
    if (!email) {
      return NextResponse.json({ ok: false, error: 'no_auth_account' }, { status: 401 });
    }

    // Verify password by minting a real session from GoTrue
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.access_token) {
      return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      driver,
      session: { access_token: json.access_token, refresh_token: json.refresh_token },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'internal' }, { status: 500 });
  }
}