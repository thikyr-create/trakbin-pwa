// app/api/company/drivers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { canOperate } from '@/lib/auth/companyVerification';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generatePassword(length = 12): string {
  return randomBytes(length).toString('base64url').slice(0, length);
}

async function generateEmployeeId(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const id = `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
    const [inDrivers, inUsers] = await Promise.all([
      supabaseAdmin.from('drivers').select('employee_id').eq('employee_id', id).maybeSingle(),
      supabaseAdmin.from('users').select('employee_id').eq('employee_id', id).maybeSingle(),
    ]);
    if (!inDrivers.data && !inUsers.data) return id;
  }
  return `DRV-${Date.now().toString().slice(-6)}`;
}

async function sendDriverCredentials(
  email: string,
  employeeId: string,
  password: string,
  driverName: string,
  companyName: string | null
) {
  const apiKey = process.env.RESEND_API_KEY;
  const mailFrom = process.env.MAIL_FROM;

  if (!apiKey || !mailFrom) {
    console.warn('[DriversAPI] RESEND_API_KEY or MAIL_FROM missing. Skipping email.');
    return { emailed: false, reason: 'Email service not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mailFrom,
        to: [email],
        subject: 'Your Trakbin Driver Login Credentials',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 32px 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Welcome to Trakbin</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your driver account is ready</p>
            </div>
            
            <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
                Hi <strong>${driverName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
                <strong>${companyName || 'Your waste company'}</strong> has provisioned your driver account on Trakbin.
                You can now log in to the driver console to view your assigned routes and manage collections.
              </p>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <div style="margin-bottom: 16px;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
                    Employee ID
                  </p>
                  <p style="margin: 0; font-size: 18px; font-weight: 700; color: #059669; font-family: monospace;">
                    ${employeeId}
                  </p>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
                    Temporary Password
                  </p>
                  <p style="margin: 0; font-size: 18px; font-weight: 700; color: #111827; font-family: monospace;">
                    ${password}
                  </p>
                </div>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;">
                  <strong>⚠️ Security:</strong> Change your password immediately after first login.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If you have any questions, contact your fleet manager.
              </p>
            </div>

            <div style="background: #f9fafb; padding: 20px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2026 Trakbin. All rights reserved.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend API error: ${res.status} ${errText}`);
    }
    return { emailed: true };
  } catch (err) {
    console.error('[DriversAPI] Failed to send credentials email:', err);
    return { emailed: false, reason: err instanceof Error ? err.message : 'Email delivery failed' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      full_name,
      email,
      phone,
      license_number,
      truck_id,
      company_id,
      company_name,
    } = body;

    const driverName: string = (name || full_name || '').trim();
    const driverEmail: string = (email || '').trim().toLowerCase();

    if (!driverName || !driverEmail) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!company_id) {
      return NextResponse.json({ error: 'Company context missing' }, { status: 400 });
    }

    // Server-side verification gate (mirrors client canOperate)
    const { data: haulerRow } = await supabaseAdmin
      .from('haulers')
      .select('*')
      .eq('id', company_id)
      .maybeSingle();

    if (!haulerRow) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    if (!canOperate(haulerRow)) {
      return NextResponse.json(
        { error: 'Confirm your email and complete your profile before adding drivers.' },
        { status: 403 }
      );
    }

    const employeeId = await generateEmployeeId();
    const tempPassword = generatePassword();

    // 1) Supabase Auth user (provisioned → auto-confirmed)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: driverEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'driver', employee_id: employeeId, company_id },
    });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 500 }
      );
    }

    // 2) drivers table = operational truth (LINKED to auth.users)
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .insert({
        employee_id: employeeId,
        full_name: driverName,
        email: driverEmail,
        phone: phone || null,
        license_number: license_number || null,
        company_name: company_name || haulerRow.company_name || null,
        company_id,
        user_id: authUser.user.id,  // ← THE MISSING LINK
        status: 'active',
      })
      .select()
      .single();

    if (driverError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: driverError.message }, { status: 500 });
    }

    // 3) users table = legacy password fallback
    const { error: usersError } = await supabaseAdmin.from('users').insert({
      email: driverEmail,
      employee_id: employeeId,
      password: tempPassword,
      account_type: 'Driver',
      company_name: company_name || haulerRow.company_name || null,
      full_name: driverName,
      phone: phone || null,
      company_id,
    });

    if (usersError) {
      await supabaseAdmin.from('drivers').delete().eq('employee_id', employeeId);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // 4) Optional truck assignment (assignment lives on trucks side)
    if (truck_id) {
      await supabaseAdmin
        .from('trucks')
        .update({ current_driver: employeeId, driver_name: driverName })
        .eq('company_id', company_id)
        .eq('truck_id', truck_id);
    }

    // 5) Send credentials email
    const emailResult = await sendDriverCredentials(
      driverEmail,
      employeeId,
      tempPassword,
      driverName,
      company_name || haulerRow.company_name || null
    );

    return NextResponse.json(
      {
        driver,
        credentials: { employeeId, tempPassword },
        emailSent: emailResult.emailed,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[DriversAPI] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}