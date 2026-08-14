// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ROLES = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'PLATFORM_FINANCE', 'PLATFORM_SUPPORT', 'PLATFORM_ANALYST'];

export async function POST(req: Request) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (me?.role !== 'admin') return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 403 });

    const { userId, platformRole } = await req.json();
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
    if (userId === user.id) return NextResponse.json({ ok: false, error: 'You cannot change your own platform role' }, { status: 400 });
    if (platformRole !== null && !ROLES.includes(platformRole)) {
      return NextResponse.json({ ok: false, error: 'Unknown platform role' }, { status: 400 });
    }

    const { error } = await admin.from('profiles').update({ platform_role: platformRole }).eq('id', userId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}