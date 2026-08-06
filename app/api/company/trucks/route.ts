// app/api/company/trucks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateTruckId(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const id = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data } = await supabaseAdmin
      .from('trucks')
      .select('truck_id')
      .eq('truck_id', id)
      .maybeSingle();
    if (!data) return id;
  }
  return `TRK-${Date.now().toString().slice(-6)}`;
}

async function resolveDriver(company_id: string, employee_id: string) {
  const { data } = await supabaseAdmin
    .from('drivers')
    .select('employee_id, full_name')
    .eq('company_id', company_id)
    .eq('employee_id', employee_id)
    .maybeSingle();
  return data;
}

async function applyDriverAssignment(
  company_id: string,
  truck_id: string,
  employee_id: string | null,
  driver_name: string | null
) {
  if (employee_id && driver_name) {
    // Enforce one driver ↔ one truck: clear legacy + new links elsewhere
    await supabaseAdmin
      .from('trucks')
      .update({ current_driver: null, driver_name: null })
      .eq('company_id', company_id)
      .eq('current_driver', employee_id)
      .neq('truck_id', truck_id);

    await supabaseAdmin
      .from('trucks')
      .update({ driver_name: null })
      .eq('company_id', company_id)
      .eq('driver_name', driver_name)
      .neq('truck_id', truck_id);
  }

  await supabaseAdmin
    .from('trucks')
    .update({ current_driver: employee_id, driver_name })
    .eq('company_id', company_id)
    .eq('truck_id', truck_id);
}

async function fetchTruck(company_id: string, truck_id: string) {
  return supabaseAdmin
    .from('trucks')
    .select('*')
    .eq('company_id', company_id)
    .eq('truck_id', truck_id)
    .maybeSingle();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      license_plate,
      truck_type,
      capacity,
      status,
      driver_employee_id,
      company_id,
    } = body;

    if (!(license_plate || '').trim()) {
      return NextResponse.json({ error: 'License plate is required' }, { status: 400 });
    }
    if (!company_id) {
      return NextResponse.json({ error: 'Company context missing' }, { status: 400 });
    }

    const truckId = await generateTruckId();

    // FIX: Removed company_name — column doesn't exist on trucks table.
    // Schema only has company_id + business_name.
    const { error: insertError } = await supabaseAdmin.from('trucks').insert({
      truck_id: truckId,
      license_plate: license_plate.trim().toUpperCase(),
      truck_type: truck_type || 'Compactor',
      capacity: capacity || null,
      status: status || 'active',
      company_id,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (driver_employee_id) {
      const driver = await resolveDriver(company_id, driver_employee_id);
      if (!driver) {
        return NextResponse.json({ error: 'Driver not found in this company' }, { status: 400 });
      }
      await applyDriverAssignment(company_id, truckId, driver.employee_id, driver.full_name);
    }

    const { data: truck } = await fetchTruck(company_id, truckId);

    return NextResponse.json({ truck }, { status: 201 });
  } catch (err) {
    console.error('[TrucksAPI] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { truck_id, company_id, license_plate, truck_type, capacity, status } = body;

    if (!truck_id || !company_id) {
      return NextResponse.json({ error: 'truck_id and company_id are required' }, { status: 400 });
    }

    const { data: existing } = await fetchTruck(company_id, truck_id);
    if (!existing) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (license_plate !== undefined) updates.license_plate = license_plate.trim().toUpperCase();
    if (truck_type !== undefined) updates.truck_type = truck_type;
    if (capacity !== undefined) updates.capacity = capacity;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('trucks')
        .update(updates)
        .eq('company_id', company_id)
        .eq('truck_id', truck_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Assignment change only when the key is explicitly present
    if ('driver_employee_id' in body) {
      const employeeId: string | null = body.driver_employee_id || null;

      if (employeeId) {
        const driver = await resolveDriver(company_id, employeeId);
        if (!driver) {
          return NextResponse.json({ error: 'Driver not found in this company' }, { status: 400 });
        }
        await applyDriverAssignment(company_id, truck_id, driver.employee_id, driver.full_name);
      } else {
        await applyDriverAssignment(company_id, truck_id, null, null);
      }
    }

    const { data: truck } = await fetchTruck(company_id, truck_id);

    return NextResponse.json({ truck });
  } catch (err) {
    console.error('[TrucksAPI] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}