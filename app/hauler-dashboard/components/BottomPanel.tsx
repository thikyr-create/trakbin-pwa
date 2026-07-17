"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Package, DollarSign, Users, Navigation, AlertTriangle, Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import SwipeButton from './SwipeButton';
import { useState } from 'react';

export default function BottomPanel() {
  const { 
    currentStop, 
    isArrived, 
    completePickup, 
    setShowSkipModal,
    searchQuery,
    geocodeResults,
    setSearchQuery,
    searchGeocode,
    selectGeocodeResult,
    setIsSearchFocused
  } = useDriverSession();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleNavigate = () => {
    if (!currentStop || !currentStop.latitude || !currentStop.longitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchGeocode(value);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl shadow-2xl border-t border-slate-800 z-20 max-h-[70vh]"
      style={{ touchAction: 'none' }}
    >
      {/* Drag Handle */}
      <div 
        className="w-full flex justify-center pt-3 pb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
      </div>

      <div className="px-5 pb-5 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showSearch ? (
            // 🔍 SEARCH VIEW
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <button onClick={closeSearch} className="p-2 hover:bg-slate-800 rounded-full">
                  <X size={20} className="text-gray-400" />
                </button>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search buildings, streets, landmarks..."
                  className="flex-1 bg-transparent text-white text-base font-medium outline-none placeholder:text-gray-500"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {geocodeResults && geocodeResults.length > 0 ? (
                  geocodeResults.map((result, index) => (
                    <button
                      key={result.id || index}
                      onClick={() => {
                        selectGeocodeResult(result);
                        closeSearch();
                      }}
                      className="w-full flex items-start gap-3 p-3 hover:bg-slate-800 rounded-xl transition-colors text-left border border-slate-800 hover:border-slate-700"
                    >
                      {result.type === 'building' ? (
                        <MapPin size={18} className="text-emerald-400 mt-0.5" />
                      ) : (
                        <Search size={18} className="text-blue-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{result.place_name}</p>
                        <p className="text-xs text-gray-400">{result.type === 'building' ? 'Assigned Building' : 'Location on Map'}</p>
                      </div>
                    </button>
                  ))
                                ) : (
                  <div className="text-center py-8">
                    <Search size={32} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {searchQuery.trim() ? 'No results found' : ''}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            //  MINIMAL VIEW (Default)
            <motion.div
              key="minimal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Search Bar */}
              <div className="relative">
                <button 
                  onClick={() => setShowSearch(true)}
                  className="w-full bg-slate-800/80 hover:bg-slate-800 rounded-2xl flex items-center gap-3 px-5 py-4 border border-slate-700 transition-all shadow-lg"
                >
                  <Search size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-400 font-medium flex-1 text-left">
                    {currentStop ? `Going to ${currentStop.building_id}` : 'Search buildings or places...'}
                  </span>
                  <ChevronUp size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Show Current Stop Info */}
              {currentStop && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${isArrived ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 font-bold uppercase">{isArrived ? 'Arrived at' : 'Next Stop'}</p>
                      <p className="text-sm font-black text-white">{currentStop.building_id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
                  >
                    <ChevronUp size={20} className="text-white" />
                  </button>
                </motion.div>
              )}

              {/* Quick Actions when Arrived */}
              {currentStop && isArrived && (
                <div className="space-y-2">
                  <SwipeButton onSwipe={completePickup} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleNavigate} className="flex items-center justify-center gap-2 py-3 bg-blue-600/20 text-blue-400 font-bold rounded-xl text-xs uppercase hover:bg-blue-600/30 transition-colors border border-blue-600/50">
                      <Navigation size={14} /> Navigate
                    </button>
                    <button onClick={() => setShowSkipModal(true)} className="flex items-center justify-center gap-2 py-3 bg-red-600/20 text-red-400 font-bold rounded-xl text-xs uppercase hover:bg-red-600/30 transition-colors border border-red-600/50">
                      <AlertTriangle size={14} /> Report
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && currentStop && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-slate-800"
                >
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Users size={10} /> Occupancy</p>
                      <p className="text-sm font-black text-white mt-1">{currentStop.occupancy || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Package size={10} /> Est. Waste</p>
                      <p className="text-sm font-black text-white mt-1">{currentStop.estimated_waste || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><DollarSign size={10} /> Payment</p>
                      <p className={`text-sm font-black mt-1 ${currentStop.payment_status === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>{currentStop.payment_status?.toUpperCase() || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Waste Type</p>
                      <p className="text-sm font-black text-white mt-1">{currentStop.waste_type || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsExpanded(false)}
                    className="w-full py-3 bg-slate-800 text-gray-400 font-bold rounded-xl text-sm uppercase hover:bg-slate-700 transition-colors"
                  >
                    <ChevronDown size={18} className="inline mr-2" />
                    Collapse
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}