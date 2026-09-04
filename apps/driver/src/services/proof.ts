import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export async function captureProof(): Promise<string | null> {
  const res = await ImagePicker.launchCameraAsync({
    quality: 0.6,
    allowsEditing: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  
  const uri = res.assets[0].uri;
  const path = `proof/${Date.now()}.jpg`;
  
  try {
    const blob = await (await fetch(uri)).blob();
    const { error } = await supabase.storage
      .from('proof-of-collection')
      .upload(path, blob, { contentType: 'image/jpeg' });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data } = supabase.storage.from('proof-of-collection').getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('Proof capture error:', e);
    return null;
  }
}