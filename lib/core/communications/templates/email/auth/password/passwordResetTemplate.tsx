// lib/core/communications/templates/email/auth/password/passwordResetTemplate.tsx
export interface PasswordResetContext { name: string; url: string; expiresInMinutes: number; }
export function renderPasswordResetEmail(c: PasswordResetContext) {
  return {
    subject: 'Reset your Trakbin password',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Password reset</h2>
      <p>Hi ${c.name}, you requested to reset your password.</p>
      <a href="${c.url}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Reset password</a>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">Link expires in ${c.expiresInMinutes} minutes. If you didn't request this, ignore this email.</p>
    </div>`,
    text: `Reset password: ${c.url}`,
  };
}