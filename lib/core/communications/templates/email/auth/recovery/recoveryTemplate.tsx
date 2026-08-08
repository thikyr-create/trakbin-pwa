// lib/core/communications/templates/email/auth/recovery/recoveryTemplate.tsx
export interface RecoveryContext { name: string; codes: string[]; }
export function renderRecoveryEmail(c: RecoveryContext) {
  return {
    subject: 'Your Trakbin recovery codes',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Recovery codes for ${c.name}</h2>
      <p>Store these securely. Each code can be used once:</p>
      <pre style="background:#f9fafb;padding:16px;border-radius:8px;font-family:monospace;">${c.codes.join('\n')}</pre>
      <p style="color:#6b7280;font-size:13px;">If you lose both your 2FA device and these codes, contact support.</p>
    </div>`,
    text: `Recovery codes:\n${c.codes.join('\n')}`,
  };
}