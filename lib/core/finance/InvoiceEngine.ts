// lib/core/finance/InvoiceEngine.ts

export class InvoiceEngineError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'InvoiceEngineError';
    this.status = status;
  }
}

function getCompanyNumericId(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem('trakbin_company');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const raw = parsed?.id ?? parsed?.company_id ?? null;
    if (raw == null) return null;

    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

function requireCompany(): number {
  const id = getCompanyNumericId();
  if (id == null) {
    throw new InvoiceEngineError('Company session not found. Please log in again.');
  }
  return id;
}

async function sendAction(payload: Record<string, unknown>) {
  const res = await fetch('/api/company/billing', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new InvoiceEngineError(
      data?.error || 'Billing operation failed.',
      res.status
    );
  }

  return data;
}

/** Generate the current-cycle invoice for one building (manual override). */
export async function generateForBuilding(custom_id: string, cycle?: { year: number; month: number }) {
  if (!custom_id) {
    throw new InvoiceEngineError('Building reference missing.');
  }

  const company_id = requireCompany();

  return sendAction({
    action: 'generate',
    company_id,
    custom_id,
    cycle: cycle || null,
  });
}

/**
 * Bulk generation — the full rule sweep across all active buildings.
 * Server returns { generated, skipped } counts for the dashboard strip.
 */
export async function generateBulk(cycle?: { year: number; month: number }) {
  const company_id = requireCompany();

  return sendAction({
    action: 'generate_bulk',
    company_id,
    cycle: cycle || null,
  });
}

/** Regenerate = cancel the existing period invoice + issue a fresh one. */
export async function regenerateInvoice(invoice_id: number) {
  if (!invoice_id) {
    throw new InvoiceEngineError('Invoice reference missing.');
  }

  const company_id = requireCompany();

  return sendAction({
    action: 'regenerate',
    company_id,
    invoice_id,
  });
}

export async function cancelInvoice(invoice_id: number) {
  if (!invoice_id) {
    throw new InvoiceEngineError('Invoice reference missing.');
  }

  const company_id = requireCompany();

  return sendAction({
    action: 'cancel',
    company_id,
    invoice_id,
  });
}