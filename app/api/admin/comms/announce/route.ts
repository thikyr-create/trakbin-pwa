// app/api/admin/comms/announce/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Admin-only gate
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 403 });

    const { title, body, audience, orgId } = await req.json();
    if (!title || !body) return NextResponse.json({ ok: false, error: 'Title and body required' }, { status: 400 });

    // 2. Resolve audience → profile rows (never admins)
    let q = admin.from('profiles').select('id, company_id, role');
    if (audience === 'org' && orgId) q = q.eq('company_id', Number(orgId));
    const { data: recipients } = await q;
    const rows = (recipients || []).filter((r: any) => r.role !== 'admin');

    // 3. Notice record (platform announcement)
    let noticeOk = false;
    try {
      const { error } = await admin.from('notices').insert({
        title, body,
        audience: audience || 'all',
        company_id: audience === 'org' && orgId ? Number(orgId) : null,
        created_by: user.id,
      });
      noticeOk = !error;
    } catch { noticeOk = false; }
    if (!noticeOk) {
      try { await admin.from('notices').insert({ title, body }); noticeOk = true; } catch { noticeOk = false; }
    }

    // 4. In-app notifications fanout
    let notified = 0;
    try {
      const inserts = rows.map((r: any) => ({ user_id: r.id, title, body, read: false }));
      if (inserts.length) {
        const { error } = await admin.from('notifications').insert(inserts);
        if (!error) notified = inserts.length;
      }
    } catch { /* channel schema variance — reported honestly in the summary */ }

    // 5. Email fanout through the platform queue (drain endpoint processes it)
    let queued = 0;
    try {
      const uids = rows.map((r: any) => r.id);
      if (uids.length) {
                const { data: usersPage } = await admin.auth.admin.listUsers();
        const users = (usersPage as any)?.users || [];
        const emailByUid = new Map(users.map((u: any) => [u.id, u.email]));
        const emails = uids.map((id: string) => emailByUid.get(id)).filter(Boolean) as string[];
        const inserts = emails.map((e) => ({ to_email: e, subject: title, body, status: 'queued' }));
        if (inserts.length) {
          const { error } = await admin.from('email_queue').insert(inserts);
          if (!error) queued = inserts.length;
        }
      }
    } catch { /* provider variance */ }

    return NextResponse.json({ ok: true, noticeOk, notified, queued, recipients: rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}