// lib/core/communications/channels/email/emailMessage.ts
import type { EmailMessage } from '../../models';
import type { EmailSendRequest } from './emailTypes';

export function buildEmailMessage(req: EmailSendRequest): EmailMessage {
  return {
    to: [req.to],
    subject: req.subject,
    html: req.html,
    text: req.text,
    from: req.from,
    replyTo: req.replyTo,
  };
}