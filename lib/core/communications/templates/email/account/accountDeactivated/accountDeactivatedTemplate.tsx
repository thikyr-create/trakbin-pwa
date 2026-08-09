// lib/core/communications/templates/email/account/accountDeactivated/accountDeactivatedTemplate.tsx
export interface AccountDeactivatedContext { name: string; reason?: string; supportEmail: string; }
export function renderAccountDeactivatedEmail(c: AccountDeactivatedContext) {
  return {
    subject: 'Your Trakbin account has been deactivated',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;"><h2>Account deactivated</h2><p>Hi ${c.name}, your account has been deactivated${c.reason ? `: ${c.reason}` : ''}.</p><p>Contact <a href="mailto:${c.supportEmail}">${c.supportEmail}</a> with questions.</p></div>`,
    text: `Account deactivated${c.reason ? `: ${c.reason}` : ''}. Contact ${c.supportEmail}.`,
  };
}