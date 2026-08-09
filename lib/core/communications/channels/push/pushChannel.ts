// lib/core/communications/channels/push/pushChannel.ts
import type { NotificationContext } from '../../engine/notificationContext';
import { ProviderError } from '../../errors';

/**
 * Push is intentionally unimplemented (no FCM / web-push keys yet).
 * Conforms to the channel shape so the dispatcher can reference it safely.
 */
export const pushChannel = {
  async notify(_ctx: NotificationContext): Promise<never> {
    throw new ProviderError('Push channel not implemented — add FCM/web-push keys first', 501);
  },
};