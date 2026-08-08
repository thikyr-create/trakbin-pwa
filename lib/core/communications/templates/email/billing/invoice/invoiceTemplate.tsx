// lib/core/communications/templates/email/billing/invoice/invoiceTemplate.tsx
export interface InvoiceContext {
  name: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  pdfUrl?: string;
}
export function renderInvoiceEmail(c: InvoiceContext) {
  return {
    subject: `Invoice ${c.invoiceNumber} from Trakbin`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Invoice ${c.invoiceNumber}</h2>
      <p>Hi ${c.name}, your invoice for <strong>${c.currency}${c.amount}</strong> is due ${c.dueDate}.</p>
      ${c.pdfUrl ? `<a href="${c.pdfUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View invoice</a>` : ''}
    </div>`,
    text: `Invoice ${c.invoiceNumber}: ${c.currency}${c.amount} due ${c.dueDate}`,
  };
}