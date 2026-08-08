// lib/core/communications/config/communicationConfig.ts
export const communicationConfig = {
  get resendApiKey(): string | null { return process.env.RESEND_API_KEY ?? null; },
  get fromEmail(): string { return process.env.RESEND_FROM_EMAIL || 'Trakbin <onboarding@resend.dev>'; },
  get fromName(): string { return 'Trakbin'; },
  /** True when Resend is not configured. Emails log locally instead of sending. */
  get dryRun(): boolean { return !this.resendApiKey; },
  /** Log full email bodies to stdout when true. Useful in dev. */
  get debug(): boolean { return process.env.COMMUNICATIONS_DEBUG === 'true'; },
  /** App base URL for email links (reset, verify, etc). */
  get appBaseUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://trakbin.vercel.app';
  },
};