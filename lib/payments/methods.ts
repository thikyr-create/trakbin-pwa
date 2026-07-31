import type { PaymentMethod } from './types';

export interface MethodMeta { id: PaymentMethod; label: string; icon: string; hint: string; viaProvider: boolean; }

export const PAYMENT_METHODS: MethodMeta[] = [
  { id: 'card',         label: 'Debit / Credit Card', icon: '💳', hint: 'Visa · Mastercard · Verve', viaProvider: true },
  { id: 'bank',         label: 'Bank Transfer',       icon: '🏦', hint: 'Instant bank pay',          viaProvider: true },
  { id: 'ussd',         label: 'USSD',                icon: '📲', hint: 'Dial to approve',           viaProvider: true },
  { id: 'mobile_money', label: 'Mobile Money',        icon: '📱', hint: 'Where available',           viaProvider: true },
  { id: 'wallet',       label: 'Trakbin Wallet',      icon: '💰', hint: 'Pay from your balance',     viaProvider: false },
];