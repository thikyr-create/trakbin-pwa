import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export async function configurePush() {
  if (!Device.isDevice) {
    console.log('[push] not a physical device — push disabled');
    return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }
  Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,   // legacy (SDK < 52)
      shouldShowBanner: true,  // new (SDK 52+)
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    } as any),
});
  
  console.log('[push] configured');
}

export async function registerPushToken(userId: string) {
  try {
    console.log('[push] register start, userId:', userId);

    if (!Device.isDevice) {
      console.log('[push] skipped — emulator/simulator');
      return;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    console.log('[push] permission status:', finalStatus);
    if (finalStatus !== 'granted') {
      console.log('[push] permission NOT granted — abort');
      return;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
      })
    ).data;
    console.log('[push] got Expo token:', token);

    const { data: existingRow } = await supabase
      .from('device_tokens')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRow) {
      await supabase
        .from('device_tokens')
        .update({ token, platform: Platform.OS, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('device_tokens')
        .insert({ user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() });
    }
    console.log('[push] token saved to device_tokens');
  } catch (e: any) {
    console.log('[push] FAILED:', e?.message || e);
  }
}