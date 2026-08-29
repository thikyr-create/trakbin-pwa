import { supabase } from './supabase';

const getN = () => { try { return require('expo-notifications'); } catch { return null; } };
const getD = () => { try { return require('expo-device'); } catch { return null; } };

/** No-op until the deferred rebuild bakes expo-notifications in. */
export async function registerPushToken(userId: string) {
  const N = getN(); const D = getD();
  if (!N || !D || !D.isDevice) return { ok: false, reason: 'unavailable' };
  try {
    const { status: existing } = await N.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') status = (await N.requestPermissionsAsync()).status;
    if (status !== 'granted') return { ok: false, reason: 'denied' };
    const token = (await N.getExpoPushTokenAsync()).data;
    await supabase.from('device_tokens').upsert(
      { user_id: userId, token, platform: 'expo', updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}