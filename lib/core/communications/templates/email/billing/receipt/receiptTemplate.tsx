// lib/core/communications/templates/email/billing/receipt/receiptTemplate.tsx
export interface ReceiptContext { name: string; amount: string; currency: string; reference: string; date: string; }
export function renderReceiptEmail(c: ReceiptContext) {
  return {
    subject: `Receipt — ${c.currency}${c.amount} (${c.reference})`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;"><h2>Receipt</h2><p>Hi ${c.name}, we received <strong>${c.currency}${c.amount}</strong> on ${c.date} (ref ${c.reference}). Thank you.</p></div>`,
    text: `Receipt: ${c.currency}${c.amount} (ref ${c.reference}) on ${c.date}`,
  };
}