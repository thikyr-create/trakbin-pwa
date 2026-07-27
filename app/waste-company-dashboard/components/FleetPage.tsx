"use client";

import { Truck, Plus, Hash, Users } from 'lucide-react';

interface FleetPageProps {
  trucks: any[];
  search: string;
  setSearch: (value: string) => void;
  setShowTruckModal: (show: boolean) => void;
  onSelectTruck: (truck: any) => void;
}

export default function FleetPage({ trucks, search, setSearch, setShowTruckModal, onSelectTruck }: FleetPageProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'active') return { label: 'ACTIVE', color: 'bg-green-100 text-green-700' };
    if (status === 'maintenance') return { label: 'MAINTENANCE', color: 'bg-orange-100 text-orange-700' };
    return { label: 'IDLE', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search trucks by ID, plate, or driver..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-bold text-black placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none shadow-sm" 
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs font-black text-gray-500 uppercase">{trucks.length} Trucks Found</p>
          <button 
            onClick={() => setShowTruckModal(true)} 
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-green-700 transition-all"
          >
            <Plus size={16} /> Add Truck
          </button>
        </div>
      </div>
      
      {trucks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-500">No trucks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck: any) => {
            const badge = getStatusBadge(truck.status);
            return (
              <div 
                key={truck.id} 
                onClick={() => onSelectTruck(truck)} 
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase">{truck.truck_id}</h3>
                <p className="text-xs font-bold text-gray-500 uppercase mt-1">{truck.license_plate}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-500 uppercase">Driver</span>
                    <span className="text-xs font-bold text-gray-900">{truck.driver_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-500 uppercase">Type</span>
                    <span className="text-xs font-bold text-gray-900">{truck.truck_type}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { Search, X } from 'lucide-react';