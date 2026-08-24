// mobile/services/proof.ts
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export async function captureProof(): Promise<string | null> {
  const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
  if (res.canceled || !res.assets?.length) return null;
  const uri = res.assets[0].uri;
  const path = `proof/${Date.now()}.jpg`;
  const blob = await (await fetch(uri)).blob();
  const { error } = await supabase.storage.from('proof-of-collection').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) return null;
  return supabase.storage.from('proof-of-collection').getPublicUrl(path).data.publicUrl;
}