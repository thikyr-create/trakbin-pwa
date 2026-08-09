// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resendWebhookHandler } from '@/lib/core/communications/delivery/webhookHandler';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!resendWebhookHandler.verifySignature(raw, req.headers.get('svix-signature'))) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
  }
  await resendWebhookHandler.handle(JSON.parse(raw));
  return NextResponse.json({ ok: true });
}