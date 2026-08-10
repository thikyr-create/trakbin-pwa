// app/hauler-dashboard/page.tsx
"use client";

import { useEffect } from 'react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import TopBar from './components/console/TopBar';
import SearchPauseBar from './components/console/SearchPauseBar';
import BottomTabBar from './components/console/BottomTabBar';
import MapScreen from './screens/MapScreen';
import StopsScreen from './screens/StopsScreen';
import ProgressScreen from './screens/ProgressScreen';
import ActivityScreen from './screens/ActivityScreen';
import MoreScreen from './screens/MoreScreen';
import SkipReasonModal from './components/SkipReasonModal';
import DriverReportModal from './components/DriverReportModal';
import DeviationAlert from './components/DeviationAlert';
import EndShiftModal from './components/EndShiftModal';
import EvidenceCapture from './components/EvidenceCapture';

export default function HaulerDashboard() {
  const { initializeSession, startGpsTracking } = useDriverSession();
  const { activeTab, evidence, closeEvidence } = useConsoleStore();

  useEffect(() => {
    initializeSession();
    startGpsTracking();
  }, []);

  return (
    <div className="relative h-screen w-full bg-gray-50 overflow-hidden">
      {activeTab === 'map' && (
        <>
          <MapScreen />
          <SearchPauseBar />
        </>
      )}
      {activeTab === 'stops' && <StopsScreen />}
      {activeTab === 'progress' && <ProgressScreen />}
      {activeTab === 'activity' && <ActivityScreen />}
      {activeTab === 'more' && <MoreScreen />}

      <TopBar />
      <BottomTabBar />

      {/* Global modals — mounted once, survive screen/tab changes */}
      <SkipReasonModal />
      <DriverReportModal />
      <DeviationAlert />
      <EndShiftModal />
      <EvidenceCapture
        open={evidence.open}
        onClose={closeEvidence}
        activityType={evidence.type}
        buildingId={evidence.buildingId}
        contextLabel={evidence.label}
      />
    </div>
  );
}