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
import PauseReasonModal from './components/console/PauseReasonModal';
import NotificationsSheet from './components/console/NotificationsSheet';
import SearchScreen from './components/console/SearchScreen';

const HEADER_H = 60; // px — matches TopBar content height
const TABBAR_H = 72; // px — matches BottomTabBar height

export default function HaulerDashboard() {
  const { initializeSession, startGpsTracking } = useDriverSession();
  const { activeTab, evidence, closeEvidence } = useConsoleStore();

  useEffect(() => {
    initializeSession();
    startGpsTracking();
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-50 flex flex-col"
      style={{ height: 'var(--app-h, 100dvh)' }}
    >
      {/* ── Fixed header ── */}
      <header
        className="relative z-30 shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
        style={{ height: HEADER_H, paddingTop: 'env(safe-area-inset-top)' }}
      >
        <TopBar />
      </header>

      {/* ── Flexible main viewport (map gets exactly the leftover space) ── */}
      <main className="relative flex-1 min-h-0 overflow-hidden">
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'stops' && <StopsScreen />}
        {activeTab === 'progress' && <ProgressScreen />}
        {activeTab === 'activity' && <ActivityScreen />}
        {activeTab === 'more' && <MoreScreen />}

        {/* Search/pause overlays the map only */}
        {activeTab === 'map' && <SearchPauseBar headerHeight={HEADER_H} />}
      </main>

      {/* ── Fixed bottom navigation ── */}
      <nav
        className="relative z-40 shrink-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <BottomTabBar />
      </nav>

      {/* Global modals/sheets — unchanged */}
      <SkipReasonModal />
      <DriverReportModal />
      <DeviationAlert />
      <EndShiftModal />
      <PauseReasonModal />
      <NotificationsSheet />
            <SearchScreen />
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