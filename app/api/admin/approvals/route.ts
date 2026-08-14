// app/api/admin/approvals/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitAudit } from '@/lib/core/audit/audit-engine';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 403 });

    const { id, action } = await req.json();
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    }
    const to = action === 'approve' ? 'approved' : 'rejected';

    let done = false;
    for (const col of ['status', 'state', 'verification_status']) {
      const { error } = await admin.from('verifications').update({ [col]: to }).eq('id', id);
      if (!error) { done = true; break; }
    }
    if (!done) return NextResponse.json({ ok: false, error: 'Verification update failed' }, { status: 500 });

    await emitAudit(admin, {
      category: 'ADMIN_ACTION', actorId: user.id, actorEmail: user.email,
      action: `verification.${action}`, target: id,
    }).catch(() => {});

    return NextResponse.json({ ok: true, status: to });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}