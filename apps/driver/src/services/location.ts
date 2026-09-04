import * as Location from 'expo-location';

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

let subscription: Location.LocationSubscription | null = null;
let lastPosition: GpsPosition | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    // Best-effort; background denial must not kill foreground tracking
    await Location.requestBackgroundPermissionsAsync().catch(() => null);
    return true;
  } catch {
    return false;
  }
}

export async function startGpsWatch(
  onUpdate: (pos: GpsPosition) => void,
  onError?: (error: any) => void
): Promise<void> {
  if (subscription !== null) return;

  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      console.warn('[gps] device location services disabled');
      onError?.(new Error('location services disabled'));
      return;
    }

    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (location) => {
        const pos: GpsPosition = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        };
        lastPosition = pos;
        onUpdate(pos);
      }
    );
  } catch (e) {
    // Permission denied / settings off / transient failure — degrade, never crash
    console.warn('[gps] watch failed:', e);
    onError?.(e);
  }
}

export function stopGpsWatch(): void {
  if (subscription !== null) {
    subscription.remove();
    subscription = null;
  }
}

export function getLastPosition(): GpsPosition | null {
  return lastPosition;
}

export { calculateDistanceInMeters as calculateDistanceMeters } from '../utils/geo';