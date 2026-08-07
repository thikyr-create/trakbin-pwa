import { registerZoneAutoAssignSubscriber } from '../subscribers/ZoneAutoAssignSubscriber';
import { registerStoreRefreshSubscriber } from '../subscribers/StoreRefreshSubscriber';
import { registerNotificationSubscriber } from '../subscribers/NotificationSubscriber';

let booted = false;
/** Call once at app/dashboard mount. */
export function bootstrapEventBus() {
  if (booted) return;
  booted = true;
  registerZoneAutoAssignSubscriber();
  registerStoreRefreshSubscriber();
  registerNotificationSubscriber();
}