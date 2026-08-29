import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateBuildingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TRK-';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const {
      passcode,
      buildingType,
      officialAddress,
      estate,
      gpsAddress,
      latitude,
      longitude,
      numberOfFlats,
      numberOfShops,
    } = await req.json();

    if (!passcode || !buildingType || !officialAddress || latitude == null || longitude == null) {
      return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique building ID
    let generatedId = generateBuildingId();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const { data } = await supabaseAdmin
        .from('Buildings')
        .select('custom_id')
        .eq('custom_id', generatedId)
        .maybeSingle();
      if (!data) isUnique = true;
      else {
        generatedId = generateBuildingId();
        attempts++;
      }
    }
    if (!isUnique) {
      return NextResponse.json({ ok: false, message: 'Unable to generate unique Building ID. Please try again.' }, { status: 500 });
    }

    // Compute next billing date
    const today = new Date();
    const currentDay = today.getDate();
    let nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    if (currentDay > 25) nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);

    let number_of_units = 1;
    let unit_type = 'unit';
    if (buildingType === 'Residential Multi-Unit') {
      number_of_units = parseInt(numberOfFlats || '1');
      unit_type = 'flats';
    } else if (buildingType === 'Commercial') {
      number_of_units = parseInt(numberOfShops || '1');
      unit_type = 'shops';
    }

    const buildingRow = {
      custom_id: generatedId,
      passcode,
      building_type: buildingType,
      address: officialAddress,
      estate: estate || null,
      gps_location_address: gpsAddress,
      latitude,
      longitude,
      status: 'pending',
      payment_status: 'unpaid',
      next_billing_date: nextBillingDate.toISOString().split('T')[0],
      billing_day: 1,
      company_id: null,
      number_of_units,
      unit_type,
    };

    const { error: buildingError } = await supabaseAdmin.from('Buildings').insert([buildingRow]);
    if (buildingError) {
      return NextResponse.json({ ok: false, message: 'Error: ' + buildingError.message }, { status: 500 });
    }

    // Create service request
    const requestNumber = `REQ-${Date.now().toString().slice(-6)}`;
    await supabaseAdmin.from('service_requests').insert([
      {
        request_number: requestNumber,
        building_id: generatedId,
        caretaker_name: 'Caretaker',
        status: 'pending',
        submitted_at: new Date().toISOString(),
      },
    ]);

    // Zone matching (cross-company to discover which company covers this address)
    const { data: zones } = await supabaseAdmin
      .from('company_zones')
      .select('id, company_id, zone_name, center_lat, center_lng, radius_km, polygon, estates, streets, addresses, is_active')
      .neq('is_active', false);

    if (zones && zones.length > 0) {
      // Simple text-based matching (estate/street/address)
      const normalizedAddress = officialAddress.toLowerCase();
      const normalizedEstate = (estate || '').toLowerCase();

      for (const zone of zones) {
        let matched = false;

        // Estate match
        if (zone.estates && normalizedEstate) {
          const zoneEstates = (zone.estates as string[]).map((e: string) => e.toLowerCase());
          if (zoneEstates.some((e: string) => normalizedEstate.includes(e))) matched = true;
        }

        // Street match
        if (!matched && zone.streets) {
          const zoneStreets = (zone.streets as string[]).map((s: string) => s.toLowerCase());
          if (zoneStreets.some((s: string) => normalizedAddress.includes(s))) matched = true;
        }

        // Address match
        if (!matched && zone.addresses) {
          const zoneAddresses = (zone.addresses as string[]).map((a: string) => a.toLowerCase());
          if (zoneAddresses.some((a: string) => normalizedAddress.includes(a))) matched = true;
        }

        if (matched) {
          await supabaseAdmin
            .from('service_requests')
            .update({ company_id: zone.company_id, status: 'auto_assigned' })
            .eq('building_id', generatedId);
          break;
        }
      }
    }

    return NextResponse.json({ ok: true, buildingId: generatedId, message: 'Building registered successfully!' });
  } catch (e: any) {
    console.error('[RegisterCaretaker]', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Internal error' }, { status: 500 });
  }
}