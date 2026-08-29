import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { buildingId, officialAddress, newPasscode } = await req.json();

    if (!buildingId || !officialAddress || !newPasscode) {
      return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
    }

    const { data: building } = await supabaseAdmin
      .from('Buildings')
      .select('*')
      .eq('custom_id', buildingId.trim())
      .maybeSingle();

    if (!building) {
      return NextResponse.json({ ok: false, message: 'Building ID not found.' }, { status: 404 });
    }

    // Validate address match
    const a = (building.address || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const b = officialAddress.toLowerCase().replace(/\s+/g, ' ').trim();
    if (a !== b) {
      return NextResponse.json({ ok: false, message: 'Building ID and address do not match our records.' }, { status: 401 });
    }

    // Update passcode
    const { error } = await supabaseAdmin
      .from('Buildings')
      .update({ passcode: newPasscode })
      .eq('custom_id', buildingId.trim());

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to update passcode: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Passcode updated successfully!' });
  } catch (e: any) {
    console.error('[ResetCaretakerPasscode]', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Internal error' }, { status: 500 });
  }
}