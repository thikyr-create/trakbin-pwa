import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionStore } from '../store/session';
import { useConsoleStore } from '../store/ui';
import { TopBar } from '../components/console/TopBar';
import { BottomTabBar } from '../components/console/BottomTabBar';
import { BottomSheet } from '../components/console/BottomSheet';
import { NotificationsSheet } from '../components/console/NotificationsSheet';
import { SearchScreen } from '../components/console/SearchScreen';
import { DiagnosticsOverlay } from '../components/console/DiagnosticsOverlay';
import { PauseReasonModal } from '../components/modals/PauseReasonModal';
import { DriverReportModal } from '../components/modals/DriverReportModal';
import { EndShiftModal } from '../components/modals/EndShiftModal';
import { MapScreen } from './MapScreen';
import { StopsScreen } from './StopsScreen';
import { ActivityScreen } from './ActivityScreen';
import { initNotifications } from '../services/notifications';
import { initEvidenceSync } from '../services/proof';
import { colors } from '../theme/design';

export default function Console() {
  const rootRef = useRef<View>(null);
  const activeTab = useConsoleStore((s) => s.activeTab);
  const initializeSession = useSessionStore((s) => s.initializeSession);
  const startGpsTracking = useSessionStore((s) => s.startGpsTracking);
  const stopGpsTracking = useSessionStore((s) => s.stopGpsTracking);

  useEffect(() => {
    initializeSession();
    startGpsTracking();
    initNotifications();
    initEvidenceSync();
    return () => {
      stopGpsTracking();
    };
  }, []);

  return (
    <View ref={rootRef} style={styles.root} collapsable={false}>
      {activeTab === 'map' && <MapScreen />}
      {activeTab === 'stops' && <StopsScreen />}
      {activeTab === 'activity' && <ActivityScreen />}

      {activeTab === 'map' && <BottomSheet />}

      <TopBar />
      <BottomTabBar />

      <NotificationsSheet />
      <SearchScreen />

      <PauseReasonModal />
      <DriverReportModal />
      <EndShiftModal />

      <DiagnosticsOverlay rootRef={rootRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
});