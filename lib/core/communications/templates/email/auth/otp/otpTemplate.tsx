// lib/core/communications/templates/email/auth/otp/otpTemplate.tsx
export interface OtpContext { code: string; email: string; expiresInMinutes: number; purpose: 'login' | 'verify' | '2fa'; }
export function renderOtpEmail(c: OtpContext) {
  const purposeLabel = { login: 'sign in', verify: 'verify your email', '2fa': 'complete two-factor authentication' }[c.purpose];
  return {
    subject: `Your Trakbin code: ${c.code}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Trakbin verification</h2>
      <p>Use this code to ${purposeLabel}:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;padding:24px;background:#f9fafb;border-radius:12px;font-family:monospace;">${c.code}</p>
      <p style="color:#6b7280;font-size:13px;">Expires in ${c.expiresInMinutes} minutes. Do not share this code.</p>
    </div>`,
    text: `Your Trakbin code: ${c.code} (expires in ${c.expiresInMinutes} minutes)`,
  };
}