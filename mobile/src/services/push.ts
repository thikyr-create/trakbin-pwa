import { Platform } from 'react-native';
import { supabase } from './supabase';

const getN = () => { try { return require('expo-notifications'); } catch { return null; } };
const getD = () => { try { return require('expo-device'); } catch { return null; } };

const ANDROID_CHANNEL_ID = 'trakbin-default';

/**
 * Call once at app boot (in root _layout.tsx). Sets up:
 *  - Android notification channel (required for Android 8+ to show anything)
 *  - Foreground presentation policy (show banners even when app is open)
 *  - Tap-response listener (route user when they tap a push)
 *
 * Safe to call multiple times — idempotent.
 */
export async function configurePush() {
  const N = getN();
  if (!N) return;

  // Android 8+ requires a channel or notifications silently drop
  if (Platform.OS === 'android') {
  try {
    await N.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Trakbin',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      // sound omitted → Android uses the system default sound
    });
  } catch (e) {
    console.warn('[push] channel setup failed:', e);
  }
}

  // Show banners even when app is foregrounded (otherwise pushes silently vanish)
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: N.AndroidNotificationPriority.HIGH,
    }),
  });

  // Handle taps — route the user based on notification data
  N.addNotificationResponseReceivedListener((response: any) => {
    const data = response?.notification?.request?.content?.data;
    if (!data) return;
    // Future: switch on data.type to deep-link into specific screens
    // e.g. if (data.type === 'pickup_completed') router.push('/customer/notifications');
    console.log('[push] tapped:', data);
  });
}

/**
 * Request permission, fetch Expo push token, persist to `device_tokens`.
 * Safe to call after every successful auth — upsert is idempotent on `user_id`.
 */
export async function registerPushToken(userId: string) {
  const N = getN();
  const D = getD();
  if (!N || !D || !D.isDevice) return { ok: false, reason: 'unavailable' };

  try {
    // 1. Permission (Android 13+ needs POST_NOTIFICATIONS runtime grant)
    const { status: existing } = await N.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await N.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return { ok: false, reason: 'denied' };

    // 2. Token
    const tokenData = await N.getExpoPushTokenAsync({
      projectId: undefined, // uses app.json slug-based project id
    });
    const token = tokenData.data;
    if (!token) return { ok: false, reason: 'no_token' };

    // 3. Persist — upsert on user_id so re-logins refresh the token
    const { error } = await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) return { ok: false, reason: error.message };

    return { ok: true, token };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}