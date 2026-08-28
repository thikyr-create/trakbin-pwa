export interface CardNetwork {
  name: string;
  prefixes: { min: number; max: number; len: number }[];
  lengths: number[];
  cvv: number;
}

// Real IIN/BIN ranges + lengths + CVV per network
const NETWORKS: CardNetwork[] = [
  { name: 'Verve', prefixes: [{ min: 5060, max: 5061, len: 4 }, { min: 6500, max: 6501, len: 4 }, { min: 8790, max: 8790, len: 4 }], lengths: [16, 19], cvv: 3 },
  { name: 'American Express', prefixes: [{ min: 34, max: 34, len: 2 }, { min: 37, max: 37, len: 2 }], lengths: [15], cvv: 4 },
  { name: 'Visa', prefixes: [{ min: 4, max: 4, len: 1 }], lengths: [16], cvv: 3 },
  { name: 'Mastercard', prefixes: [{ min: 51, max: 55, len: 2 }, { min: 2221, max: 2720, len: 4 }], lengths: [16], cvv: 3 },
  { name: 'Discover', prefixes: [{ min: 6011, max: 6011, len: 4 }, { min: 65, max: 65, len: 2 }], lengths: [16], cvv: 3 },
];

export function detectNetwork(digits: string): CardNetwork | null {
  for (const net of NETWORKS) {
    for (const p of net.prefixes) {
      const pre = digits.slice(0, p.len);
      if (pre.length === p.len) {
        const n = parseInt(pre, 10);
        if (n >= p.min && n <= p.max) return net;
      }
    }
  }
  return null;
}

export function luhn(digits: string): boolean {
  const s = digits.replace(/\D/g, '');
  if (!s) return false;
  let sum = 0, dbl = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = Number(s[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function expiryError(v: string): string | null {
  if (!v) return null;
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return 'Use MM/YY';
  const mm = Number(m[1]); const yy = Number(m[2]);
  if (mm < 1 || mm > 12) return 'Invalid month';
  const now = new Date();
  const cy = now.getFullYear() % 100; const cm = now.getMonth() + 1;
  if (yy < cy || (yy === cy && mm < cm)) return 'Card expired';
  return null;
}

export interface CardValidation {
  network: CardNetwork | null;
  numberError: string | null;
  expiryError: string | null;
  cvvError: string | null;
  numberComplete: boolean;
}

export function validateCard(number: string, expiry: string, cvv: string): CardValidation {
  const digits = number.replace(/\D/g, '');
  const network = detectNetwork(digits);

  let numberError: string | null = null;
  if (digits.length > 0 && !network) numberError = 'Card not recognized';
  else if (network && digits.length > Math.max(...network.lengths)) numberError = 'Invalid card number';
  else if (network && network.lengths.includes(digits.length) && !luhn(digits)) numberError = 'Invalid card number';

  const expErr = expiryError(expiry);

  const need = network?.cvv ?? 3;
  const cvvError = cvv.length > 0 && cvv.length !== need ? `${need}-digit code` : null;

  const numberComplete = !!network && network.lengths.includes(digits.length) && luhn(digits);

  return { network, numberError, expiryError: expErr, cvvError, numberComplete };
}