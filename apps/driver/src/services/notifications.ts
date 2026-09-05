import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useSessionStore } from '../store/session';

export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Trakbin Driver',
    importance: Notifications.AndroidImportance.HIGH,
  }).catch(() => {});

  await Notifications.requestPermissionsAsync().catch(() => {});
  await registerPushToken();
}

/** Registers FCM token to Supabase. Degrades gracefully until google-services.json lands. */
export async function registerPushToken() {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    const driver = useSessionStore.getState().driver;
    if (!driver || !token?.data) return;

    await supabase
      .from('driver_devices')
      .upsert(
        {
          driver_id: String(driver.id),
          push_token: String(token.data),
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'driver_id' }
      );
  } catch (e: any) {
    // Expected until Firebase is configured — local notifications still work.
    console.warn('[push] token registration skipped:', e?.message);
  }
}

/** Immediate local notification (works now, no Firebase needed). */
export async function notifyLocal(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  }).catch(() => {});
}