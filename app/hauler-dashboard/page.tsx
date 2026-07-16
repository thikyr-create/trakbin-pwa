"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, MapPin, Plus, Minus } from 'lucide-react';
import ShiftCard from './components/ShiftCard';
import BottomSheet from './components/BottomSheet';
import SkipReasonModal from './components/SkipReasonModal';
import MapboxMap from './MapboxMap';
import { DriverRoute, RouteBuilding } from './components/types';
import { calculateDistanceInMeters } from './utils/geo';

export default function HaulerDashboard() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [routeStops, setRouteStops] = useState<RouteBuilding[]>([]);
  const [currentStop, setCurrentStop] = useState<RouteBuilding | null>(null);
  const [isArrived, setIsArrived] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);

  // 1. Clock
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Simulate Route Assignment
  useEffect(() => {
    const mockRoute: DriverRoute = {
      id: 'route-001', company_id: 'comp-1', driver_id: 'A30', truck_id: 'TRK-03',
      zone_id: 'Zone A', route_name: 'Route A-03', status: 'active',
      total_stops: 3, completed_stops: 0, scheduled_start_time: new Date().toISOString(),
    };

    const mockStops: RouteBuilding[] = [
      { id: '1', route_id: 'route-001', building_id: 'TB-001', sequence: 1, status: 'pending', address: '12 Palm Crescent', latitude: 6.5250, longitude: 3.3790, payment_status: 'paid', waste_type: 'Mixed', estimated_waste: '240L', occupancy: '16 Units' },
      { id: '2', route_id: 'route-001', building_id: 'TB-002', sequence: 2, status: 'pending', address: '45 Marina Road', latitude: 6.5265, longitude: 3.3810, payment_status: 'unpaid', waste_type: 'Organic', estimated_waste: '120L', occupancy: '8 Units' },
      { id: '3', route_id: 'route-001', building_id: 'TB-003', sequence: 3, status: 'completed', address: '88 Broad Street', latitude: 6.5280, longitude: 3.3830, payment_status: 'paid', waste_type: 'Mixed', estimated_waste: '300L', occupancy: '24 Units' },
    ];

    setTimeout(() => {
      setRoute(mockRoute);
      setRouteStops(mockStops);
      setCurrentStop(mockStops.find(s => s.status === 'pending') || null);
    }, 1500);
  }, []);

  // 3. Track GPS and Detect Arrival
  useEffect(() => {
    if (!navigator.geolocation || !currentStop) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (currentStop.latitude && currentStop.longitude) {
          const distance = calculateDistanceInMeters(
            pos.coords.latitude, pos.coords.longitude,
            currentStop.latitude, currentStop.longitude
          );
          
          // ARRIVAL DETECTION: 25 meters
          if (distance <= 25 && !isArrived) {
            setIsArrived(true);
          } else if (distance > 50 && isArrived) {
            setIsArrived(false); 
          }
        }
      },
      (err) => console.warn('GPS Error:', err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentStop, isArrived]);

  // Handlers
  const handleCompletePickup = () => {
    if (!currentStop) return;
    setRouteStops(prev => prev.map(s => s.id === currentStop.id ? { ...s, status: 'completed' } : s));
    setRoute(prev => prev ? { ...prev, completed_stops: prev.completed_stops + 1 } : null);
    
    const nextStop = routeStops.find(s => s.sequence === currentStop.sequence + 1 && s.status === 'pending');
    setCurrentStop(nextStop || null);
    setIsArrived(false);
  };

  const handleSkipSubmit = (reason: string) => {
    if (!currentStop) return;
    
    // Update local state to mark as skipped
    setRouteStops(prev => prev.map(s => s.id === currentStop.id ? { ...s, status: 'skipped', skip_reason: reason } : s));
    
    // Move to next stop
    const nextStop = routeStops.find(s => s.sequence === currentStop.sequence + 1 && s.status === 'pending');
    setCurrentStop(nextStop || null);
    setIsArrived(false);
    setShowSkipModal(false);
  };

  return (
    <div className="relative h-screen w-full bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapboxMap routeStops={routeStops} />
      </div>

      <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)] max-w-xs sm:max-w-sm">
        <ShiftCard route={route} />
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] px-4 py-2 shadow-lg border border-slate-800">
          <p className="text-xs font-bold text-white">{currentTime || '--:--'}</p>
        </div>
        <button onClick={() => { localStorage.removeItem('trakbin_driver'); router.push('/'); }} className="bg-slate-900/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-800 hover:bg-red-500/20 transition-colors">
          <LogOut size={18} className="text-red-400" />
        </button>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
        <button className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-emerald-600 transition-colors"><MapPin size={20} className="text-emerald-400" /></button>
        <button className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-slate-800 transition-colors"><Plus size={20} className="text-white" /></button>
        <button className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-slate-800 transition-colors"><Minus size={20} className="text-white" /></button>
      </div>

      <div className="absolute top-[180px] sm:top-4 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] flex items-center gap-3 px-4 py-3 shadow-lg border border-slate-800">
          <Search size={20} className="text-gray-400" />
          <input type="text" placeholder="Search assigned buildings..." className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder:text-gray-500" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <BottomSheet 
          stop={currentStop} 
          isArrived={isArrived} 
          onComplete={handleCompletePickup} 
          onSkip={() => setShowSkipModal(true)} 
        />
      </div>

      {/* Skip Reason Modal */}
      <SkipReasonModal 
        isOpen={showSkipModal} 
        onClose={() => setShowSkipModal(false)} 
        onSubmit={handleSkipSubmit} 
      />
    </div>
  );
}