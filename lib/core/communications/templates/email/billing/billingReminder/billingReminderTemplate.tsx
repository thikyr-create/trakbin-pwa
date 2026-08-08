// lib/core/communications/templates/email/billing/billingReminder/billingReminderTemplate.tsx
export interface BillingReminderContext { name: string; amount: string; currency: string; dueDate: string; }
export function renderBillingReminderEmail(c: BillingReminderContext) {
  return {
    subject: `Reminder: payment due ${c.dueDate}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Payment reminder</h2>
      <p>Hi ${c.name}, <strong>${c.currency}${c.amount}</strong> is due on ${c.dueDate}.</p>
    </div>`,
    text: `Reminder: ${c.currency}${c.amount} due ${c.dueDate}`,
  };
}