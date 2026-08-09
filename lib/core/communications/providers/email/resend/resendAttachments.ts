// lib/core/communications/providers/email/resend/resendAttachments.ts
import type { EmailAttachment } from '../../../models';

export const resendAttachments = {
  fromBuffer(buffer: Buffer, filename: string, contentType?: string): EmailAttachment {
    return { filename, content: buffer.toString('base64'), contentType };
  },
  fromBase64(base64: string, filename: string, contentType?: string): EmailAttachment {
    return { filename, content: base64, contentType };
  },
};