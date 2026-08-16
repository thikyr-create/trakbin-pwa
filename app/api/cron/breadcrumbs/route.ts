// app/api/cron/breadcrumbs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Retain for 30 days (configurable via env if needed later)
  const retentionDays = 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffIso = cutoffDate.toISOString();

  try {
    // Supabase Postgres RPC: delete returning count
    // We use a raw query via RPC or just a standard delete with select
    const { data, error, count } = await supabaseAdmin
      .from('driver_breadcrumbs')
      .delete()
      .lt('recorded_at', cutoffIso)
      .select('id'); // Selecting ID just to get the count of deleted rows

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      deletedCount: data?.length ?? count ?? 0,
      cutoff: cutoffIso,
    });
  } catch (err: any) {
    console.error('[cron/breadcrumbs] retention failed:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}