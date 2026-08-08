// lib/core/communications/templates/email/auth/security/twoFactorTemplate.tsx
export interface TwoFactorContext { name: string; secret: string; appName: string; qrUrl?: string; }
export function renderTwoFactorEmail(c: TwoFactorContext) {
  return {
    subject: 'Two-factor authentication enabled',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>2FA enabled for ${c.appName}</h2>
      <p>Hi ${c.name}, two-factor authentication is now active.</p>
      <p><strong>Backup secret:</strong></p>
      <pre style="background:#f9fafb;padding:16px;border-radius:8px;font-family:monospace;letter-spacing:2px;">${c.secret}</pre>
      <p style="color:#6b7280;font-size:13px;">Save this in a password manager in case you lose your authenticator app.</p>
    </div>`,
    text: `2FA enabled. Backup secret: ${c.secret}`,
  };
}