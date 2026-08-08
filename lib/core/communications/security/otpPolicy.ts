// lib/core/communications/security/otpPolicy.ts
import { randomInt } from 'crypto';

export const otpPolicy = {
  length: 6,
  ttlMinutes: 10,
  maxAttempts: 5,
  alphabet: '0123456789',

  generate(): string {
    let code = '';
    for (let i = 0; i < this.length; i++) {
      code += this.alphabet[randomInt(0, this.alphabet.length)];
    }
    return code;
  },
};