import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { breadcrumbRecorder } from './breadcrumbs';
import { deviationDetector } from './deviation';

const TASK_NAME = 'trakbin-bg-location';

/** Store access injected by the caller — breaks the session ⇄ pipeline require cycle. */
type StoreAccess = {
  getState: () => any;
  setState: (partial: any) => void;
};

let access: StoreAccess | null = null;

let fgSubscription: Location.LocationSubscription | null = null;
let bgRunning = false;
let fgRunning = false;
let appStateSub: ReturnType<AppState['addEventListener']> | null = null;
let taskRegistered = false;

/** Single funnel — foreground watcher and background task both route through here. */
function onLocationUpdate(loc: Location.LocationObject) {
  if (!access) return;
  const state = access.getState();
  const driver = state.driver;
  const companyId = state.driverCompanyId;
  const route = state.route;
  const coords = loc.coords;

  if (!driver || companyId == null) return;

  access.setState({
    gpsLocation: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    },
  });

  breadcrumbRecorder.record({
    driverId: driver.employee_id || String(driver.id),
    companyId,
    routeId: route?.id ?? null,
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy ?? null,
    speed: coords.speed ?? null,
    heading: coords.heading ?? null,
  });

  if (route && route.id) {
    deviationDetector.checkDeviation(coords.latitude, coords.longitude, {
      driver,
      route,
      companyId,
    });
  }
}

function registerBackgroundTask() {
  if (taskRegistered) return;
  try {
    TaskManager.defineTask(TASK_NAME, async ({ data, error }: any) => {
      if (error) {
        console.warn('[gps:bg] task error:', error);
        return;
      }
      if (data?.locations && Array.isArray(data.locations)) {
        for (const loc of data.locations) {
          onLocationUpdate(loc);
        }
      }
    });
    taskRegistered = true;
  } catch (e: any) {
    console.warn('[gps:bg] defineTask failed:', e?.message);
  }
}

async function startForeground() {
  if (fgRunning) return;
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 30,
        timeInterval: 15000,
      },
      (loc) => onLocationUpdate(loc)
    );
    fgSubscription = sub;
    fgRunning = true;
  } catch (e: any) {
    console.warn('[gps:fg] start failed:', e?.message);
  }
}

function stopForeground() {
  fgSubscription?.remove();
  fgSubscription = null;
  fgRunning = false;
}

async function startBackground() {
  if (bgRunning || Platform.OS !== 'android' || !taskRegistered) return;
  try {
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 30,
      timeInterval: 15000,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'Trakbin Driver',
        notificationBody: 'Route telemetry active',
        notificationColor: '#059669',
      },
      showsBackgroundLocationIndicator: true,
    } as any);
    bgRunning = true;
  } catch (e: any) {
    console.warn('[gps:bg] start failed:', e?.message);
  }
}

async function stopBackground() {
  if (!bgRunning) return;
  try {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
    bgRunning = false;
  } catch (e: any) {
    console.warn('[gps:bg] stop failed:', e?.message);
  }
}

function onAppStateChange(next: string) {
  if (next === 'active') {
    stopBackground();
    startForeground();
  } else {
    stopForeground();
    startBackground();
  }
}

export const gpsPipeline = {
  async start(store?: StoreAccess) {
    if (store) access = store;
    if (!access) {
      console.warn('[gps] start called without store access');
      return;
    }

    await breadcrumbRecorder.flush().catch(() => {});
    deviationDetector.reset();

    const route = access.getState().route;
    if (route?.id) {
      await deviationDetector.loadRouteGeometry(route.id).catch(() => {});
    }

    registerBackgroundTask();
    await startForeground();

    if (!appStateSub) {
      appStateSub = AppState.addEventListener('change', onAppStateChange);
    }
  },

  async stop() {
    stopForeground();
    await stopBackground();
    appStateSub?.remove();
    appStateSub = null;
    await breadcrumbRecorder.flush().catch(() => {});
    deviationDetector.reset();
  },
};