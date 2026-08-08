// lib/core/communications/templates/email/billing/payment/paymentTemplate.tsx
export interface PaymentContext { name: string; amount: string; currency: string; reference: string; }
export function renderPaymentReceivedEmail(c: PaymentContext) {
  return {
    subject: `Payment received — ${c.currency}${c.amount}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Payment received ✓</h2>
      <p>Hi ${c.name}, we received <strong>${c.currency}${c.amount}</strong> (ref ${c.reference}).</p>
    </div>`,
    text: `Payment received: ${c.currency}${c.amount} (ref ${c.reference})`,
  };
}