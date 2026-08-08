export interface DriverCredentialsContext {
  email: string;
  driverName: string;
  employeeId: string;
  tempPassword: string;
  companyName: string | null;
  loginUrl?: string;
}

export function renderDriverCredentialsEmail(c: DriverCredentialsContext) {
  const appUrl = c.loginUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://trakbin.vercel.app';
  return {
    subject: 'Your Trakbin Driver Login Credentials',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#059669 0%,#10B981 100%);padding:32px 24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">Welcome to Trakbin</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Your driver account is ready</p>
        </div>
        <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Hi <strong>${c.driverName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
            <strong>${c.companyName || 'Your waste company'}</strong> has provisioned your driver account. Log in below to view routes and manage collections.
          </p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Employee ID</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#059669;font-family:monospace;">${c.employeeId}</p>
            <div style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:16px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Temporary Password</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#111827;font-family:monospace;">${c.tempPassword}</p>
            </div>
          </div>
          <a href="${appUrl}/auth" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:24px 0;">Open Driver Console</a>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:24px 0;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#92400e;"><strong>⚠️ Security:</strong> Change your password after first login.</p>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Trakbin</p>
        </div>
      </div>
    `,
    text: `Hi ${c.driverName},\n\nYour driver credentials:\nEmployee ID: ${c.employeeId}\nTemporary Password: ${c.tempPassword}\n\nLog in at ${appUrl}/auth`,
  };
}