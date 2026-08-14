// app/api/admin/settlements/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitAudit } from '@/lib/core/audit/audit-engine';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Settlement state machine — nothing jumps states, nothing completes on request
const TRANSITIONS: Record<string, { to: string; stamp?: boolean }> = {
  approve:   { to: 'approved' },
  reject:    { to: 'rejected' },
  process:   { to: 'processing' },
  confirm:   { to: 'processor_confirmed' },
  complete:  { to: 'completed', stamp: true },
  fail:      { to: 'failed', stamp: true },
};

export async function POST(req: Request) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 });

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 403 });
    }

    const { id, action } = await req.json();
    const t = TRANSITIONS[action];
    if (!id || !t) return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('payouts')
      .update({
        status: t.to,
        ...(t.stamp ? { processed_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    await emitAudit(supabaseAdmin, {
      category: 'BILLING_EVENT', actorId: user.id, actorEmail: user.email,
      action: `settlement.${action}`, target: id, metadata: { to: t.to },
    }).catch(() => {});

    return NextResponse.json({ ok: true, payout: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}