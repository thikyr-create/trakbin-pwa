// app/api/auth/caretaker-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Identity = Building ID. Synthetic email is the technical auth key;
// the caretaker only ever sees Building ID + passcode.
const syntheticEmail = (b: string) => `b-${b.toLowerCase()}@caretaker.trakbin.app`;
const derivePassword = (b: string) =>
  createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`caretaker:${b}`)
    .digest('hex');

export async function POST(req: NextRequest) {
  try {
    const { buildingId, passcode } = await req.json();
    if (!buildingId || !passcode) {
      return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
    }

    // 1) Validate the passcode (the caretaker's real secret)
    const { data: building } = await supabaseAdmin
      .from('Buildings')
      .select('*')
      .eq('custom_id', buildingId)
      .eq('passcode', passcode)
      .maybeSingle();

    if (!building) {
      return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
    }

    const email = syntheticEmail(buildingId);
    const password = derivePassword(buildingId);

    // 2) Ensure the auth identity exists.
    //    The on_auth_user_created trigger creates the profiles row
    //    (role='caretaker', company_id=NULL) automatically on first creation.
    //    "User already registered" on repeat logins is expected — ignore it.
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'caretaker', building_id: buildingId },
    });

    if (createError && !/already/i.test(createError.message)) {
      console.error('[CaretakerLogin] createUser failed:', createError.message);
      return NextResponse.json({ ok: false, error: 'auth_creation_failed' }, { status: 500 });
    }

    // 3) Hand the client the credentials so it can mint a real session
    return NextResponse.json({ ok: true, building, email, password });
  } catch (e: any) {
    console.error('[CaretakerLogin]', e);
    return NextResponse.json({ ok: false, error: e?.message || 'internal_error' }, { status: 500 });
  }
}