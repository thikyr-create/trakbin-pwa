"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, Plus, Minus, Navigation } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import ShiftCard from './components/ShiftCard';
import BottomSheet from './components/BottomSheet';
import SkipReasonModal from './components/SkipReasonModal';
import ReportIssueModal from './components/ReportIssueModal';
import RouteProgressCard from './components/RouteProgressCard';
import MapboxMap from './MapboxMap';
import { calculateTotalDistanceKm } from './utils/geo';

export default function HaulerDashboard() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // ✅ Read everything from the Operational Engine
  const {
    route, routeStops, currentStop, isLoading, progressStats,
    searchQuery, searchResults, isSearchFocused, showSkipModal, showReportModal,
    initializeSession, startGpsTracking, 
    setSearchQuery, setIsSearchFocused, selectSearchResult, setShowSkipModal, setShowReportModal,
    flyToLocation // ✅ NEW: Map Controller Action
  } = useDriverSession();

  // Initialize the Brain on mount
  useEffect(() => {
    initializeSession();
    startGpsTracking();
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate Progress Stats (Distance & ETA)
  useEffect(() => {
    if (routeStops.length === 0) return;
    const pendingStops = routeStops.filter((s: any) => s.status === 'pending' || s.status === 'arrived');
    const distanceKm = calculateTotalDistanceKm(pendingStops);
    
    // Update the Zustand store directly
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

      <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)] max-w-xs sm:max-w-sm flex flex-col gap-3">
        <ShiftCard route={route} />
        {route && routeStops.length > 0 && (
          <RouteProgressCard completed={route.completed_stops} remaining={route.total_stops - route.completed_stops} totalDistanceKm={progressStats.distance} etaMinutes={progressStats.eta} />
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] px-4 py-2 shadow-lg border border-slate-800">
          <p className="text-xs font-bold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button onClick={() => { localStorage.removeItem('trakbin_driver'); router.push('/'); }} className="bg-slate-900/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-800 hover:bg-red-500/20 transition-colors">
          <LogOut size={18} className="text-red-400" />
        </button>
      </div>

      {/* ✅ UPDATED: Floating Action Buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
        <button 
          onClick={() => { 
            if (currentStop?.latitude && currentStop?.longitude) {
              flyToLocation(currentStop.latitude, currentStop.longitude, 17);
            }
          }} 
          className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-emerald-600 transition-colors group" 
          title="Resume Route"
        >
          <Navigation size={20} className="text-emerald-400 group-hover:text-white" />
        </button>
        <button className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-slate-800 transition-colors"><Plus size={20} className="text-white" /></button>
        <button className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-slate-800 transition-colors"><Minus size={20} className="text-white" /></button>
      </div>

      <div ref={searchRef} className="absolute top-[180px] sm:top-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] flex items-center gap-3 px-4 py-3 shadow-lg border border-slate-800">
          <Search size={20} className="text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} placeholder="Search assigned buildings..." className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder:text-gray-500" />
        </div>
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((stop) => (
              <button key={stop.id} onClick={() => selectSearchResult(stop)} className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-white">{stop.building_id}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{stop.address}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${stop.status === 'completed' ? 'bg-gray-500/20 text-gray-400' : stop.status === 'skipped' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{stop.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <BottomSheet />
      </div>

      {/* ✅ Modals read directly from the store, no props needed */}
      <SkipReasonModal />
      <ReportIssueModal />
    </div>
  );
}