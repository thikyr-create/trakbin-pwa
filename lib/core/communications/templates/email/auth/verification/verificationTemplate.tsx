// lib/core/communications/templates/email/auth/verification/verificationTemplate.tsx
export interface VerificationContext { name: string; url: string; expiresInMinutes: number; }
export function renderVerificationEmail(c: VerificationContext) {
  return {
    subject: 'Confirm your Trakbin account',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Hi ${c.name}, confirm your email</h2>
      <p>Click below to verify your account:</p>
      <a href="${c.url}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Confirm email</a>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">Link expires in ${c.expiresInMinutes} minutes.</p>
    </div>`,
    text: `Confirm your email: ${c.url}`,
  };
}