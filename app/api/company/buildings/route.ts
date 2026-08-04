// app/api/company/buildings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nextPickupFromDays } from '@/lib/features/buildings/utils/buildingHelpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function loadBuilding(custom_id: string, company_id: number) {
  return supabaseAdmin
    .from('Buildings')
    .select('*')
    .eq('custom_id', custom_id)
    .eq('company_id', company_id)
    .maybeSingle();
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, company_id, custom_id } = body;

    if (!company_id || !custom_id) {
      return NextResponse.json(
        { error: 'company_id and custom_id are required' },
        { status: 400 }
      );
    }

    const { data: building } = await loadBuilding(custom_id, Number(company_id));

    if (!building) {
      return NextResponse.json(
        { error: 'Building not found for this company' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update_schedule': {
        const pickup_days = Array.isArray(body.pickup_days) ? body.pickup_days : [];

        if (pickup_days.length === 0) {
          return NextResponse.json(
            { error: 'Select at least one collection day.' },
            { status: 400 }
          );
        }

        const { data: sa, error: saError } = await supabaseAdmin
          .from('service_assignments')
          .update({
            pickup_days,
            time_window: body.time_window ?? null,
          })
          .eq('building_id', custom_id)
          .eq('company_id', Number(company_id))
          .select()
          .maybeSingle();

        if (saError) {
          return NextResponse.json({ error: saError.message }, { status: 500 });
        }
        if (!sa) {
          return NextResponse.json(
            { error: 'No service assignment exists for this building.' },
            { status: 404 }
          );
        }

        const next = nextPickupFromDays(pickup_days);

        await supabaseAdmin
          .from('collection_schedules')
          .update({
            time_window: body.time_window ?? null,
            ...(next ? { next_pickup_date: next } : {}),
          })
          .eq('building_id', custom_id)
          .eq('company_id', Number(company_id));

        return NextResponse.json({ ok: true, service_assignment: sa });
      }

      case 'toggle_autopay': {
        const { data, error } = await supabaseAdmin
          .from('Buildings')
          .update({
            autopay_enabled: !!body.enabled,
            autopay_source: body.enabled
              ? building.autopay_source || 'company'
              : building.autopay_source,
          })
          .eq('building_id', building.building_id)
          .eq('company_id', Number(company_id))
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, building: data });
      }

      case 'report_issue': {
        const issue_type = (body.issue_type || '').trim();

        if (!issue_type) {
          return NextResponse.json(
            { error: 'Issue type is required.' },
            { status: 400 }
          );
        }

        const { data: issue, error: issueError } = await supabaseAdmin
          .from('environmental_issues')
          .insert({
            building_id: custom_id,
            company_id: Number(company_id),
            reported_by: 'company',
            reported_by_role: 'company',
            issue_type,
            severity: body.severity || 'medium',
            priority: body.priority || 'normal',
            description: body.description || null,
            address: building.address,
            latitude: building.latitude != null ? Number(building.latitude) : null,
            longitude: building.longitude != null ? Number(building.longitude) : null,
            status: 'open',
          })
          .select()
          .single();

        if (issueError) {
          return NextResponse.json({ error: issueError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, issue });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[BuildingsAPI] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}