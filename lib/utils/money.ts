// The single source of truth for every commission split on the platform.
// Integer Naira. Basis points (1000 = 10.00%). Platform rounds its cut DOWN
// (Math.floor) so the merchant absorbs the sub-Naira remainder — we never
// take more than the stated rate. Deterministic => the legs always sum to gross.
//
// UNIT SEAM: we operate in whole Naira integers. If a future rate/amount combo
// demands kobo precision, the migration is a single *100 on the money columns
// plus this file — bounded, one place. Do not scatter conversions elsewhere.

export interface Split {
  gross: number;        // what the caretaker is charged (integer Naira)
  commission: number;   // Trakbin's cut (integer Naira, rounded down)
  net: number;          // what the provider earns (gross - commission)
  commissionBps: number;// the rate that was applied, frozen on the envelope
}

export function splitGross(grossNaira: number, commissionBps: number): Split {
  const g = Math.max(0, Math.trunc(grossNaira || 0));
  const bps = Math.max(0, Math.trunc(commissionBps || 0));
  const commission = Math.floor((g * bps) / 10000); // platform rounds down
  return { gross: g, commission, net: g - commission, commissionBps: bps };
}

export function formatNaira(n: number | null | undefined): string {
  const v = Math.trunc(Number(n) || 0);
  return '₦' + v.toLocaleString('en-NG');
}

export function bpsToPercent(bps: number): string {
  return (bps / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
}

// A stable, intent-bound idempotency key. An invoice is a one-time charge, so
// the invoice id IS the key — a second attempt (retry, double-click, race)
// collapses onto the first settlement instead of charging twice.
export const settleKey = (invoiceId: string | number) => `inv-${invoiceId}`;
export const topupKey = (buildingId: string, nonce: string | number) => `topup-${buildingId}-${nonce}`;