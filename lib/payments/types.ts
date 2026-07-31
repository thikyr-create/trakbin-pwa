// Client-safe: NO secrets, NO server imports. The single contract every
// provider implements and the engine consumes. Swap a provider => only its
// adapter changes; nothing else in Trakbin moves.

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
  invoiceId?: string;             // when purpose === 'invoice'
  buildingId: string;             // owner of the wallet / invoice
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
  channel?: string;               // PSP's channel ('card','bank','ussd',…)
  pspFee?: number;                // what the PSP charged us (captured, not yet legged)
  raw?: Record<string, any>;
}

export interface RefundResult { status: PaymentStatus; raw?: any; }

// THE interface. The engine calls this — never a concrete provider.
export interface PaymentProvider {
  readonly name: PaymentProviderName;
  initialize(input: InitializeInput): Promise<InitializeResult>;
  verify(reference: string): Promise<VerifyResult>;
  refund(reference: string, amount?: number): Promise<RefundResult>;
}