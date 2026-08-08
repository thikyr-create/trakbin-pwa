// lib/core/communications/security/redaction.ts
/**
 * Redact sensitive values for logs. Never log OTPs, passwords, or tokens in plaintext.
 */
export const redaction = {
  email(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    const head = user.slice(0, 2);
    const tail = user.slice(-1);
    return `${head}***${tail}@${domain}`;
  },

  otp(code: string): string {
    return code.length > 2 ? `${code.slice(0, 2)}****` : '****';
  },

  token(t: string): string {
    return t.length > 8 ? `${t.slice(0, 4)}…${t.slice(-4)}` : '****';
  },
};