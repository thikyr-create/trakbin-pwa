import { Platform } from 'react-native';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { useSessionStore } from '../store/session';
import { useConsoleStore } from '../store/ui';
import { offlineQueue } from './sync/queue';

export async function collectSnapshot() {
  const s = useSessionStore.getState();
  const c = useConsoleStore.getState();
  const net = await NetInfo.fetch();

  return {
    ts: new Date().toISOString(),
    app: Constants.expoConfig?.version ?? 'dev',
    platform: `${Platform.OS} ${Platform.Version}`,
    online: net.isConnected ?? false,
    networkType: net.type,
    queued: await offlineQueue.size().catch(() => -1),
    gps: s.gpsLocation,
    gpsAccuracy: s.gpsAccuracy,
    onShift: !!s.route && s.route.status !== 'completed',
    routeId: s.route?.id ?? null,
    routeStatus: s.route?.status ?? null,
    currentStopId: s.currentStop?.id ?? null,
    isArrived: s.isArrived,
    paused: s.isRoutePaused,
    tab: c.activeTab,
    sheet: c.sheetState,
  };
}