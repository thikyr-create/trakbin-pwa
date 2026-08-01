// Client-safe: NO secrets, NO server imports. The single contract every provider
// implements and the engine consumes. The three core methods are required; the
// directory / resolution / recurring capabilities are OPTIONAL — a provider opts
// in by implementing them, and the engine guards with the supports*() checks.
// Swap a provider => only its adapter changes; nothing else in Trakbin moves.

export type PaymentMethod = 'card' | 'bank' | 'ussd' | 'mobile_money' | 'wallet';
export type PaymentProviderName = 'paystack' | 'flutterwave' | 'stripe' | 'monnify' | 'opay';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'reversed';
export type PaymentPurpose = 'topup' | 'invoice';

export interface InitializeInput {
  amount: number;                 // whole Naira (integer)
  currency: string;               // 'NGN'
  email: string;                  // payer email (required by most PSPs)
  method?: PaymentMethod;         // preferred channel hint
  purpose: PaymentPurpose;
  invoiceId?: string;
  buildingId: string;
  metadata?: Record<string, any>; // carries callback_url etc.
}
export interface InitializeResult {
  provider: PaymentProviderName;
  reference: string;
  authorizationUrl?: string;      // hosted/redirect providers (Paystack)
  clientPayload?: Record<string, any>; // inline/SDK providers (future)
}
export interface VerifyResult {
  provider: PaymentProviderName;
  reference: string;
  status: PaymentStatus;
  amount: number;                 // whole Naira actually charged
  currency: string;
  channel?: string;
  pspFee?: number;                // what the PSP charged us (captured; legged later)
  raw?: Record<string, any>;
}
export interface RefundResult { status: PaymentStatus; raw?: any; }

// ── bank directory + account resolution (the 6.1b spine) ─────────────────
export interface BankInfo {
  code: string;
  name: string;
  currency?: string;
  country?: string;
  logoUrl?: string;
  payWithBank?: boolean;          // carried forward for the 6.1c add-bank filter
  supportsTransfer?: boolean;
}
export interface ListBanksOptions { country?: string; currency?: string; }   // ISO: 'NG' / 'NGN'
export interface ResolveAccountOptions { bankCode: string; accountNumber: string; currency?: string; }
export interface ResolvedAccount { accountName: string; accountNumber?: string; bankCode: string; bankName?: string; }

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  initialize(input: InitializeInput): Promise<InitializeResult>;
  verify(reference: string): Promise<VerifyResult>;
  refund(reference: string, amount?: number): Promise<RefundResult>;
}

// Optional capabilities — implement what the rails support:
export interface BankDirectoryProvider     { listBanks(opts: ListBanksOptions): Promise<BankInfo[]>; }
export interface AccountResolutionProvider { resolveAccount(opts: ResolveAccountOptions): Promise<ResolvedAccount>; }
export interface ReusableInstrumentProvider { createReusableAuthorization(input: any): Promise<{ authorizationCode: string; reusable: boolean }>; }

// Runtime guards — the engine/UI call these BEFORE invoking a capability:
export const supportsBankDirectory = (p: PaymentProvider): p is PaymentProvider & BankDirectoryProvider =>
  typeof (p as any).listBanks === 'function';
export const supportsAccountResolution = (p: PaymentProvider): p is PaymentProvider & AccountResolutionProvider =>
  typeof (p as any).resolveAccount === 'function';

// ── payout capabilities (6.2b) — providers opt in ────────────────────────
export interface CreateRecipientInput { name: string; accountNumber: string; bankCode: string; currency?: string; }
export interface CreateRecipientResult { recipientCode: string; }
export interface TransferInput { amountKobo: number; recipientCode: string; reference?: string; reason?: string; }
export interface TransferResult { transferCode: string; status: string; raw?: any; }

export interface PayoutRecipientProvider { createRecipient(input: CreateRecipientInput): Promise<CreateRecipientResult>; }
export interface PayoutTransferProvider { transfer(input: TransferInput): Promise<TransferResult>; }

export const supportsPayoutRecipient = (p: PaymentProvider): p is PaymentProvider & PayoutRecipientProvider =>
  typeof (p as any).createRecipient === 'function';
export const supportsPayoutTransfer = (p: PaymentProvider): p is PaymentProvider & PayoutTransferProvider =>
  typeof (p as any).transfer === 'function';