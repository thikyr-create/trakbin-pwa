import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

const BUCKET = 'environmental-issues';
const PENDING_KEY = 'trakbin_pending_evidence';
const MAX_ATTEMPTS = 3;

let netSubscribed = false;

/** Ask permission; on denial offer Settings instead of silently failing. */
async function ensureCamera(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === 'granted') return true;
  return new Promise((resolve) => {
    Alert.alert(
      'Camera required',
      'Proof-of-collection photos need camera access.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Open Settings',
          onPress: async () => {
            await Linking.openSettings();
            resolve(false);
          },
        },
      ]
    );
  });
}

async function uploadWithRetry(uri: string, path: string): Promise<string | null> {
  let delay = 1000;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch {
      if (attempt === MAX_ATTEMPTS) return null;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return null;
}

async function stashPending(uri: string) {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    list.push(uri);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {}
}

/** Upload anything stashed from failed attempts. Safe to call repeatedly. */
export async function flushPendingEvidence(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) return 0;
    const list: string[] = JSON.parse(raw);
    if (list.length === 0) return 0;

    const net = await NetInfo.fetch();
    if (!net.isConnected) return 0;

    const remaining: string[] = [];
    let done = 0;
    for (const uri of list) {
      const path = `driver-evidence/pending/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const url = await uploadWithRetry(uri, path);
      if (url) done++;
      else remaining.push(uri);
    }
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
    return done;
  } catch {
    return 0;
  }
}

/** Call once from Console mount — retries stashed evidence when connectivity returns. */
export function initEvidenceSync() {
  if (netSubscribed) return;
  netSubscribed = true;
  NetInfo.addEventListener((state) => {
    if (state.isConnected) flushPendingEvidence();
  });
  flushPendingEvidence();
}

/** Capture → compress → upload with retry → stash on failure. Returns public URL or null. */
export async function captureProof(): Promise<string | null> {
  const ok = await ensureCamera();
  if (!ok) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7, // compressed for flaky field networks
    base64: false,
    exif: true, // keep GPS/timestamp metadata in the file
  });

  if (result.canceled || !result.assets?.length) return null;
  const uri = result.assets[0].uri;

  const path = `driver-evidence/pickup/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const url = await uploadWithRetry(uri, path);

  if (!url) {
    await stashPending(uri);
    Alert.alert('Saved offline', 'Photo stored on device — it will upload automatically when you have connection.');
    return null;
  }

  return url;
}