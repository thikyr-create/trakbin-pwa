// lib/core/communications/templates/email/account/accountChange/accountChangeTemplate.tsx
export interface AccountChangeContext { name: string; change: string; occurredAt: string; }
export function renderAccountChangeEmail(c: AccountChangeContext) {
  return {
    subject: 'Account change notification',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;"><h2>Account updated</h2><p>Hi ${c.name}, the following change was made at ${c.occurredAt}:</p><p style="background:#f9fafb;padding:12px;border-radius:8px;"><strong>${c.change}</strong></p><p style="color:#6b7280;font-size:13px;">If this wasn't you, contact support immediately.</p></div>`,
    text: `Account change at ${c.occurredAt}: ${c.change}`,
  };
}