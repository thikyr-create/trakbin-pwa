// lib/core/communications/providers/email/resend/resendDomains.ts
import { assertResend } from './resendClient';

export const resendDomains = {
  async list() {
    const res = await assertResend().domains.list();
    return res.data?.data ?? [];
  },
  async create(domain: string) {
    const res = await assertResend().domains.create({ name: domain });
    if (res.error) throw new Error(res.error.message);
    return res.data;
  },
  async verify(domainId: string) {
    const res = await assertResend().domains.verify(domainId);
    if (res.error) throw new Error(res.error.message);
    return res.data;
  },
  async get(domainId: string) {
    const res = await assertResend().domains.get(domainId);
    return res.data;
  },
};