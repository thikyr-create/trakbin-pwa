// app/api/issues/advance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notify } from '@/lib/server/notify';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Map each transition to a notification title/body
const NOTIFY: Record<string, { title: string; body: string }> = {
  acknowledged: {
    title: 'Report received',
    body: 'Trakbin acknowledged your report. A team member will review it shortly.',
  },
  resolving: {
    title: 'Resolution started',
    body: 'Trakbin is actively working on your report.',
  },
  resolved: {
    title: 'Your report was resolved',
    body: 'Trakbin has resolved the issue you reported.',
  },
};

export async function POST(req: NextRequest) {
  try {
    const { issueId, nextStatus } = await req.json();
    if (!issueId || !nextStatus) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    }
    if (!['acknowledged', 'resolving', 'resolved'].includes(nextStatus)) {
      return NextResponse.json({ ok: false, error: 'invalid_status' }, { status: 400 });
    }

    // 1. Load the issue first
    const { data: issue, error: loadErr } = await admin()
      .from('environmental_issues')
      .select('id, building_id, issue_number, issue_type, description, status')
      .eq('id', issueId)
      .maybeSingle();

    if (loadErr || !issue) {
      return NextResponse.json({ ok: false, error: 'issue_not_found' }, { status: 404 });
    }

    // 2. Update the status
    const patch: any = { status: nextStatus };
    if (nextStatus === 'resolved') patch.resolved_at = new Date().toISOString();

    const { error: updErr } = await admin()
      .from('environmental_issues')
      .update(patch)
      .eq('id', issueId);

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 400 });
    }

    // 3. ARCHITECTURAL FIX: Query public.profiles directly!
    // No need to touch the Auth API or Buildings table. 
    // The profiles table securely maps user_id to building_id.
    let caretakerUserId: string | null = null;
    if (issue.building_id) {
      const { data: profile } = await admin()
        .from('profiles')
        .select('user_id')
        .eq('building_id', issue.building_id)
        .maybeSingle(); 
        
      caretakerUserId = profile?.user_id ?? null;
    }

    // 4. Emit the notification
    const meta = NOTIFY[nextStatus];
    if (caretakerUserId) {
      await notify({
        userIds: [caretakerUserId],
        buildingId: issue.building_id,
        type: 'issue_update',
        title: meta.title,
        body: meta.body,
        data: {
          issue_id: issueId,
          issue_number: issue.issue_number,
          issue_type: issue.issue_type,
          status: nextStatus,
          reference: issue.issue_number,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      notified: !!caretakerUserId, // Will now correctly be true!
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'advance_failed' }, { status: 400 });
  }
}