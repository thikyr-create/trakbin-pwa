import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSessionStore } from '../store/session';
import { useConsoleStore } from '../store/ui';
import { TopBar } from '../components/console/TopBar';
import { BottomTabBar } from '../components/console/BottomTabBar';
import { BottomSheet } from '../components/console/BottomSheet';
import { NotificationsSheet } from '../components/console/NotificationsSheet';
import { SearchScreen } from '../components/console/SearchScreen';
import { MapScreen } from './MapScreen';
import { StopsScreen } from './StopsScreen';
import { ProgressScreen } from './ProgressScreen';
import { ActivityScreen } from './ActivityScreen';
import { MoreScreen } from './MoreScreen';
import { colors } from '../theme/design';
import { SkipReasonModal } from '../components/modals/SkipReasonModal';
import { EndShiftModal } from '../components/modals/EndShiftModal';
import { PauseReasonModal } from '../components/modals/PauseReasonModal';
import { DriverReportModal } from '../components/modals/DriverReportModal';


export default function Console() {
  const activeTab = useConsoleStore((s) => s.activeTab);
  const initializeSession = useSessionStore((s) => s.initializeSession);
  const startGpsTracking = useSessionStore((s) => s.startGpsTracking);
  const stopGpsTracking = useSessionStore((s) => s.stopGpsTracking);

  useEffect(() => {
    initializeSession();
    startGpsTracking();
    return () => { stopGpsTracking(); };
  }, []);

  return (
    <View style={styles.root}>
      {activeTab === 'map' && <MapScreen />}
      {activeTab === 'stops' && <StopsScreen />}
      {activeTab === 'progress' && <ProgressScreen />}
      {activeTab === 'activity' && <ActivityScreen />}
      {activeTab === 'more' && <MoreScreen />}

      {activeTab === 'map' && <BottomSheet />}

      <TopBar />
      <BottomTabBar />
      <SkipReasonModal />
<EndShiftModal />
<PauseReasonModal />
<DriverReportModal />
      
      <NotificationsSheet />
      <SearchScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
});