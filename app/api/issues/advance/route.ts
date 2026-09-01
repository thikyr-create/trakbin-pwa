// app/api/issues/advance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notify } from '@/lib/server/notify';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const NOTIFY: Record<string, { title: string; body: string }> = {
  acknowledged: { title: 'Report received', body: 'Trakbin acknowledged your report. A team member will review it shortly.' },
  resolving: { title: 'Resolution started', body: 'Trakbin is actively working on your report.' },
  resolved: { title: 'Your report was resolved', body: 'Trakbin has resolved the issue you reported.' },
};

export async function POST(req: NextRequest) {
  try {
    const { issueId, nextStatus } = await req.json();
    if (!issueId || !nextStatus) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    if (!['acknowledged', 'resolving', 'resolved'].includes(nextStatus)) return NextResponse.json({ ok: false, error: 'invalid_status' }, { status: 400 });

    const { data: issue, error: loadErr } = await admin()
      .from('environmental_issues')
      .select('id, building_id, issue_number, issue_type, description, status')
      .eq('id', issueId)
      .maybeSingle();
    if (loadErr || !issue) return NextResponse.json({ ok: false, error: 'issue_not_found' }, { status: 404 });

    const patch: any = { status: nextStatus };
    if (nextStatus === 'resolved') patch.resolved_at = new Date().toISOString();
    const { error: updErr } = await admin().from('environmental_issues').update(patch).eq('id', issueId);
    if (updErr) return NextResponse.json({ ok: false, error: updErr.message }, { status: 400 });

    // Resolve caretaker UUID: Buildings.custom_id -> caretaker_email -> auth.users.id (secure RPC)
        // Resolve caretaker UUID: building -> caretaker email (stored OR derived) -> auth.users.id
    let caretakerUserId: string | null = null;
    if (issue.building_id) {
      const { data: building } = await admin()
        .from('Buildings')
        .select('caretaker_email')
        .eq('custom_id', issue.building_id)
        .maybeSingle();

      // Caretaker accounts use synthetic emails: b-{CUSTOM_ID}@caretaker.trakbin.app
      const email =
        building?.caretaker_email ||
        `b-${String(issue.building_id).toLowerCase()}@caretaker.trakbin.app`;

      const { data: uid } = await admin().rpc('get_user_id_by_email', { em: email });
      caretakerUserId = (uid as string) ?? null;
    }

    const meta = NOTIFY[nextStatus];
    if (caretakerUserId) {
      await notify({
        userIds: [caretakerUserId],
        buildingId: issue.building_id,
        type: 'issue_update',
        title: meta.title,
        body: meta.body,
        data: { issue_id: issueId, issue_number: issue.issue_number, issue_type: issue.issue_type, status: nextStatus, reference: issue.issue_number },
      });
    }

    return NextResponse.json({ ok: true, status: nextStatus, notified: !!caretakerUserId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'advance_failed' }, { status: 400 });
  }
}