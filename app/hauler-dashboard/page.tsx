"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Search, LogOut, MapPin, Plus, Minus, Navigation } from 'lucide-react';
import ShiftCard from './components/ShiftCard';
import BottomSheet from './components/BottomSheet';
import SkipReasonModal from './components/SkipReasonModal';
import ReportIssueModal from './components/ReportIssueModal'; // ✅ NEW
import RouteProgressCard from './components/RouteProgressCard';
import MapboxMap from './MapboxMap';
import { DriverRoute, RouteBuilding } from './components/types';
import { calculateDistanceInMeters, calculateTotalDistanceKm } from './utils/geo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function HaulerDashboard() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [driver, setDriver] = useState<any>(null);
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [routeStops, setRouteStops] = useState<RouteBuilding[]>([]);
  const [currentStop, setCurrentStop] = useState<RouteBuilding | null>(null);
  const [isArrived, setIsArrived] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // ✅ NEW
  const [isLoading, setIsLoading] = useState(true);
  const [progressStats, setProgressStats] = useState({ distance: 0, eta: 0 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RouteBuilding[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 1. Clock & Auth Check
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    const storedDriver = localStorage.getItem('trakbin_driver');
    if (storedDriver) setDriver(JSON.parse(storedDriver));
    else router.push('/auth');
    return () => clearInterval(timer);
  }, [router]);

  // 2. Fetch Real Route Data
  useEffect(() => {
    if (!driver) return;
    const fetchRoute = async () => {
      setIsLoading(true);
      try {
        const { data: routeData, error: routeError } = await supabase
          .from('routes').select('*').eq('driver_id', driver.employee_id || driver.id)
          .in('status', ['assigned', 'active']).order('created_at', { ascending: false }).limit(1).single();

        if (routeError || !routeData) { setRoute(null); setRouteStops([]); setIsLoading(false); return; }
        setRoute(routeData);

        const { data: stopsData } = await supabase.from('route_stops').select('*').eq('route_id', routeData.id).order('sequence', { ascending: true });
        if (!stopsData) { setRouteStops([]); setIsLoading(false); return; }

        const buildingIds = stopsData.map((stop: any) => stop.building_id);
        const { data: buildingsData } = await supabase.from('Buildings').select('custom_id, address, latitude, longitude, payment_status, waste_type, estimated_waste, occupancy').in('custom_id', buildingIds);

        const mergedStops: RouteBuilding[] = stopsData.map((stop: any) => {
          const building = buildingsData?.find((b: any) => b.custom_id === stop.building_id);
          return { ...stop, address: building?.address, latitude: building?.latitude, longitude: building?.longitude, payment_status: building?.payment_status, waste_type: building?.waste_type, estimated_waste: building?.estimated_waste, occupancy: building?.occupancy };
        });

        setRouteStops(mergedStops);
        setCurrentStop(mergedStops.find((s: any) => s.status === 'pending') || null);
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    fetchRoute();
  }, [driver]);

  // 3. Progress Stats
  useEffect(() => {
    if (routeStops.length === 0) return;
    const pendingStops = routeStops.filter((s: any) => s.status === 'pending' || s.status === 'arrived');
    const distanceKm = calculateTotalDistanceKm(pendingStops);
    setProgressStats({ distance: distanceKm, eta: (distanceKm / 25) * 60 });
  }, [routeStops]);

  // 4. Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const query = searchQuery.toLowerCase();
    setSearchResults(routeStops.filter((stop) => stop.building_id.toLowerCase().includes(query) || (stop.address || '').toLowerCase().includes(query)));
  }, [searchQuery, routeStops]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (stop: RouteBuilding) => {
    setSearchQuery(stop.address || stop.building_id);
    setIsSearchFocused(false);
    setCurrentStop(stop);
  };

  // 5. GPS & Arrival
  useEffect(() => {
    if (!navigator.geolocation || !currentStop) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (currentStop.latitude && currentStop.longitude) {
          const distance = calculateDistanceInMeters(pos.coords.latitude, pos.coords.longitude, currentStop.latitude, currentStop.longitude);
          if (distance <= 25 && !isArrived) setIsArrived(true);
          else if (distance > 50 && isArrived) setIsArrived(false); 
        }
      }, (err) => console.warn(err), { enableHighAccuracy: true, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentStop, isArrived]);

  // Handlers
  const handleCompletePickup = async () => {
    if (!currentStop || !route) return;
    setRouteStops((prev: any) => prev.map((s: any) => s.id === currentStop.id ? { ...s, status: 'completed' } : s));
    setRoute((prev: any) => prev ? { ...prev, completed_stops: prev.completed_stops + 1 } : null);
    await supabase.from('route_stops').update({ status: 'completed', completion_time: new Date().toISOString() }).eq('id', currentStop.id);
    await supabase.from('routes').update({ completed_stops: route.completed_stops + 1 }).eq('id', route.id);
    const nextStop = routeStops.find((s: any) => s.sequence === currentStop.sequence + 1 && s.status === 'pending');
    setCurrentStop(nextStop || null);
    setIsArrived(false);
  };

  const handleSkipSubmit = async (reason: string) => {
    if (!currentStop) return;
    setRouteStops((prev: any) => prev.map((s: any) => s.id === currentStop.id ? { ...s, status: 'skipped', skip_reason: reason } : s));
    await supabase.from('route_stops').update({ status: 'skipped', skip_reason: reason }).eq('id', currentStop.id);
    const nextStop = routeStops.find((s: any) => s.sequence === currentStop.sequence + 1 && s.status === 'pending');
    setCurrentStop(nextStop || null);
    setIsArrived(false);
    setShowSkipModal(false);
  };

  // ✅ NEW: Navigate Handler (Opens Google Maps)
  const handleNavigate = () => {
    if (!currentStop || !currentStop.latitude || !currentStop.longitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // ✅ NEW: Report Issue Handler
  const handleReportSubmit = async (issue: string) => {
    // In a real app, you would save this to a 'reports' table in Supabase
    console.log(`Reported issue at ${currentStop?.building_id}: ${issue}`);
    setShowReportModal(false);
    alert("Issue reported to dispatch!");
  };

  if (isLoading) {
    return <div className="h-screen w-full bg-slate-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="relative h-screen w-full bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapboxMap routeStops={routeStops} focusStop={currentStop} />
      </div>

      <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)] max-w-xs sm:max-w-sm flex flex-col gap-3">
        <ShiftCard route={route} />
        {route && routeStops.length > 0 && (
          <RouteProgressCard completed={route.completed_stops} remaining={route.total_stops - route.completed_stops} totalDistanceKm={progressStats.distance} etaMinutes={progressStats.eta} />
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] px-4 py-2 shadow-lg border border-slate-800">
          <p className="text-xs font-bold text-white">{currentTime || '--:--'}</p>
        </div>
        <button onClick={() => { localStorage.removeItem('trakbin_driver'); router.push('/'); }} className="bg-slate-900/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-800 hover:bg-red-500/20 transition-colors">
          <LogOut size={18} className="text-red-400" />
        </button>
      </div>

      {/* ✅ NEW: Resume Route Floating Button */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
        <button 
          onClick={() => setCurrentStop(currentStop)} // Triggers the flyTo in MapboxMap
          className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-emerald-600 transition-colors group"
          title="Resume Route / Center Map"
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
              <button key={stop.id} onClick={() => handleSelectResult(stop)} className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 flex justify-between items-center">
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
        <BottomSheet stop={currentStop} isArrived={isArrived} onComplete={handleCompletePickup} onSkip={() => setShowSkipModal(true)} onNavigate={handleNavigate} onReport={() => setShowReportModal(true)} />
      </div>

      <SkipReasonModal isOpen={showSkipModal} onClose={() => setShowSkipModal(false)} onSubmit={handleSkipSubmit} />
      <ReportIssueModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} onSubmit={handleReportSubmit} />
    </div>
  );
}