// Client-safe: NO secrets, NO server imports. The single source of truth for
// fee math + formatting on the client. This is the SUPERSET of every symbol
// any consumer references (FeeRule/computeFee/feeLabel for the fee engine,
// splitGross/bpsToPercent/formatNaira for legacy + finance views, settleKey/
// topupKey as pure helpers) — so no page can ever fail to resolve a member.
//
// Integer Naira. Basis points (1000 = 10.00%). Mirrors settle_invoice:
//   commission   = contractual platform take per model, capped at gross
//   net          = gross - commission            (company credit; processor fee NOT deducted)
//   processorFee = PSP cost, 0 on wallet source  (platform bears it out of its commission)

export type FeeModel = 'percent' | 'flat' | 'hybrid' | 'waived';
export type FundingSource = 'wallet' | 'card' | 'bank' | string;

export interface FeeRule {
  model: FeeModel;
  commissionBps: number;   // percent component
  flatFee: number;         // flat component (Naira)
  processorBps: number;
  processorFlat: number;
  processorCap: number | null;
}

export const defaultFeeRule: FeeRule = {
  model: 'percent', commissionBps: 1000, flatFee: 0,
  processorBps: 0, processorFlat: 0, processorCap: null,
};

export interface FeeResult {
  gross: number;
  commission: number;       // contractual platform take (capped)
  net: number;              // company credit
  commissionBps: number;    // percent component (0 for flat/waived) — legacy callers
  processorFee: number;
  platformNet: number;      // commission - processorFee (can be negative on waived+card)
  feeModel: FeeModel;
  flatFee: number;
  processorBps: number;
  processorFlat: number;
  processorCap: number | null;
}

export function computeFee(grossNaira: number, rule: FeeRule | null | undefined, source: FundingSource = 'wallet'): FeeResult {
  const r = rule ?? defaultFeeRule;
  const g = Math.max(0, Math.trunc(grossNaira || 0));
  const model = r.model ?? 'percent';
  const bps = Math.max(0, Math.trunc(r.commissionBps || 0));
  const flat = Math.max(0, Math.trunc(r.flatFee || 0));

  const percentComp = Math.floor((g * bps) / 10000);
  let commission =
    model === 'flat' ? flat :
    model === 'hybrid' ? percentComp + flat :
    model === 'waived' ? 0 :
    percentComp;
  if (commission > g) commission = g;            // never take more than the payment
  const net = g - commission;

  let processorFee = 0;
  if (source !== 'wallet') {
    const pbps = Math.max(0, Math.trunc(r.processorBps || 0));
    const pflat = Math.max(0, Math.trunc(r.processorFlat || 0));
    const raw = Math.floor((g * pbps) / 10000) + pflat;
    processorFee = (r.processorCap != null && raw > r.processorCap) ? Math.max(0, Math.trunc(r.processorCap)) : raw;
  }

  return {
    gross: g, commission, net,
    commissionBps: (model === 'flat' || model === 'waived') ? 0 : bps,
    processorFee, platformNet: commission - processorFee,
    feeModel: model, flatFee: flat,
    processorBps: Math.max(0, Math.trunc(r.processorBps || 0)),
    processorFlat: Math.max(0, Math.trunc(r.processorFlat || 0)),
    processorCap: r.processorCap ?? null,
  };
}

// Human label for a rule — the one place "8%" vs "₦250 / payment" vs "Waived" is decided.
export function feeLabel(rule: FeeRule | null | undefined): string {
  const r = rule ?? defaultFeeRule;
  const pct = (r.commissionBps || 0) > 0
    ? (r.commissionBps / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%'
    : '';
  const flt = (r.flatFee || 0) > 0 ? '₦' + r.flatFee.toLocaleString('en-NG') + ' / payment' : '';
  switch (r.model) {
    case 'waived': return 'Waived (0%)';
    case 'flat':   return flt || 'Flat fee';
    case 'hybrid': return [pct, flt].filter(Boolean).join(' + ') || 'Custom';
    default:       return pct || '0%';
  }
}

export function formatNaira(n: number | null | undefined): string {
  return '₦' + Math.trunc(Number(n) || 0).toLocaleString('en-NG');
}

export function bpsToPercent(bps: number): string {
  return (bps / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
}

// Legacy wrapper — keeps older callers compiling; new code uses computeFee.
export const splitGross = (grossNaira: number, commissionBps: number) =>
  computeFee(grossNaira, { ...defaultFeeRule, commissionBps }, 'wallet');

// Stable, intent-bound idempotency keys (pure helpers).
export const settleKey = (invoiceId: string | number) => `inv-${invoiceId}`;
export const topupKey = (buildingId: string, nonce: string | number) => `topup-${buildingId}-${nonce}`;