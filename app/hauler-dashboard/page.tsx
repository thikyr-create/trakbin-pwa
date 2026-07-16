"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriverSession } from '@/lib/store/useDriverSession';
import ShiftCard from './components/ShiftCard';
import RouteProgressCard from './components/RouteProgressCard';
import SkipReasonModal from './components/SkipReasonModal';
import ReportIssueModal from './components/ReportIssueModal';
import BottomPanel from './components/BottomPanel';
import MapboxMap from './MapboxMap';
import { calculateTotalDistanceKm } from './utils/geo';

export default function HaulerDashboard() {
  const router = useRouter();
  
  const {
    route, routeStops, currentStop, isLoading, progressStats, isRoutePaused,
    initializeSession, startGpsTracking, flyToLocation, toggleRoutePause
  } = useDriverSession();

  useEffect(() => {
    initializeSession();
    startGpsTracking();
  }, []);

  useEffect(() => {
    if (routeStops.length === 0) return;
    const pendingStops = routeStops.filter((s: any) => s.status === 'pending' || s.status === 'arrived');
    const distanceKm = calculateTotalDistanceKm(pendingStops);
    useDriverSession.setState({ progressStats: { distance: distanceKm, eta: (distanceKm / 25) * 60 } });
  }, [routeStops]);

  if (isLoading) {
    return <div className="h-screen w-full bg-slate-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="relative h-screen w-full bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapboxMap />
      </div>

      {/* Top Left: Shift Card + Progress Card */}
      <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)] max-w-xs sm:max-w-sm flex flex-col gap-2">
        <ShiftCard route={route} />
        {route && routeStops.length > 0 && (
          <RouteProgressCard completed={route.completed_stops} remaining={route.total_stops - route.completed_stops} totalDistanceKm={progressStats.distance} etaMinutes={progressStats.eta} />
        )}
      </div>

      {/* Top Right: Time + Logout */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-slate-800 flex items-center gap-3">
          <p className="text-xs font-bold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <button onClick={() => { localStorage.removeItem('trakbin_driver'); router.push('/'); }} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <LogOut size={16} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* ✅ PAUSE / RESUME FLOATING ACTION BUTTON */}
      <AnimatePresence>
        {currentStop?.latitude && currentStop?.longitude && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { 
              if (isRoutePaused) {
                // RESUME: Unpause and fly to current stop
                toggleRoutePause();
                // ✅ FIX: Added type safety check for coordinates
                if (currentStop.latitude && currentStop.longitude) {
                  flyToLocation(currentStop.latitude, currentStop.longitude, 17);
                }
              } else {
                // PAUSE: Pause the route (Truck is full)
                toggleRoutePause();
              }
            }}
            className={`absolute right-6 bottom-[120px] z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2 border-white transition-colors ${
              isRoutePaused 
                ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/50' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50' 
            }`}
          >
            {isRoutePaused ? (
              <Play size={24} className="text-white fill-white" /> 
            ) : (
              <Pause size={24} className="text-white" /> 
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Panel */}
      <BottomPanel />

      <SkipReasonModal />
      <ReportIssueModal />
    </div>
  );
}